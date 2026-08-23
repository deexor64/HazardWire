from core.client import supabase

from .types import DbResult


def signup(email: str, password: str) -> DbResult:
    try:
        res = supabase.auth.sign_up({"email": email, "password": password})
        if res.user is None:
            return DbResult(False, "Signup failed")
        return DbResult(True, res)
    except Exception as e:
        return DbResult(False, str(e))


def create_profile(user_id: str, name: str, email: str) -> DbResult:
    try:
        res = (
            supabase.table("organizations")
            .insert(
                {
                    "id": user_id,
                    "name": name,
                    "email": email,
                }
            )
            .execute()
        )
        return DbResult(True, res.data)
    except Exception as e:
        return DbResult(False, str(e))


def signin(email: str, password: str) -> DbResult:
    try:
        res = supabase.auth.sign_in_with_password(
            {"email": email, "password": password}
        )
        if res.user is None or res.session is None:
            return DbResult(False, "Invalid email or password")
        return DbResult(True, res)
    except Exception as e:
        return DbResult(False, str(e))


def signout() -> DbResult:
    try:
        supabase.auth.sign_out()
        return DbResult(True, "Logged out")
    except Exception as e:
        return DbResult(False, str(e))


def get_profile(org_id: str) -> DbResult:
    try:
        res = (
            supabase.table("organizations")
            .select("*")
            .eq("id", org_id)
            .maybe_single()
            .execute()
        )
        if res.data is None:
            return DbResult(False, "Profile not found")
        return DbResult(True, res.data)
    except Exception as e:
        return DbResult(False, str(e))


def update_profile(org_id: str, data: dict) -> DbResult:
    try:
        # remove None values
        clean = {k: v for k, v in data.items() if v is not None}
        res = supabase.table("organizations").update(clean).eq("id", org_id).execute()
        return DbResult(True, res.data)
    except Exception as e:
        return DbResult(False, str(e))


def delete_profile(org_id: str) -> DbResult:
    try:
        res = supabase.table("organizations").delete().eq("id", org_id).execute()
        return DbResult(True, res.data)
    except Exception as e:
        return DbResult(False, str(e))
