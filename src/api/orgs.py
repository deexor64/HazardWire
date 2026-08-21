from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from supabase_auth import Session, User

from api.types import OrgProfileUpdate, OrgSignin, OrgSignup
from core.dependencies import get_current_user
from db import orgs

router = APIRouter(prefix="/orgs")


@router.post("/signup")
async def signup(form: OrgSignup) -> JSONResponse:
    # Signup
    result = orgs.signup(form.email, form.password)

    if not result.status:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"status": False, "result": result.result},
        )

    user: User = auth_res.result.get("user")
    session: Session = auth_res.result.get("session")

    # Create profile
    profile_res = orgs.create_profile(form.name, form.email)

    if not profile_res.status:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"status": False, "result": profile_res.result},
        )

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "status": True,
            "result": {
                "message": "Registration successful. Please check your email to confirm your account before logging in.",
                "id": user.id,
                "email": user.email,
                "access_token": session.access_token if session else None,
                "token_type": "bearer",
            },
        },
    )


@router.post("/signin")
async def signin(form: OrgSignin) -> JSONResponse:
    auth_res = orgs.signin(form.email, form.password)

    if not auth_res.status:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"status": False, "result": "Invalid email or password."},
        )

    user = auth_res.result.get("user")
    session = auth_res.result.get("session")

    if not user or not session:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"status": False, "result": "Invalid email or password."},
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": True,
            "result": {
                "id": str(user.id),
                "email": user.email,
                "access_token": session.access_token,
                "token_type": "bearer",
            },
        },
    )


@router.post("/logout")
async def logout(user: User = Depends(get_current_user)) -> JSONResponse:
    res = orgs.signout()
    return JSONResponse(
        status_code=status.HTTP_200_OK
        if res.status
        else status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": res.status,
            "result": res.result,
        },
    )


@router.get("/profile")
async def get_profile(user: User = Depends(get_current_user)) -> JSONResponse:
    res = orgs.get_profile_full(str(user.id))
    return JSONResponse(
        status_code=status.HTTP_200_OK if res.status else status.HTTP_404_NOT_FOUND,
        content={
            "status": res.status,
            "result": res.result,
        },
    )


@router.put("/profile")
async def update_profile(
    form: OrgProfileUpdate, user: User = Depends(get_current_user)
) -> JSONResponse:
    res = orgs.update_profile(
        user.id,
        form.name,
        form.authority_type,
        form.description,
        form.phone,
        form.address,
        form.website,
    )
    return JSONResponse(
        status_code=status.HTTP_200_OK if res.status else status.HTTP_400_BAD_REQUEST,
        content={
            "status": res.status,
            "result": res.result,
        },
    )


@router.delete("/profile")
async def delete_me(user: User = Depends(get_current_user)) -> JSONResponse:
    res = orgs.delete_profile(user.id)
    return JSONResponse(
        status_code=status.HTTP_200_OK
        if res.status
        else status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": res.status,
            "result": res.result,
        },
    )
