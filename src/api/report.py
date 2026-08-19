from types.report import Report

from fastapi import APIRouter

router = APIRouter()


@router.post("/report")
async def report(data: Report):
    return data

@router.get(f"/report")
async def report(date: str):
    return {"message": f"report {date}"}

@router.get(f"/report/{id}")
async def report(id: str):
    return {"message": f"report {id}"}
