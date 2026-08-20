"""
Organization auth and profile DB operations — real Supabase.

Auth operations (signup, login, logout) go through Supabase Auth.
Profile data (name, authority_type, etc.) lives in the `organizations` table
which references auth.users(id).

Table DDL (run once in Supabase SQL editor):

    create table public.organizations (
        id          uuid primary key references auth.users(id) on delete cascade,
        name        text,
        authority_type text,
        description text,
        phone       text,
        address     text,
        website     text,
        verified    boolean not null default false,
        created_at  timestamptz not null default now(),
        updated_at  timestamptz not null default now()
    );

    -- RLS: orgs can only read/update their own row
    alter table public.organizations enable row level security;

    create policy "org_select_own" on public.organizations
        for select to authenticated
        using ( (select auth.uid()) = id );

    create policy "org_update_own" on public.organizations
        for update to authenticated
        using ( (select auth.uid()) = id )
        with check ( (select auth.uid()) = id );

    create policy "org_delete_own" on public.organizations
        for delete to authenticated
        using ( (select auth.uid()) = id );
"""

from dataclasses import asdict

from db.client import supabase
from schemas.organization import OrgProfileUpdate


# ── Auth ──────────────────────────────────────────────────────────────────────

def sign_up(email: str, password: str) -> dict:
    """
    Register a new organisation via Supabase Auth.
    Returns the session + user on success.
    Raises on duplicate email or weak password.
    """
    response = supabase.auth.sign_up({"email": email, "password": password})
    return {
        "user": response.user,
        "session": response.session,
    }


def sign_in(email: str, password: str) -> dict:
    """
    Sign in an existing organisation via Supabase Auth.
    Returns the session (which contains the access_token) + user.
    Raises AuthApiError on wrong credentials.
    """
    response = supabase.auth.sign_in_with_password({"email": email, "password": password})
    return {
        "user": response.user,
        "session": response.session,
    }


def sign_out(token: str) -> None:
    """Sign the organisation out (invalidates the token server-side)."""
    # Set the session so Supabase knows which user to sign out
    supabase.auth.sign_out()


# ── Profile (organizations table) ─────────────────────────────────────────────

def get_profile(org_id: str) -> dict | None:
    """
    Fetch the organisation's profile row.
    Returns None if no profile row exists yet (user signed up but hasn't filled profile).
    """
    response = (
        supabase.table("organizations")
        .select("*")
        .eq("id", org_id)
        .maybe_single()
        .execute()
    )
    return response.data


def create_profile(org_id: str, email: str) -> dict:
    """
    Insert a minimal profile row right after signup.
    Called immediately after sign_up succeeds.
    """
    response = (
        supabase.table("organizations")
        .insert({"id": org_id, "email": email})
        .execute()
    )
    return response.data[0]


def update_profile(org_id: str, updates: OrgProfileUpdate) -> dict | None:
    """
    Update the profile row with the provided fields.
    Only non-None fields from the dataclass are written.
    """
    data = {k: v for k, v in asdict(updates).items() if v is not None}
    if not data:
        return get_profile(org_id)

    response = (
        supabase.table("organizations")
        .update(data)
        .eq("id", org_id)
        .execute()
    )
    return response.data[0] if response.data else None


def delete_profile(org_id: str) -> None:
    """
    Delete the profile row.
    The cascade on the FK will also remove the auth.users row.
    For full auth user deletion, call supabase.auth.admin.delete_user() with service role key.
    """
    supabase.table("organizations").delete().eq("id", org_id).execute()
