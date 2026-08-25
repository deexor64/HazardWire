import json
import os
import re

from dotenv import load_dotenv

load_dotenv()

AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini").lower()  # "gemini" | "ollama"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")


SYSTEM_PROMPT = """You are a civic hazard dispatcher for Sri Lanka.
Given a citizen hazard report, return ONLY valid JSON with these exact keys:
- category: one of road, water, electricity, garbage, drainage, environment, other
- severity: one of low, medium, high, critical
- authority_type: one of road, water, electricity, garbage, other
- cleaned_description: short clear version of the report, no personal info
- summary: one sentence summary

Do not invent facts. Return JSON only, no markdown."""


def _keyword_fallback(title: str, description: str) -> dict:
    text = (title + " " + description).lower()

    if any(w in text for w in ["pothole", "road", "crack", "asphalt", "highway"]):
        category, severity, authority_type = "road", "medium", "road"
    elif any(w in text for w in ["water", "leak", "pipe", "flood", "drain"]):
        category, severity, authority_type = "water", "high", "water"
    elif any(
        w in text for w in ["electric", "wire", "power", "transformer", "current"]
    ):
        category, severity, authority_type = "electricity", "high", "electricity"
    elif any(w in text for w in ["garbage", "trash", "waste", "dump"]):
        category, severity, authority_type = "garbage", "low", "garbage"
    else:
        category, severity, authority_type = "other", "medium", "other"

    return {
        "category": category,
        "severity": severity,
        "authority_type": authority_type,
        "cleaned_description": description,
        "summary": f"Detected as {category} issue with {severity} severity",
    }


def _parse_json(text: str) -> dict | None:
    """Extract JSON from model output (handles markdown fences)."""
    text = text.strip()
    # Remove ```json ... ```
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    try:
        data = json.loads(text)
        # Basic validation
        for key in (
            "category",
            "severity",
            "authority_type",
            "cleaned_description",
            "summary",
        ):
            if key not in data:
                return None
        return data
    except Exception:
        return None


def _call_gemini(title: str, description: str) -> dict:
    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)

    user_prompt = f"Title: {title}\nDescription: {description}"

    response = model.generate_content(
        [SYSTEM_PROMPT, user_prompt],
        generation_config={
            "temperature": 0.2,
            "response_mime_type": "application/json",
        },
    )

    parsed = _parse_json(response.text or "")
    if not parsed:
        raise ValueError("Gemini returned invalid JSON")
    return parsed


def _call_ollama(title: str, description: str) -> dict:
    import urllib.request

    user_prompt = f"Title: {title}\nDescription: {description}"
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "stream": False,
        "format": "json",
    }

    req = urllib.request.Request(
        f"{OLLAMA_BASE_URL.rstrip('/')}/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=120) as resp:
        body = json.loads(resp.read().decode("utf-8"))

    content = body.get("message", {}).get("content", "")
    parsed = _parse_json(content)
    if not parsed:
        raise ValueError("Ollama returned invalid JSON")
    return parsed


def analyze_report(title: str, description: str) -> dict:
    """
    Main entry point.
    Uses AI_PROVIDER toggle: "gemini" | "ollama"
    Falls back to keyword matching on any failure.
    """
    title = title or ""
    description = description or ""

    try:
        if AI_PROVIDER == "ollama":
            print("  AI provider: ollama")
            return _call_ollama(title, description)

        # default: gemini
        print("  AI provider: gemini")
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not set")
        return _call_gemini(title, description)

    except Exception as e:
        print(f"  AI failed ({e}), using keyword fallback")
        return _keyword_fallback(title, description)
