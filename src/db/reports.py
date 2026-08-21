from datetime import datetime

from postgrest.base_request_builder import SingleAPIResponse

from core.client import supabase

from .types import DbResult


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
) -> SingleAPIResponse:
    return supabase.rpc(
        "enqueue_report",
        {
            "payload": {
                "title": title,
                "description": description,
                "category": category,
                "severity": severity,
                "latitude": latitude,
                "longitude": longitude,
                "media_urls": media_urls,
                "contact_email": contact_email,
                "contact_phone": contact_phone,
                "token": token,
            }
        },
    ).execute()


def get_reports(
    title: str | None = None,
    category: str | None = None,
    severity: str | None = None,
    status: str | None = None,
    authority: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    lattitude: float | None = None,
    longitude: float | None = None,
    radius_km: float | None = None,
    page: int = 1,
    page_size: int = 20,
) -> DbResult:
    if lattitude is not None and longitude is not None and radius_km is not None:
        try:
            response = supabase.rpc(
                "get_reports_proximity",
                {
                    "search_title": title,
                    "search_category": category,
                    "search_severity": severity,
                    "search_status": status,
                    "search_authority": authority,
                    "search_lat": lattitude,
                    "search_lng": longitude,
                    "search_radius_km": radius_km,
                    "page_number": page,
                    "page_size": page_size,
                },
            ).execute()

            data = response.data or []
            total = data[0]["total_count"] if data else 0

            for d in data:
                d.pop("total_count", None)

            return DbResult(
                status=True,
                result={
                    "total": total,
                    "page": page,
                    "page_size": page_size,
                    "results": data,
                },
            )
        except Exception as e:
            return DbResult(status=False, result=f"Proximity search error: {e}")

    # Standard query without proximity
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
        query = query.ilike("authority", f"%{authority}%")
    if date_from:
        query = query.gte("submitted_at", date_from.isoformat())
    if date_to:
        query = query.lte("submitted_at", date_to.isoformat())

    offset = (page - 1) * page_size
    response = (
        query.order("submitted_at", desc=True)
        .range(offset, offset + page_size - 1)
        .execute()
    )

    return DbResult(
        status=True,
        result={
            "total": response.count or 0,
            "page": page,
            "page_size": page_size,
            "results": response.data or [],
        },
    )


def get_report_by_id(report_id: str) -> SingleAPIResponse | None | Exception:
    return (
        supabase.table("reports")
        .select("*")
        .eq("id", report_id)
        .maybe_single()
        .execute()
    )


# Used by the background worker
# def create_report(
#     title: str,
#     description: str | None = None,
#     category: str | None = None,
#     severity: str | None = None,
#     latitude: float | None = None,
#     longitude: float | None = None,
#     media_urls: list[str] | None = None,
#     contact_email: str | None = None,
#     contact_phone: str | None = None,
# ) -> dict:
#     data = {
#         "title": title,
#         "description": description,
#         "category": category,
#         "severity": severity,
#         "latitude": latitude,
#         "longitude": longitude,
#         "media_urls": media_urls,
#         "contact_email": contact_email,
#         "contact_phone": contact_phone,
#     }
#     data = {k: v for k, v in data.items() if v is not None}
#     response = supabase.table("reports").insert(data).execute()
#     return response.data[0]
