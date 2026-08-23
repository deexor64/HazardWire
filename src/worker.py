import json
import time
from datetime import datetime, timezone

from .core.client import supabase


# You can later switch to OpenAI / Gemini. For now we use a simple placeholder.
# Replace this function with real LLM call later.
def analyze_report_with_ai(title: str, description: str) -> dict:
    """
    Minimal AI analysis.
    Later replace this with real Gemini / OpenAI call.
    """
    text = (title + " " + description).lower()

    # Very basic keyword matching (temporary)
    if any(word in text for word in ["pothole", "road", "crack", "asphalt"]):
        category = "road"
        severity = "medium"
        authority_type = "road"
    elif any(word in text for word in ["water", "leak", "pipe", "flood"]):
        category = "water"
        severity = "high"
        authority_type = "water"
    elif any(word in text for word in ["electric", "wire", "power", "transformer"]):
        category = "electricity"
        severity = "high"
        authority_type = "electricity"
    elif any(word in text for word in ["garbage", "trash", "waste", "dump"]):
        category = "garbage"
        severity = "low"
        authority_type = "garbage"
    else:
        category = "other"
        severity = "medium"
        authority_type = "other"

    return {
        "category": category,
        "severity": severity,
        "authority_type": authority_type,
        "cleaned_description": description,
        "summary": f"Detected as {category} issue with {severity} severity",
    }


def get_pending_jobs(limit: int = 5):
    res = (
        supabase.table("jobs")
        .select("*")
        .eq("status", "pending")
        .order("created_at")
        .limit(limit)
        .execute()
    )
    return res.data or []


def lock_job(job_id: int):
    # Get current attempts
    current = (
        supabase.table("jobs").select("attempts").eq("id", job_id).single().execute()
    )
    attempts = current.data["attempts"] + 1 if current.data else 1

    supabase.table("jobs").update(
        {
            "status": "processing",
            "locked_at": datetime.now(timezone.utc).isoformat(),
            "attempts": attempts,
        }
    ).eq("id", job_id).execute()


def complete_job(job_id: int):
    supabase.table("jobs").update({"status": "done"}).eq("id", job_id).execute()


def fail_job(job_id: int):
    supabase.table("jobs").update({"status": "failed"}).eq("id", job_id).execute()


def process_job(job: dict):
    job_id = job["id"]
    report_id = job["report_id"]

    print(f"Processing job {job_id} for report {report_id}")

    try:
        lock_job(job_id)

        # 1. Get the report
        report_res = (
            supabase.table("reports").select("*").eq("id", report_id).single().execute()
        )
        report = report_res.data

        if not report:
            raise Exception("Report not found")

        # 2. Run AI analysis
        analysis = analyze_report_with_ai(
            title=report.get("title", ""), description=report.get("description", "")
        )

        # 3. Update the report
        supabase.table("reports").update(
            {
                "category": analysis["category"],
                "severity": analysis["severity"],
                "description": analysis["cleaned_description"],
                "ai_analysis": analysis,
                "status": "assigned",  # for now we set assigned
                "analyzed_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("id", report_id).execute()

        complete_job(job_id)
        print(f"Job {job_id} done → {analysis['category']} / {analysis['severity']}")

    except Exception as e:
        print(f"Job {job_id} failed: {e}")
        fail_job(job_id)


def run_worker(poll_interval: int = 5):
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
