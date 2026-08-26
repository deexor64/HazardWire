from hashlib import sha256

from core.client import supabase
from core.types import DbResult


def create_report(
    title: str,
    description: str,
    latitude: float,
    longitude: float,
    category: str | None = None,
    severity: str | None = None,
    media_urls: list[str] | None = None,
    contact_email: str | None = None,
    contact_phone: str | None = None,
    token: str | None = None,
) -> DbResult:
    try:
        token_hash = sha256(token.encode()).hexdigest() if token else None

        # 1. Insert the report
        report_data = {
            "public_token_hash": token_hash,
            "title": title,
            "description": description,
            "category": category,
            "severity": severity,
            "latitude": latitude,
            "longitude": longitude,
            "contact_email": contact_email,
            "contact_phone": contact_phone,
            "raw_media_urls": media_urls or [],
            "status": "pending",
        }

        report_res = supabase.table("reports").insert(report_data).execute()
        if not report_res.data:
            return DbResult(False, "Failed to create report")

        report = report_res.data[0]
        report_id = report["id"]

        # 2. Create a job for the worker
        job_res = (
            supabase.table("jobs")
            .insert(
                {
                    "report_id": report_id,
                    "payload": {
                        "report_id": report_id,
                        "raw_media_urls": media_urls or [],
                    },
                    "status": "pending",
                }
            )
            .execute()
        )

        return DbResult(
            True,
            {
                "id": report_id,
                "title": title,
                "status": "pending",
                "queued": True if job_res.data else False,
            },
        )
    except Exception as e:
        return DbResult(False, str(e))


def get_reports(
    title: str | None = None,
    category: str | None = None,
    severity: str | None = None,
    status: str | None = None,
    authority: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> DbResult:
    try:
        query = supabase.table("reports").select("*", count="exact")

        if title:
            query = query.ilike("title", f"%{title}%")
        if category:
            query = query.eq("category", category)
        if severity:
            query = query.eq("severity", severity)
        if status:
            query = query.eq("status", status)
        if authority:
            query = query.eq("authority_id", authority)

        offset = (page - 1) * page_size
        res = (
            query.order("submitted_at", desc=True)
            .range(offset, offset + page_size - 1)
            .execute()
        )

        return DbResult(
            True,
            {
                "total": res.count or 0,
                "page": page,
                "page_size": page_size,
                "results": res.data or [],
            },
        )
    except Exception as e:
        return DbResult(False, str(e))


def get_report_by_id(report_id: str) -> DbResult:
    try:
        res = (
            supabase.table("reports")
            .select("*")
            .eq("id", report_id)
            .maybe_single()
            .execute()
        )
        if res.data is None:
            return DbResult(False, "Report not found")
        return DbResult(True, res.data)
    except Exception as e:
        return DbResult(False, str(e))


def get_report_by_token(token: str) -> DbResult:
    try:
        token_hash = sha256(token.encode()).hexdigest()
        res = (
            supabase.table("reports")
            .select("*")
            .eq("public_token_hash", token_hash)
            .maybe_single()
            .execute()
        )
        if res.data is None:
            return DbResult(False, "Report not found")
        return DbResult(True, res.data)
    except Exception as e:
        return DbResult(False, str(e))


def get_report_updates(report_id: str) -> DbResult:
    try:
        res = (
            supabase.table("report_updates")
            .select("*")
            .eq("report_id", report_id)
            .order("created_at", desc=False)
            .execute()
        )
        return DbResult(True, res.data or [])
    except Exception as e:
        return DbResult(False, str(e))
