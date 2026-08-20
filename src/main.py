from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.org import router as org_router
from api.report import router as report_router
@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀  HazardWire v0.1.0 starting.")
    yield
    print(f"🛑  HazardWire shutting down.")


app = FastAPI(
    title="HazardWire",
    version="0.1.0",
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

app.include_router(report_router, prefix="/api/v1")
app.include_router(org_router, prefix="/api/v1")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"status": False, "message": "Internal server error.", "detail": str(exc)},
    )


@app.get("/", tags=["Health"])
async def root():
    return {"app": "HazardWire", "version": "0.1.0", "status": "ok", "docs": "/docs"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
