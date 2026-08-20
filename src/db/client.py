"""
Single Supabase client instance — import this everywhere.

Uses the publishable key (anon key) for Auth operations.
For server-side DB operations that need to bypass RLS, swap to the service role key.
"""

import os

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

_url: str = os.environ["SUPABASE_URL"]
_key: str = os.environ["SUPABASE_KEY"]

supabase: Client = create_client(_url, _key)
