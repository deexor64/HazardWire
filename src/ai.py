import json
import os
import re
import urllib.request

from dotenv import load_dotenv

load_dotenv()

AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini").lower()  # gemini | ollama

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")


SYSTEM_PROMPT = """You are a civic hazard dispatcher for Sri Lanka.

Given a citizen hazard report (and optional images), return ONLY valid JSON with these exact keys:
- category: one of road, water, electricity, garbage, drainage, environment, other
- severity: one of low, medium, high, critical
- authority_type: one of road, water, electricity, garbage, other
- cleaned_description: short clear version, no personal info
- summary: one sentence summary
- explanation: 1-2 sentences explaining why this category, severity, and authority_type were chosen
- priority_score: integer 0-100 (higher = more urgent for field response)
- image_tags: array of short tags from images (empty array if no images)

Rules:
- Do not invent facts not supported by the text or images
- critical = immediate danger to life
- high = significant risk to people or major infrastructure
- Prefer image evidence when it conflicts with vague text
- Return JSON only, no markdown
"""


def _keyword_fallback(title: str, description: str) -> dict:
    text = (title + " " + description).lower()

    if any(w in text for w in ["pothole", "road", "crack", "asphalt", "highway"]):
        category, severity, authority_type, score = "road", "medium", "road", 50
    elif any(w in text for w in ["water", "leak", "pipe", "flood", "drain"]):
        category, severity, authority_type, score = "water", "high", "water", 70
    elif any(
        w in text for w in ["electric", "wire", "power", "transformer", "current"]
    ):
        category, severity, authority_type, score = (
            "electricity",
            "high",
            "electricity",
            80,
        )
    elif any(w in text for w in ["garbage", "trash", "waste", "dump"]):
        category, severity, authority_type, score = "garbage", "low", "garbage", 30
    else:
        category, severity, authority_type, score = "other", "medium", "other", 40

    return {
        "category": category,
        "severity": severity,
        "authority_type": authority_type,
        "cleaned_description": description,
        "summary": f"Detected as {category} issue with {severity} severity",
        "explanation": "Assigned using keyword fallback rules because the AI provider failed or was unavailable.",
        "priority_score": score,
        "image_tags": [],
        "model": "keyword_fallback",
    }


def _parse_json(text: str) -> dict | None:
    text = (text or "").strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    try:
        data = json.loads(text)
    except Exception:
        return None

    required = [
        "category",
        "severity",
        "authority_type",
        "cleaned_description",
        "summary",
        "explanation",
        "priority_score",
    ]
    if not all(k in data for k in required):
        return None

    if "image_tags" not in data or not isinstance(data["image_tags"], list):
        data["image_tags"] = []

    try:
        data["priority_score"] = int(data["priority_score"])
    except Exception:
        data["priority_score"] = 50

    return data


def _call_gemini(
    title: str, description: str, image_urls: list[str] | None = None
) -> dict:
    import urllib.request as urlreq

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=GEMINI_API_KEY)

    contents: list = [f"{SYSTEM_PROMPT}\n\nTitle: {title}\nDescription: {description}"]

    # Attach up to 2 images
    for url in (image_urls or [])[:2]:
        try:
            with urlreq.urlopen(url, timeout=20) as resp:
                data = resp.read()
                mime = resp.headers.get_content_type() or "image/jpeg"
            contents.append(types.Part.from_bytes(data=data, mime_type=mime))
        except Exception as e:
            print(f"  Could not load image {url}: {e}")

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            temperature=0.2,
            response_mime_type="application/json",
        ),
    )

    parsed = _parse_json(response.text or "")
    if not parsed:
        raise ValueError("Gemini returned invalid JSON")
    parsed["model"] = GEMINI_MODEL
    return parsed


def _call_ollama(
    title: str, description: str, image_urls: list[str] | None = None
) -> dict:
    # Text-only for Ollama in v1 (images ignored unless model supports them)
    user_prompt = f"Title: {title}\nDescription: {description}"
    if image_urls:
        user_prompt += f"\n(Note: {len(image_urls)} image(s) attached but not sent to Ollama in v1)"

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
    parsed["model"] = OLLAMA_MODEL
    return parsed


def analyze_report(
    title: str,
    description: str,
    image_urls: list[str] | None = None,
) -> dict:
    """
    Main entry point.
    AI_PROVIDER = gemini | ollama
    Falls back to keywords on failure.
    """
    title = title or ""
    description = description or ""
    image_urls = image_urls or []

    try:
        if AI_PROVIDER == "ollama":
            print("  AI provider: ollama")
            return _call_ollama(title, description, image_urls)

        print("  AI provider: gemini")
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not set")
        return _call_gemini(title, description, image_urls)

    except Exception as e:
        print(f"  AI failed ({e}), using keyword fallback")
        return _keyword_fallback(title, description)
