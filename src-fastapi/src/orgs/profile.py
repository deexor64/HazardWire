from postgrest.types import JSON

from core.client import supabase
from core.types import DbResult


def create_profile(org_id: str, name: str, email: str) -> DbResult[list[JSON], str]:
    try:
        res = (
            supabase.table("organizations")
            .insert(
                {
                    "id": org_id,
                    "name": name,
                    "email": email,
                }
            )
            .execute()
        )

        return DbResult(True, res.data)

    except Exception as e:
        print(e)
        return DbResult(False, "Profile creation failed")


def get_profile(org_id: str) -> DbResult[JSON, str]:
    try:
        res = (
            supabase.table("organizations")
            .select("*")
            .eq("id", org_id)
            .maybe_single()
            .execute()
        )

        if res is None or res.data is None:
            return DbResult(False, "Profile not found")

        return DbResult(True, res.data)

    except Exception as e:
        print(e)
        return DbResult(False, "Profile retrieval failed")


def update_profile(org_id: str, data: dict) -> DbResult[list[JSON], str]:
    try:
        # remove None values
        clean = {k: v for k, v in data.items() if v is not None}
        res = supabase.table("organizations").update(clean).eq("id", org_id).execute()

        return DbResult(True, res.data)
        
    except Exception as e:
        print(e)
        return DbResult(False, str(e))


def delete_profile(org_id: str) -> DbResult[list[JSON], str]:
    try:
        res = supabase.table("organizations").delete().eq("id", org_id).execute()

        return DbResult(True, res.data)

    except Exception as e:
        print(e)
        return DbResult(False, str(e))
