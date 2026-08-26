from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.orgs import router as org_router
from api.reports import router as report_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    print("🚀  App starting...")
    yield
    print("🛑  App shutting down...")


app = FastAPI(
    title="HazardWire",
    description="AI-powered civic hazard reporting & intelligent routing platform for Sri Lanka.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(report_router, prefix="/api")
app.include_router(org_router, prefix="/api")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"status": False, "result": f"Internal server error: {exc}"},
    )


@app.get("/")
async def root():
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "app": "HazardWire",
            "version": "0.1.0",
            "status": "ok",
            "docs": "/docs",
        },
    )


@app.get("/health")
async def health():
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"status": "ok"},
    )
