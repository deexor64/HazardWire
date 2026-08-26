from core.client import supabase
from core.types import DbResult


def signup(email: str, password: str) -> DbResult:
    try:
        res = supabase.auth.sign_up({"email": email, "password": password})
        if res.user is None:
            return DbResult(False, "Signup failed")
        return DbResult(True, res)
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
