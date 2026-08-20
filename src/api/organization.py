"""
Organisation auth + profile endpoints.

Routes:
    POST   /orgs/signup    Register (email + password) → access_token
    POST   /orgs/login     Login → access_token
    POST   /orgs/logout    Sign out (invalidates token)
    GET    /orgs/me        Get own profile
    PUT    /orgs/me        Update profile
    DELETE /orgs/me        Delete account
"""

import dataclasses

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse

from core.dependencies import get_current_user
from db import organizations as org_db
from schemas.api import APIResponse
from schemas.organization import OrgProfileUpdate, OrgSignup

router = APIRouter(prefix="/orgs", tags=["Organizations"])


def _serialize(obj) -> dict:
    """Convert a dataclass or supabase user object to a JSON-safe dict."""
    if dataclasses.is_dataclass(obj):
        return dataclasses.asdict(obj)
    if hasattr(obj, "__dict__"):
        return {k: v for k, v in obj.__dict__.items() if not k.startswith("_")}
    return dict(obj)


# ── POST /orgs/signup ─────────────────────────────────────────────────────────

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(request: Request):
    body = await request.json()
    email = body.get("email", "")
    password = body.get("password", "")

    try:
        result = org_db.sign_up(email, password)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    user = result["user"]
    session = result["session"]

    # Insert profile row
    try:
        org_db.create_profile(str(user.id), user.email)
    except Exception:
        pass  # Profile row may already exist or table not created yet

    requires_confirmation = session is None
    return JSONResponse(
        status_code=201,
        content={
            "status": True,
            "message": (
                "Registration successful. Please check your email to confirm your account before logging in."
                if requires_confirmation
                else "Organisation registered successfully."
            ),
            "data": {
                "access_token": session.access_token if session else None,
                "token_type": "bearer",
                "user_id": str(user.id),
                "email": user.email,
                "requires_email_confirmation": requires_confirmation,
            },
        },
    )


# ── POST /orgs/login ──────────────────────────────────────────────────────────

@router.post("/login")
async def login(request: Request):
    body = await request.json()
    email = body.get("email", "")
    password = body.get("password", "")

    try:
        result = org_db.sign_in(email, password)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = result["user"]
    session = result["session"]

    return {
        "status": True,
        "message": "Login successful.",
        "data": {
            "access_token": session.access_token,
            "token_type": "bearer",
            "user_id": str(user.id),
            "email": user.email,
        },
    }


# ── POST /orgs/logout ─────────────────────────────────────────────────────────

@router.post("/logout")
async def logout(auth: dict = Depends(get_current_user)):
    try:
        org_db.sign_out(auth["token"])
    except Exception:
        pass
    return {"status": True, "message": "Signed out successfully."}


# ── GET /orgs/me ──────────────────────────────────────────────────────────────

@router.get("/me")
async def get_me(auth: dict = Depends(get_current_user)):
    user = auth["user"]
    profile = org_db.get_profile(str(user.id))
    return {
        "status": True,
        "data": {
            "id": str(user.id),
            "email": user.email,
            "profile": profile,
        },
    }


# ── PUT /orgs/me ──────────────────────────────────────────────────────────────

@router.put("/me")
async def update_me(request: Request, auth: dict = Depends(get_current_user)):
    body = await request.json()
    user = auth["user"]

    updates = OrgProfileUpdate(
        name=body.get("name"),
        authority_type=body.get("authority_type"),
        description=body.get("description"),
        phone=body.get("phone"),
        address=body.get("address"),
        website=body.get("website"),
    )

    updated = org_db.update_profile(str(user.id), updates)
    return {
        "status": True,
        "message": "Profile updated.",
        "data": updated,
    }


# ── DELETE /orgs/me ───────────────────────────────────────────────────────────

@router.delete("/me")
async def delete_me(auth: dict = Depends(get_current_user)):
    user = auth["user"]
    org_db.delete_profile(str(user.id))
    return {"status": True, "message": "Account deleted."}
