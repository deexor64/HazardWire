import json
import math
import urllib.parse
import urllib.request

USER_AGENT = "HazardWire/1.0 (civic-hazard-worker)"


def reverse_geocode(lat: float, lng: float) -> dict:
    """
    Nominatim reverse geocode → standardized geo dict.
    Returns {} on failure.
    """
    try:
        qs = urllib.parse.urlencode(
            {
                "lat": lat,
                "lon": lng,
                "format": "json",
                "addressdetails": 1,
                "zoom": 18,
            }
        )
        req = urllib.request.Request(
            f"https://nominatim.openstreetmap.org/reverse?{qs}",
            headers={"User-Agent": USER_AGENT},
            method="GET",
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        addr = data.get("address") or {}
        return {
            "lat": lat,
            "lng": lng,
            "display_name": data.get("display_name"),
            "road": addr.get("road") or addr.get("pedestrian"),
            "suburb": addr.get("suburb")
            or addr.get("neighbourhood")
            or addr.get("quarter"),
            "city": addr.get("city") or addr.get("town") or addr.get("village"),
            "state": addr.get("state"),
            "country": addr.get("country"),
            "postal_code": addr.get("postcode"),
            "osm_type": data.get("type"),
            "osm_class": data.get("class"),
        }
    except Exception as e:
        print(f"  reverse_geocode failed: {e}")
        return {"lat": lat, "lng": lng}


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def org_lat_lng(org: dict) -> tuple[float, float] | None:
    geo = org.get("geo") or {}
    if isinstance(geo, str):
        try:
            geo = json.loads(geo)
        except Exception:
            return None
    lat, lng = geo.get("lat"), geo.get("lng")
    if lat is None or lng is None:
        return None
    try:
        return float(lat), float(lng)
    except Exception:
        return None
