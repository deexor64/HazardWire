from dataclasses import dataclass
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from supabase_auth import User

from core.dependencies import get_current_user
from db import org

router = APIRouter(prefix="/orgs", tags=["Organizations"])


@dataclass
class OrgSignup:
    name: str
    email: str
    password: str


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(form: OrgSignup):
    name: str = form.name
    email: str = form.email
    password: str = form.password

    # Signup
    try:
        result = org.signup(email, password)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    user = result.get("user")
    session = result.get("session")

    # Create profile
    try:
        result = org.create_profile(name, email)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return JSONResponse(
        {
            "status": True,
            "message": "Registration successful. Please check your email to confirm your account before logging in.",
            "data": {
                "id": user.id,
                "email": user.email,
                "access_token": session.access_token if session else None,
                "token_type": "bearer",
            },
        }
    )


@dataclass
class OrgSignin:
    email: str
    password: str


@router.post("/signin")
async def signin(form: OrgSignin):
    email = form.email
    password = form.password

    try:
        result = org.signin(email, password)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = result.get("user")
    session = result.get("session")

    if not user or not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return JSONResponse(
        {
            "status": True,
            "message": "Login successful.",
            "data": {
                "id": str(user.id),
                "email": user.email,
                "access_token": session.access_token,
                "token_type": "bearer",
            },
        }
    )


@router.post("/logout")
async def logout(user: User = Depends(get_current_user)):
    try:
        org.signout()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return JSONResponse(
        {
            "status": True,
            "message": "Signed out successfully.",
        }
    )


@router.get("/profile")
async def get_profile(user: User = Depends(get_current_user)):
    result = org.get_profile_full(str(user.id))

    return JSONResponse(
        {
            "status": True,
            "data": result,
        }
    )


class AuthorityType(str, Enum):
    GOVERNMENT = "government"
    NON_GOVERNMENT = "non_government"
    OTHER = "other"


@dataclass
class OrgProfileUpdate:
    name: str
    authority_type: AuthorityType | None = None
    description: str | None = None
    phone: str | None = None
    address: str | None = None
    website: str | None = None


@router.put("/profile")
async def update_profile(
    form: OrgProfileUpdate, user: User = Depends(get_current_user)
):
    name = form.name
    authority_type = form.authority_type
    description = form.description
    phone = form.phone
    address = form.address
    website = form.website

    try:
        result = org.update_profile(
            user.id, name, authority_type, description, phone, address, website
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return JSONResponse(
        {
            "status": True,
            "message": "Profile updated.",
            "data": result,
        }
    )


@router.delete("/profile")
async def delete_me(user: User = Depends(get_current_user)):
    try:
        _ = org.delete_profile(user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return JSONResponse(
        {
            "status": True,
            "message": "Account deleted.",
        }
    )
