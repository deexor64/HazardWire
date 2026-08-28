"""
Single Supabase client instance — import this everywhere.

Uses the service role key for Auth operations.
For server-side DB operations that need to bypass RLS, swap to the service role key.
"""

import os

from dotenv import load_dotenv
from supabase import Client, create_client

_ = load_dotenv()

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

supabase: Client = create_client(url, key)
