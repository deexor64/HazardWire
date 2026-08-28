"""
Short jurisdiction snippets for Sri Lanka civic routing.
Retrieved by keyword overlap and injected into the LLM prompt.
"""

RULES: list[dict] = [
    {
        "id": "rda",
        "title": "Road Development Authority (RDA)",
        "text": (
            "RDA maintains Class A and Class B national highways and expressways. "
            "Potholes, cracks, and surface failure on major intercity roads and highways "
            "should be routed to RDA, not local councils."
        ),
        "keywords": [
            "rda",
            "highway",
            "a-road",
            "b-road",
            "expressway",
            "intercity",
            "pothole",
            "asphalt",
        ],
    },
    {
        "id": "local_roads",
        "title": "Local authorities (Municipal / Urban / Pradeshiya Sabha)",
        "text": (
            "Local authorities maintain Class C/D and unclassified local roads, street drains, "
            "and neighbourhood access roads inside their boundary. Local potholes and blocked "
            "roadside drains usually go to the municipal council or pradeshiya sabha."
        ),
        "keywords": [
            "local",
            "municipal",
            "council",
            "street",
            "neighbourhood",
            "drain",
            "cmc",
        ],
    },
    {
        "id": "nwsdb",
        "title": "National Water Supply and Drainage Board (NWSDB)",
        "text": (
            "NWSDB handles water supply mains, pipe bursts, major leaks, and many drainage "
            "board functions. Flooding from a burst main is typically NWSDB."
        ),
        "keywords": ["water", "leak", "pipe", "main", "nwsdb", "burst", "supply"],
    },
    {
        "id": "ceb",
        "title": "Ceylon Electricity Board (CEB) / LECO",
        "text": (
            "CEB and LECO handle electricity distribution, transformers, fallen live wires, "
            "and power outages. Sparking lines and electrocution hazards go to the electricity utility."
        ),
        "keywords": [
            "electricity",
            "power",
            "transformer",
            "wire",
            "ceb",
            "leco",
            "outage",
            "current",
        ],
    },
    {
        "id": "waste",
        "title": "Local authority solid waste",
        "text": (
            "Illegal dumping, uncollected garbage, and overflowing bins are typically handled "
            "by the local municipal or urban council waste services."
        ),
        "keywords": ["garbage", "waste", "dump", "trash", "rubbish", "bin"],
    },
    {
        "id": "police",
        "title": "Sri Lanka Police / Traffic",
        "text": (
            "Traffic collisions, crash scenes, and immediate road safety enforcement involve "
            "Sri Lanka Police traffic units. Infrastructure repair may still need RDA or local roads."
        ),
        "keywords": ["accident", "crash", "collision", "police", "traffic"],
    },
    {
        "id": "dmc",
        "title": "Disaster Management Centre",
        "text": (
            "Widespread flooding, landslides, and multi-area natural hazard events should involve "
            "the Disaster Management Centre in addition to local utilities."
        ),
        "keywords": ["flood", "landslide", "disaster", "emergency", "dmc"],
    },
    {
        "id": "environment",
        "title": "Environmental / local nuisance",
        "text": (
            "Fallen trees on local roads, minor environmental nuisances, and localized debris "
            "often fall under local authorities; large trees on highways may need RDA coordination."
        ),
        "keywords": ["tree", "environment", "debris", "pollution"],
    },
]


def retrieve_rules(
    title: str,
    description: str,
    match_keywords: list[str] | None = None,
    top_k: int = 3,
) -> list[dict]:
    """Score rules by keyword overlap; return top_k snippets."""
    text = f"{title} {description} {' '.join(match_keywords or [])}".lower()
    tokens = set(text.replace("/", " ").replace(",", " ").split())

    scored: list[tuple[float, dict]] = []
    for rule in RULES:
        score = 0.0
        for kw in rule["keywords"]:
            if kw in text:
                score += 2.0
            elif kw in tokens:
                score += 1.0
        if score > 0:
            scored.append((score, rule))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [r for _, r in scored[:top_k]]


def format_rules_for_prompt(rules: list[dict]) -> str:
    if not rules:
        return "No jurisdiction snippets retrieved."
    blocks = []
    for r in rules:
        blocks.append(f"- {r['title']}: {r['text']}")
    return "Jurisdiction guidance (retrieved):\n" + "\n".join(blocks)
