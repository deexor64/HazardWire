import time
from datetime import datetime, timezone

from .ai import analyze_report
from .core.client import supabase
from .geo import haversine_km, org_lat_lng, reverse_geocode
from .images import process_report_images


def get_pending_jobs(limit: int = 5) -> list:
    try:
        res = (
            supabase.table("jobs")
            .select("*")
            .eq("status", "pending")
            .order("created_at")
            .limit(limit)
            .execute()
        )
        return res.data or []
    except Exception as e:
        print(f"Failed to fetch jobs: {e}")
        return []


def lock_job(job_id: str) -> None:
    try:
        current = (
            supabase.table("jobs")
            .select("attempts")
            .eq("id", job_id)
            .maybe_single()
            .execute()
        )
        attempts = 1
        if current and current.data:
            attempts = (current.data.get("attempts") or 0) + 1

        supabase.table("jobs").update(
            {
                "status": "processing",
                "locked_at": datetime.now(timezone.utc).isoformat(),
                "attempts": attempts,
            }
        ).eq("id", job_id).execute()
    except Exception as e:
        print(f"  Failed to lock job {job_id}: {e}")


def complete_job(job_id: str) -> None:
    try:
        supabase.table("jobs").update({"status": "done"}).eq("id", job_id).execute()
    except Exception as e:
        print(f"  Failed to complete job {job_id}: {e}")


def fail_job(job_id: str) -> None:
    try:
        supabase.table("jobs").update({"status": "failed"}).eq("id", job_id).execute()
    except Exception as e:
        print(f"  Failed to fail job {job_id}: {e}")


def find_organization(
    report_lat: float,
    report_lng: float,
    report_geo: dict,
    match_keywords: list[str],
    category: str,
) -> tuple[str | None, str]:
    """
    Score organizations by keyword/coverage overlap and distance.
    Returns (org_id or None, human-readable reason).
    """
    try:
        res = (
            supabase.table("organizations")
            .select(
                "id, name, keywords, responsibilities, coverage_region, coverage_areas, geo"
            )
            .execute()
        )
        orgs = res.data or []
    except Exception as e:
        print(f"  org fetch failed: {e}")
        return None, f"Organization lookup failed: {e}"

    if not orgs:
        return None, "No organizations registered in the system."

    needles = set(k.lower() for k in (match_keywords or []))
    needles.add(category.lower())
    for key in ("road", "suburb", "city", "state"):
        val = (report_geo or {}).get(key)
        if val:
            needles.add(str(val).lower())

    best_id = None
    best_name = None
    best_score = -1.0
    best_hits: list[str] = []
    best_dist = None

    for org in orgs:
        score = 0.0
        hit_list: list[str] = []

        blob = " ".join(
            [
                org.get("name") or "",
                org.get("coverage_region") or "",
                " ".join(org.get("keywords") or []),
                " ".join(org.get("responsibilities") or []),
                " ".join(org.get("coverage_areas") or []),
            ]
        ).lower()

        for n in needles:
            if n and n in blob:
                score += 10
                hit_list.append(n)

        pair = org_lat_lng(org)
        dist = None
        if pair:
            dist = haversine_km(report_lat, report_lng, pair[0], pair[1])
            score += max(0.0, 30.0 - dist)
        else:
            score -= 5.0

        if score > best_score:
            best_score = score
            best_id = org["id"]
            best_name = org.get("name") or org["id"]
            best_hits = hit_list
            best_dist = dist

    if best_score < 5 or not best_id:
        return None, (
            f"No organisation scored high enough (best score {best_score:.1f}). "
            "Left unassigned."
        )

    parts = [f"Assigned to {best_name}"]
    if best_hits:
        parts.append("matched terms: " + ", ".join(best_hits[:8]))
    if best_dist is not None:
        parts.append(f"distance ~{best_dist:.1f} km from organisation HQ")
    parts.append(f"score {best_score:.1f}")
    return best_id, ". ".join(parts) + "."


