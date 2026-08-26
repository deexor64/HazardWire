import time
from datetime import datetime, timezone

from .ai import analyze_report
from .core.client import supabase


def analyze_report_with_ai(title: str, description: str) -> dict:
    text = (title + " " + description).lower()

    if any(word in text for word in ["pothole", "road", "crack", "asphalt", "highway"]):
        category, severity, authority_type = "road", "medium", "road"
    elif any(word in text for word in ["water", "leak", "pipe", "flood", "drain"]):
        category, severity, authority_type = "water", "high", "water"
    elif any(
        word in text for word in ["electric", "wire", "power", "transformer", "current"]
    ):
        category, severity, authority_type = "electricity", "high", "electricity"
    elif any(word in text for word in ["garbage", "trash", "waste", "dump"]):
        category, severity, authority_type = "garbage", "low", "garbage"
    else:
        category, severity, authority_type = "other", "medium", "other"

    return {
        "category": category,
        "severity": severity,
        "authority_type": authority_type,
        "cleaned_description": description,
        "summary": f"Detected as {category} issue with {severity} severity",
    }


def find_organization(authority_type: str):
    if not authority_type or authority_type == "other":
        return None

    try:
        res = (
            supabase.table("organizations")
            .select("id")
            .ilike("authority_type", f"%{authority_type}%")
            .limit(1)
            .execute()
        )
        if res.data and len(res.data) > 0:
            return res.data[0]["id"]

        res = (
            supabase.table("organizations")
            .select("id")
            .ilike("name", f"%{authority_type}%")
            .limit(1)
            .execute()
        )
        if res.data and len(res.data) > 0:
            return res.data[0]["id"]
    except Exception as e:
        print(f"  Organization lookup failed: {e}")

    return None


def get_pending_jobs(limit: int = 5):
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


def lock_job(job_id: int):
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


def complete_job(job_id: int):
    try:
        supabase.table("jobs").update({"status": "done"}).eq("id", job_id).execute()
    except Exception as e:
        print(f"  Failed to complete job {job_id}: {e}")


def fail_job(job_id: int):
    try:
        supabase.table("jobs").update({"status": "failed"}).eq("id", job_id).execute()
    except Exception as e:
        print(f"  Failed to fail job {job_id}: {e}")


def process_job(job: dict):
    job_id = job["id"]
    report_id = job["report_id"]

    print(f"Processing job {job_id} for report {report_id}")

    try:
        lock_job(job_id)

        # 1. Get the report
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

        # 2. Analyze (text + images)
        image_urls = report.get("media_urls") or report.get("raw_media_urls") or []
        analysis = analyze_report(
            title=report.get("title") or "",
            description=report.get("description") or "",
            image_urls=image_urls,
        )

        # 3. Find organization (can be None — that's OK)
        authority_id = find_organization(analysis["authority_type"])

        # 4. Prepare update
        update_data = {
            "category": analysis["category"],
            "severity": analysis["severity"],
            "description": analysis["cleaned_description"],
            "ai_analysis": analysis,
            "status": "assigned" if authority_id else "pending",
            "analyzed_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        if authority_id:
            update_data["authority_id"] = authority_id
            print(f"  → Assigned to organization {authority_id}")
        else:
            print(
                f"  → No matching organization for '{analysis['authority_type']}' (leaving unassigned)"
            )

        # 5. Update report
        supabase.table("reports").update(update_data).eq("id", report_id).execute()

        complete_job(job_id)
        print(f"Job {job_id} done → {analysis['category']} / {analysis['severity']}")

    except Exception as e:
        print(f"Job {job_id} failed: {e}")
        fail_job(job_id)


def run_worker(poll_interval: int = 20):
    print("Worker started...")
    while True:
        jobs = get_pending_jobs()
        if not jobs:
            print("No pending jobs")
        for job in jobs:
            process_job(job)
        time.sleep(poll_interval)


if __name__ == "__main__":
    run_worker()
