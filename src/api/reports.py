from hashlib import sha256

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from db import reports

from .types import ReportFilter, ReportSubmit

router = APIRouter(prefix="/reports")


@router.post("")
async def create_report(form: ReportSubmit) -> JSONResponse:
    result = reports.create_report(
        form.title,
        form.description,
        form.latitude,
        form.longitude,
        form.category,
        form.severity,
        form.media_urls,
        form.contact_email,
        form.contact_phone,
        sha256(form.token.encode()).hexdigest(),
    )

    return JSONResponse(
        status_code=status.HTTP_201_CREATED
        if result.status
        else status.HTTP_400_BAD_REQUEST,
        content={
            "status": result.status,
            "result": result.result,
        },
    )


@router.get("")
async def get_reports(form: ReportFilter) -> JSONResponse:
    result = reports.get_reports(
        title=form.title,
        category=form.category.value if form.category else None,
        severity=form.severity.value if form.severity else None,
        status=form.status.value if form.status else None,
        authority=form.authority,
        date_from=form.date_from,
        date_to=form.date_to,
        lattitude=form.latitude,
        longitude=form.longitude,
        radius_km=form.radius,
        page=form.page,
        page_size=form.page_size,
    )
    return JSONResponse(
        status_code=status.HTTP_200_OK
        if result.status
        else status.HTTP_400_BAD_REQUEST,
        content={
            "status": result.status,
            "result": result.result,
        },
    )


@router.get("/{report_id}")
async def get_report(report_id: str) -> JSONResponse:
    result = reports.get_report_by_id(report_id)
    return JSONResponse(
        status_code=status.HTTP_200_OK if result.status else status.HTTP_404_NOT_FOUND,
        content={
            "status": result.status,
            "result": result.result,
        },
    )
