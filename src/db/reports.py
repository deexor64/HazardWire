"""
Report DB operations — Supabase table queries.

Table DDL (run once in Supabase SQL editor):

    create table public.reports (
        id              uuid primary key default gen_random_uuid(),
        title           text not null,
        description     text not null,
        category        text,
        severity        text,
        status          text not null default 'pending',
        authority       uuid references public.organizations(id) on delete set null,
        latitude        double precision,
        longitude       double precision,
        media_urls      text[],
        contact_email   text,
        contact_phone   text,
        comments        text,
        submitted_at    timestamptz not null default now(),
        updated_at      timestamptz not null default now()
    );

    -- Public read: anyone can view reports
    alter table public.reports enable row level security;

    create policy "reports_public_read" on public.reports
        for select to anon, authenticated
        using (true);

    create policy "reports_public_insert" on public.reports
        for insert to anon, authenticated
        with check (true);
"""

from datetime import datetime

from core.client import supabase


def add_report_to_queue(
    title: str,
    description: str | None = None,
    category: str | None = None,
    severity: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    media_urls: list[str] | None = None,
    contact_email: str | None = None,
    contact_phone: str | None = None,
):
    response = (
        supabase.schema("pgmq_public")
        .rpc(
            "send",
            {
                "queue_name": "reports",
                "message": {
                    "title": title,
                    "description": description,
                    "category": category,
                    "severity": severity,
                    "latitude": latitude,
                    "longitude": longitude,
                    "media_urls": media_urls,
                    "contact_email": contact_email,
                    "contact_phone": contact_phone,
                },
                "sleep_seconds": 30,
            },
        )
        .execute()
    )

    return response


# Used by the background worker
def create_report(
    title: str,
    description: str | None = None,
    category: str | None = None,
    severity: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    media_urls: list[str] | None = None,
    contact_email: str | None = None,
    contact_phone: str | None = None,
) -> dict:
    data = {
        "title": title,
        "description": description,
        "category": category,
        "severity": severity,
        "latitude": latitude,
        "longitude": longitude,
        "media_urls": media_urls,
        "contact_email": contact_email,
        "contact_phone": contact_phone,
    }
    data = {k: v for k, v in data.items() if v is not None}
    response = supabase.table("reports").insert(data).execute()
    return response.data[0]


def get_report_by_id(report_id: str) -> dict | None:
    """Fetch a single report by UUID. Returns None if not found."""
    response = (
        supabase.table("reports")
        .select("*")
        .eq("id", report_id)
        .maybe_single()
        .execute()
    )
    return response.data


def get_all_reports(
    *,
    category: str | None = None,
    severity: str | None = None,
    status: str | None = None,
    authority: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    lat: float | None = None,
    lng: float | None = None,
    radius_km: float | None = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """
    Paginated report listing with optional filters.
    Proximity filter (lat/lng/radius_km) is not yet supported — requires
    PostGIS or earthdistance extension on the Supabase project.
    """
    query = supabase.table("reports").select("*", count="exact")

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

    return {
        "total": response.count or 0,
        "page": page,
        "page_size": page_size,
        "results": response.data or [],
    }
