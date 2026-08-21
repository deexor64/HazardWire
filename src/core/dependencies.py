"""
FastAPI dependency: extract and verify the Bearer token via Supabase Auth.

supabase.auth.get_user(jwt) validates the token against Supabase's JWKS
and returns the authenticated user. No local JWT secret needed.
"""

from fastapi import HTTPException, Request, status
from supabase_auth import User

from .client import supabase


def get_current_user(request: Request) -> User:
    """
    Reads the Bearer token from the Authorization header, validates it
    with Supabase Auth, and returns the user dict.

    Returns the raw user object from Supabase:
        {
            "id": "<uuid>",
            "email": "<email>",
            "app_metadata": {...},
            "user_metadata": {...},
            ...
        }
    """

    auth_header: str = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header.removeprefix("Bearer ").strip()

    try:
        response = supabase.auth.get_user(token)

        if not response or not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return response.user

    except Exception as _:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def is_authenticated(user: User) -> bool:
    return user is not None
