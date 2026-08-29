import json
import os
import re
import urllib.request

from dotenv import load_dotenv

from .juridiction_rules import format_rules_for_prompt, retrieve_rules

_ = load_dotenv()

AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini").lower()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")


PRIORITIES = ["UNKNOWN", "LOW", "MEDIUM", "HIGH", "CRITICAL"]

CATEGORIES = [
    "ROAD",
    "WATER",
    "ELECTRICITY",
    "IRRIGATION",
    "GARBAGE",
    "ENVIRONMENT",
    "ANIMALS",
    "ACCIDENT",
    "CONSTRUCTION",
    "CRIME",
    "GENERAL",
]

SYSTEM_PROMPT = """You are a civic hazard dispatcher for Sri Lanka.

Return ONLY valid JSON with keys:
- category: one of ROAD, WATER, ELECTRICITY, IRRIGATION, GARBAGE, ENVIRONMENT, ANIMALS, ACCIDENT, CONSTRUCTION, CRIME, GENERAL
- priority: one of UNKNOWN, LOW, MEDIUM, HIGH, CRITICAL
- cleaned_description: short clear text, no personal info
- summary: one sentence
- explanation: 1-2 sentences why category/priority fit (mention location if relevant)
- priority_score: integer 0-100
- image_tags: string array
- match_keywords: string array of words useful to match an organization (e.g. road, drain, police, electricity, CEB)

Rules:
- CRITICAL = immediate danger to life
- HIGH = major risk or infrastructure failure
- ELECTRICITY = power lines, transformers, outages, electrocution risk
- Use location context when provided
- JSON only, no markdown

Use the retrieved jurisdiction guidance when choosing category and match_keywords.
Prefer the agency that matches both the hazard type and the road/local context.
"""


def _norm_category(v: str) -> str:
    u = (v or "GENERAL").upper().replace(" ", "_")
    aliases = {
        "DRAINAGE": "IRRIGATION",
        "ELECTRIC": "ELECTRICITY",
        "POWER": "ELECTRICITY",
        "OTHER": "GENERAL",
        "TRASH": "GARBAGE",
        "ANIMAL": "ANIMALS",
    }
    u = aliases.get(u, u)
    return u if u in CATEGORIES else "GENERAL"


def _norm_priority(v: str) -> str:
    u = (v or "UNKNOWN").upper()
    aliases = {"SEVERE": "HIGH", "MEDIUM": "MEDIUM"}
    u = aliases.get(u, u)
    return u if u in PRIORITIES else "UNKNOWN"


def _keyword_fallback(title: str, description: str) -> dict:
    text = (title + " " + description).lower()
    if any(w in text for w in ["pothole", "road", "crack", "asphalt"]):
        cat, pri, score, kws = "ROAD", "MEDIUM", 50, ["road", "pothole"]
    elif any(w in text for w in ["water", "leak", "pipe", "flood"]):
        cat, pri, score, kws = "WATER", "HIGH", 70, ["water", "leak"]
    elif any(w in text for w in ["garbage", "trash", "waste", "dump"]):
        cat, pri, score, kws = "GARBAGE", "LOW", 30, ["garbage", "waste"]
    elif any(w in text for w in ["accident", "crash", "collision"]):
        cat, pri, score, kws = "ACCIDENT", "HIGH", 75, ["accident", "police"]
    elif any(
        w in text
        for w in ["electric", "wire", "power", "transformer", "current", "ceb"]
    ):
        cat, pri, score, kws = (
            "ELECTRICITY",
            "HIGH",
            80,
            ["electricity", "power", "CEB"],
        )
    else:
        cat, pri, score, kws = "GENERAL", "MEDIUM", 40, ["general"]

    return {
        "category": cat,
        "priority": pri,
        "cleaned_description": description,
        "summary": f"Detected as {cat} with {pri} priority",
        "explanation": "Keyword fallback (AI unavailable or failed).",
        "priority_score": score,
        "image_tags": [],
        "match_keywords": kws,
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

    for k in ["category", "priority", "summary", "explanation", "priority_score"]:
        if k not in data:
            return None

    data["category"] = _norm_category(str(data["category"]))
    data["priority"] = _norm_priority(str(data["priority"]))
    data["cleaned_description"] = data.get("cleaned_description") or ""
    data["image_tags"] = (
        data.get("image_tags") if isinstance(data.get("image_tags"), list) else []
    )
    data["match_keywords"] = (
        data.get("match_keywords")
        if isinstance(data.get("match_keywords"), list)
        else []
    )
    try:
        data["priority_score"] = int(data["priority_score"])
    except Exception:
        data["priority_score"] = 50
    return data


def _geo_block(geo: dict | None) -> str:
    if not geo:
        return ""
    parts = [
        f"display_name={geo.get('display_name')}",
        f"road={geo.get('road')}",
        f"suburb={geo.get('suburb')}",
        f"city={geo.get('city')}",
        f"state={geo.get('state')}",
        f"postal_code={geo.get('postal_code')}",
        f"lat={geo.get('lat')}, lng={geo.get('lng')}",
    ]
    return "Location context:\n" + "\n".join(parts)


def _call_gemini(
    title: str,
    description: str,
    image_urls: list[str] | None = None,
    geo: dict | None = None,
    rules_block: str = "",
) -> dict:
    import urllib.request as urlreq

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=GEMINI_API_KEY)
    contents: list = [
        f"{SYSTEM_PROMPT}\n\n{rules_block}\n\nTitle: {title}\nDescription: {description}\n{_geo_block(geo)}"
    ]

    for url in (image_urls or [])[:2]:
        try:
            with urlreq.urlopen(url, timeout=20) as resp:
                data = resp.read()
                mime = resp.headers.get_content_type() or "image/jpeg"
            contents.append(types.Part.from_bytes(data=data, mime_type=mime))
        except Exception as e:
            print(f"  Could not load image: {e}")

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
        raise ValueError("Gemini invalid JSON")
    parsed["model"] = GEMINI_MODEL
    return parsed


def _call_ollama(
    title: str,
    description: str,
    image_urls: list[str] | None = None,
    geo: dict | None = None,
    rules_block: str = "",
) -> dict:
    user_prompt = f"{rules_block}\n\nTitle: {title}\nDescription: {description}\n{_geo_block(geo)}"
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
    parsed = _parse_json(body.get("message", {}).get("content", ""))
    if not parsed:
        raise ValueError("Ollama invalid JSON")
    parsed["model"] = OLLAMA_MODEL
    return parsed


def analyze_report(
    title: str,
    description: str,
    image_urls: list[str] | None = None,
    geo: dict | None = None,
) -> dict:
    title, description = title or "", description or ""
    image_urls = image_urls or []

    rules = retrieve_rules(title, description, top_k=3)
    rules_block = format_rules_for_prompt(rules)

    try:
        if AI_PROVIDER == "ollama":
            print("  AI provider: ollama")
            result = _call_ollama(title, description, image_urls, geo, rules_block)
        else:
            print("  AI provider: gemini")
            if not GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY not set")
            result = _call_gemini(title, description, image_urls, geo, rules_block)

        result["retrieved_rules"] = [r["id"] for r in rules]
        return result
    except Exception as e:
        print(f"  AI failed ({e}), keyword fallback")
        fb = _keyword_fallback(title, description)
        fb["retrieved_rules"] = [r["id"] for r in rules]
        return fb