def process_job(job: dict) -> None:
    job_id = job["id"]
    report_id = job["report_id"]
    print(f"Processing job {job_id} for report {report_id}")

    try:
        lock_job(job_id)

        report_res = (
            supabase.table("reports")
            .select("*")
            .eq("id", report_id)
            .maybe_single()
            .execute()
        )
        report = report_res.data if report_res else None
        if not report:
            raise Exception("Report not found")

        lat = float(report["latitude"])
        lng = float(report["longitude"])
        raw_paths = report.get("raw_image_urls") or []

        # Duplicate check
        print("  Checking duplicates...")
        duplicates = find_duplicates(report_id, lat, lng, radius_km=0.3)
        dup_info = [
            {
                "id": d["id"],
                "title": d.get("title"),
                "status": d.get("status"),
                "category": d.get("category"),
                "distance_km": d["distance_km"],
            }
            for d in duplicates
        ]

        # 1) Privacy blur → public image_urls
        privacy = {"blurred": False, "faces": 0, "plates": 0}
        image_urls: list[str] = list(report.get("image_urls") or [])
        if raw_paths:
            print("  Processing images (privacy blur)...")
            img_result = process_report_images(raw_paths)
            image_urls = img_result["processed_urls"] or image_urls
            privacy = img_result["privacy"]
            print(f"  Privacy: faces={privacy['faces']}")

        # 2) Geo for report
        print("  Reverse geocoding...")
        geo = reverse_geocode(lat, lng)
        time.sleep(1)  # Nominatim polite use

        # 3) AI
        analysis = analyze_report(
            title=report.get("title") or "",
            description=report.get("description") or "",
            image_urls=image_urls,
            geo=geo,
        )
        analysis["privacy"] = privacy
        analysis["geo"] = geo

        category = analysis["category"]
        priority = analysis["priority"]

        # 4) Assign org (geo + keywords)
        org_id, routing_reason = find_organization(
            report_lat=lat,
            report_lng=lng,
            report_geo=geo,
            match_keywords=analysis.get("match_keywords") or [],
            category=category,
        )
        analysis["routing_reason"] = routing_reason

        analysis["duplicates"] = dup_info
        analysis["possible_duplicate"] = len(dup_info) > 0

        update = {
            "category": category,
            "priority": priority,
            "analysis": analysis,
            "geo": geo,
            "image_urls": image_urls,
            "status": "ASSIGNED" if org_id else "PENDING",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if org_id:
            update["org_id"] = org_id
            print(f"  → {routing_reason}")
        else:
            print(f"  → {routing_reason}")

        supabase.table("reports").update(update).eq("id", report_id).execute()
        complete_job(job_id)
        print(f"Job {job_id} done → {category} / {priority}")

    except Exception as e:
        print(f"Job {job_id} failed: {e}")
        fail_job(job_id)


def find_duplicates(
    report_id: str,
    lat: float,
    lng: float,
    radius_km: float = 0.3,
    limit: int = 5,
) -> list[dict]:
    """
    Nearby reports that are still open (not RESOLVED/CLOSED).
    Uses bounding box then haversine filter.
    """
    # ~0.3 km box in degrees (rough)
    d = radius_km / 111.0
    try:
        res = (
            supabase.table("reports")
            .select("id, title, status, category, latitude, longitude")
            .neq("id", report_id)
            .neq("status", "RESOLVED")
            .neq("status", "CLOSED")
            .gte("latitude", lat - d)
            .lte("latitude", lat + d)
            .gte("longitude", lng - d)
            .lte("longitude", lng + d)
            .limit(30)
            .execute()
        )
        rows = res.data or []
    except Exception as e:
        print(f"  duplicate query failed: {e}")
        return []

    out = []
    for r in rows:
        try:
            dist = haversine_km(lat, lng, float(r["latitude"]), float(r["longitude"]))
        except Exception:
            continue
        if dist <= radius_km:
            out.append({**r, "distance_km": round(dist, 3)})
    out.sort(key=lambda x: x["distance_km"])
    return out[:limit]


def run_worker(poll_interval: int = 20) -> None:
    print("Worker started...")
    while True:
        jobs = get_pending_jobs()
        if not jobs:
            print("No pending jobs")
        for job in jobs:
            process_job(job)
        time.sleep(poll_interval)
