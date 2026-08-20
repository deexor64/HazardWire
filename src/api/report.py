from dataclasses import dataclass
from datetime import datetime
from enum import Enum

from fastapi import APIRouter, HTTPException, Query, Request, status

from db import reports

router = APIRouter(prefix="/reports")


class ReportCategory(str, Enum):
    ROAD = "road"
    DRAINAGE = "drainage"
    WATER = "water"
    ELECTRICITY = "electricity"
    GARBAGE = "garbage"
    ENVIRONMENT = "environment"
    ANIMALS = "animals"
    ACCIDENT = "accident"
    CRIME = "crime"
    OTHER = "other"


class ReportSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ReportStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"


@dataclass
class ReportSubmit:
    title: str
    description: str
    category: ReportCategory
    severity: ReportSeverity
    latitude: float | None = None
    longitude: float | None = None
    media_urls: list[str] | None = None
    contact_email: str | None = None
    contact_phone: str | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_report(form: ReportSubmit):
    title = form.title
    description = form.description
    category = form.category
    severity = form.severity
    latitude = form.latitude
    longitude = form.longitude
    media_urls = form.media_urls
    contact_email = form.contact_email
    contact_phone = form.contact_phone

    result = reports.add_report_to_queue(
        title,
        description,
        category.value if category else None,
        severity.value if severity else None,
        latitude,
        longitude,
        media_urls,
        contact_email,
        contact_phone,
    )
    return {
        "status": True,
        "message": "Report submitted successfully to the queue.",
        "data": {"title": title, "queued": True},
    }


# ── GET /reports ──────────────────────────────────────────────────────────────


@router.get("")
async def get_reports(
    category: ReportCategory | None = None,
    severity: ReportSeverity | None = None,
    status_filter: ReportStatus | None = Query(default=None, alias="status"),
    authority: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    lat: float | None = None,
    lng: float | None = None,
    radius_km: float | None = None,
    page: int = 1,
    page_size: int = Query(default=20, le=100),
):
    result = reports.get_all_reports(
        category=category.value if category else None,
        severity=severity.value if severity else None,
        status=status_filter.value if status_filter else None,
        authority=authority,
        date_from=date_from,
        date_to=date_to,
        lat=lat,
        lng=lng,
        radius_km=radius_km,
        page=page,
        page_size=page_size,
    )
    return {
        "status": True,
        "message": f"{result['total']} report(s) found.",
        "data": result,
    }


# ── GET /reports/{report_id} ──────────────────────────────────────────────────


@router.get("/{report_id}")
async def get_report(report_id: str):
    record = reports.get_report_by_id(report_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{report_id}' not found.",
        )
    return {"status": True, "data": record}
