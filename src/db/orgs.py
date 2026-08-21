from postgrest import APIResponse
from postgrest.base_request_builder import SingleAPIResponse
from supabase_auth import AuthResponse

from core.client import supabase

from .types import DbResult


def signup(email: str, password: str) -> AuthResponse | Exception:
    return supabase.auth.sign_up({"email": email, "password": password})


def create_profile(name: str, email: str) -> APIResponse | Exception:
    return (
        supabase.table("organizations")
        .insert(
            {
                "name": name,
                "email": email,
            }
        )
        .execute()
    )


def signin(email: str, password: str) -> AuthResponse | Exception:
    return supabase.auth.sign_in_with_password({"email": email, "password": password})


def signout() -> None | Exception:
    return supabase.auth.sign_out()


def get_profile_full(org_id: str) -> SingleAPIResponse | None | Exception:
    return (
        supabase.table("organizations")
        .select(
            "id",
            "email",
            "name",
            "authority_type",
            "description",
            "phone",
            "address",
            "website",
            "verified",
            "created_at",
            "updated_at",
        )
        .eq("id", org_id)
        .maybe_single()
        .execute()
    )


def get_profile_full_public(org_id: str) -> SingleAPIResponse | None | Exception:
    return (
        supabase.table("organizations")
        .select(
            "id",
            "email",
            "name",
            "authority_type",
            "description",
            "phone",
            "address",
            "website",
            "verified",
        )
        .eq("id", org_id)
        .maybe_single()
        .execute()
    )


def get_profile_partial(org_id: str) -> SingleAPIResponse | None | Exception:
    return (
        supabase.table("organizations")
        .select(
            "id",
            "name",
            "authority_type",
            "phone",
            "verified",
        )
        .eq("id", org_id)
        .maybe_single()
        .execute()
    )


def update_profile(
    org_id: str,
    name: str | None = None,
    email: str | None = None,
    authority_type: str | None = None,
    description: str | None = None,
    phone: str | None = None,
    address: str | None = None,
    website: str | None = None,
) -> APIResponse | Exception:
    return (
        supabase.table("organizations")
        .update(
            {
                "name": name,
                "email": email,
                "authority_type": authority_type,
                "description": description,
                "phone": phone,
                "address": address,
                "website": website,
            }
        )
        .eq("id", org_id)
        .execute()
    )


def delete_profile(org_id: str) -> APIResponse | Exception:
    return supabase.table("organizations").delete().eq("id", org_id).execute()
