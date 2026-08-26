import uuid

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import JSONResponse

from core.client import supabase
from core.types import ReportFilter, ReportSubmit
from users import reports as user_reports

router = APIRouter(prefix="/reports")


@router.post("")
async def create_report(form: ReportSubmit):
    result = user_reports.create_report(
        title=form.title,
        description=form.description,
        latitude=form.latitude,
        longitude=form.longitude,
        category=form.category.value if form.category else None,
        severity=form.severity.value if form.severity else None,
        media_urls=form.media_urls,
        contact_email=form.contact_email,
        contact_phone=form.contact_phone,
        token=form.token,
    )
    return JSONResponse({"status": result.status, "result": result.result})


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        ext = file.filename.split(".")[-1].lower() if file.filename else "jpg"
        if ext not in ["jpg", "jpeg", "png", "webp"]:
            ext = "jpg"

        filename = f"new_{uuid.uuid4()}.{ext}"
        content = await file.read()

        supabase.storage.from_("hazard-images").upload(
            path=filename,
            file=content,
            file_options={
                "content-type": file.content_type or "image/jpeg",
                "upsert": "true",
            },
        )

        public_url = supabase.storage.from_("hazard-images").get_public_url(filename)

        return JSONResponse({"status": True, "result": {"url": public_url}})
    except Exception as e:
        return JSONResponse({"status": False, "result": str(e)})


@router.get("")
async def get_reports(form: ReportFilter = Depends()):
    result = user_reports.get_reports(
        title=form.title,
        category=form.category.value if form.category else None,
        severity=form.severity.value if form.severity else None,
        status=form.status.value if form.status else None,
        authority=form.authority,
        page=form.page,
        page_size=form.page_size,
    )
    return JSONResponse({"status": result.status, "result": result.result})


@router.get("/{report_id}")
async def get_report(report_id: str):
    result = user_reports.get_report_by_id(report_id)
    return JSONResponse({"status": result.status, "result": result.result})


@router.get("/by-token/{token}")
async def get_report_by_token(token: str):
    result = user_reports.get_report_by_token(token)
    return JSONResponse({"status": result.status, "result": result.result})


@router.get("/{report_id}/updates")
async def get_report_updates(report_id: str):
    result = user_reports.get_report_updates(report_id)
    return JSONResponse({"status": result.status, "result": result.result})
