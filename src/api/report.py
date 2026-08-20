"""
Public report endpoints — no auth required.

Routes:
    POST   /reports               Submit a new hazard report
    GET    /reports               List reports with filters
    GET    /reports/{report_id}   Get a report by ID
"""

from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, Request, status

from db import reports as report_db
from schemas.report import ReportCategory, ReportSeverity, ReportStatus

router = APIRouter(prefix="/reports", tags=["Reports"])


# ── POST /reports ─────────────────────────────────────────────────────────────

@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_report(request: Request):
    body = await request.json()
    record = report_db.create_report(body)
    return {
        "status": True,
        "message": "Report submitted successfully.",
        "data": record,
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
    result = report_db.get_all_reports(
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
    record = report_db.get_report_by_id(report_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{report_id}' not found.",
        )
    return {"status": True, "data": record}
