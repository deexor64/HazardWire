from supabase_auth import AuthResponse

from core.client import supabase
from core.types import DbResult


def signup(email: str, password: str) -> DbResult[AuthResponse, str]:
    try:
        res = supabase.auth.sign_up({"email": email, "password": password})

        if res.user is None:
            return DbResult(False, "Signup failed")

        return DbResult(True, res)

    except Exception as e:
        print(e)
        return DbResult(False, "Signup failed")


def signin(email: str, password: str) -> DbResult[AuthResponse, str]:
    try:
        res = supabase.auth.sign_in_with_password(
            {"email": email, "password": password}
        )

        if res.user is None or res.session is None:
            return DbResult(False, "Invalid email or password")

        return DbResult(True, res)

    except Exception as e:
        print(e)
        return DbResult(False, "Signin failed")


def signout() -> DbResult[str, str]:
    try:
        _ = supabase.auth.sign_out()

        return DbResult(True, "Signout successful")

    except Exception as e:
        print(e)
        return DbResult(False, "Signout failed")
