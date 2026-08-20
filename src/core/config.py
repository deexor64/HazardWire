"""
App configuration — reads from environment / .env file.
No pydantic. Plain os.environ with defaults.
"""

import os

from dotenv import load_dotenv

load_dotenv()

APP_NAME = "HazardWire"
APP_VERSION = "0.1.0"
APP_DESCRIPTION = "AI-powered civic hazard reporting & intelligent routing platform for Sri Lanka."

SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY", "")
