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
) -> str | None:
    """
    Score organizations by:
      - distance from org.geo (if set)
      - keyword / responsibility / coverage text overlap
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
        return None

    if not orgs:
        return None

    needles = set(k.lower() for k in (match_keywords or []))
    needles.add(category.lower())
    for key in ("road", "suburb", "city", "state"):
        val = (report_geo or {}).get(key)
        if val:
            needles.add(str(val).lower())

    best_id = None
    best_score = -1.0

    for org in orgs:
        score = 0.0

        # Text overlap
        blob = " ".join(
            [
                org.get("name") or "",
                org.get("coverage_region") or "",
                " ".join(org.get("keywords") or []),
                " ".join(org.get("responsibilities") or []),
                " ".join(org.get("coverage_areas") or []),
            ]
        ).lower()

        hits = sum(1 for n in needles if n and n in blob)
        score += hits * 10

        # Distance (closer is better; org without geo gets small penalty)
        pair = org_lat_lng(org)
        if pair:
            dist = haversine_km(report_lat, report_lng, pair[0], pair[1])
            # within 50km preferred
            score += max(0.0, 30.0 - dist)
        else:
            score -= 5.0

        if score > best_score:
            best_score = score
            best_id = org["id"]

    # Require some signal
    if best_score < 5:
        return None
    return best_id


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
        org_id = find_organization(
            report_lat=lat,
            report_lng=lng,
            report_geo=geo,
            match_keywords=analysis.get("match_keywords") or [],
            category=category,
        )

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
            print(f"  → Assigned org {org_id}")
        else:
            print("  → No org match (left PENDING)")

        supabase.table("reports").update(update).eq("id", report_id).execute()
        complete_job(job_id)
        print(f"Job {job_id} done → {category} / {priority}")

    except Exception as e:
        print(f"Job {job_id} failed: {e}")
        fail_job(job_id)


def run_worker(poll_interval: int = 20) -> None:
    print("Worker started...")
    while True:
        jobs = get_pending_jobs()
        if not jobs:
            print("No pending jobs")
        for job in jobs:
            process_job(job)
        time.sleep(poll_interval)
