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


from core.client import supabase


def signup(email: str, password: str):
    response = supabase.auth.sign_up({"email": email, "password": password})
    return {
        "user": response.user,
        "session": response.session,
    }


def signin(email: str, password: str):
    response = supabase.auth.sign_in_with_password(
        {"email": email, "password": password}
    )
    return {
        "user": response.user,
        "session": response.session,
    }


def signout() -> None:
    supabase.auth.sign_out()


def create_profile(name: str, email: str):
    response = (
        supabase.table("organizations")
        .insert(
            {
                "name": name,
                "email": email,
            }
        )
        .execute()
    )
    
    return response.data[0]


def get_profile_full(org_id: str):
    response = (
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

    if response and response.data:
        return response.data
    else:
        return None


def get_profile_partial(org_id: str):
    response = (
        supabase.table("organizations")
        .select(
            "id",
            "name",
            "authority_type",
            "description",
            "phone",
            "verified",
        )
        .eq("id", org_id)
        .maybe_single()
        .execute()
    )

    if response and response.data:
        return response.data
    else:
        return None


def update_profile(
    org_id: str,
    name: str,
    authority_type: str | None = None,
    description: str | None = None,
    phone: str | None = None,
    address: str | None = None,
    website: str | None = None,
):
    response = (
        supabase.table("organizations")
        .update(
            {
                "name": name,
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

    return response.data[0] if response.data else None


def delete_profile(org_id: str):
    response = supabase.table("organizations").delete().eq("id", org_id).execute()
    return response.data[0] if response.data else None
