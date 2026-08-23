from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from supabase_auth import User

from api.types import OrgProfileUpdate, OrgSignin, OrgSignup
from core.dependencies import get_current_user
from db import orgs

router = APIRouter(prefix="/orgs")


@router.post("/signup")
async def signup(form: OrgSignup):
    auth_res = orgs.signup(form.email, form.password)
    if not auth_res.status:
        return JSONResponse({"status": False, "result": auth_res.result})

    user = auth_res.result.user
    session = auth_res.result.session

    profile_res = orgs.create_profile(str(user.id), form.name, form.email)
    if not profile_res.status:
        return JSONResponse({"status": False, "result": profile_res.result})

    return JSONResponse(
        {
            "status": True,
            "result": {
                "id": str(user.id),
                "email": user.email,
                "access_token": session.access_token if session else None,
            },
        }
    )


@router.post("/signin")
async def signin(form: OrgSignin):
    res = orgs.signin(form.email, form.password)
    if not res.status:
        return JSONResponse({"status": False, "result": res.result})

    user = res.result.user
    session = res.result.session

    return JSONResponse(
        {
            "status": True,
            "result": {
                "id": str(user.id),
                "email": user.email,
                "access_token": session.access_token,
            },
        }
    )


@router.post("/logout")
async def logout(user: User = Depends(get_current_user)):
    res = orgs.signout()
    return JSONResponse({"status": res.status, "result": res.result})


@router.get("/profile")
async def get_profile(user: User = Depends(get_current_user)):
    res = orgs.get_profile(str(user.id))
    return JSONResponse({"status": res.status, "result": res.result})


@router.put("/profile")
async def update_profile(
    form: OrgProfileUpdate, user: User = Depends(get_current_user)
):
    data = {
        "name": form.name,
        "authority_type": form.authority_type,
        "description": form.description,
        "phone": form.phone,
        "address": form.address,
        "website": form.website,
    }
    res = orgs.update_profile(str(user.id), data)
    return JSONResponse({"status": res.status, "result": res.result})


@router.delete("/profile")
async def delete_profile(user: User = Depends(get_current_user)):
    res = orgs.delete_profile(str(user.id))
    return JSONResponse({"status": res.status, "result": res.result})
