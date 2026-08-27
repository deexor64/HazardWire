import uuid

import cv2
import numpy as np

from .core.client import supabase

BUCKET_RAW = "images_raw"
BUCKET_PUBLIC = "images"


def _download_from_raw(path_or_url: str) -> np.ndarray | None:
    """Load bytes from private bucket path, or HTTP URL fallback."""
    try:
        path = path_or_url
        if "/images_raw/" in path_or_url:
            path = path_or_url.split("/images_raw/")[-1].split("?")[0]

        # Prefer storage download (works for private bucket with service key)
        try:
            data = supabase.storage.from_(BUCKET_RAW).download(path)
        except Exception:
            import urllib.request

            with urllib.request.urlopen(path_or_url, timeout=30) as resp:
                data = resp.read()

        arr = np.frombuffer(data, dtype=np.uint8)
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)
    except Exception as e:
        print(f"  image download failed: {e}")
        return None


def _blur_faces(img: np.ndarray) -> tuple[np.ndarray, int]:
    if not hasattr(cv2, "CascadeClassifier"):
        print("  CascadeClassifier unavailable — skip face blur")
        return img, 0

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(cascade_path)
    if face_cascade.empty():
        return img, 0

    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
    )
    count = 0
    for x, y, w, h in faces:
        roi = img[y : y + h, x : x + w]
        if roi.size == 0:
            continue
        k = max(11, (w // 3) | 1)
        img[y : y + h, x : x + w] = cv2.GaussianBlur(roi, (k, k), 30)
        count += 1
    return img, count


def _encode_jpg(img: np.ndarray) -> bytes:
    ok, buf = cv2.imencode(".jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    if not ok:
        raise ValueError("encode failed")
    return buf.tobytes()


def process_report_images(raw_paths: list[str]) -> dict:
    """
    raw_paths: paths in images_raw (or URLs).
    Writes blurred images to public bucket `images` as {uuid}.jpg
    """
    processed_urls: list[str] = []
    total_faces = 0

    for ref in raw_paths or []:
        img = _download_from_raw(ref)
        if img is None:
            continue

        img, faces = _blur_faces(img)
        total_faces += faces

        try:
            filename = f"{uuid.uuid4()}.jpg"
            content = _encode_jpg(img)
            supabase.storage.from_(BUCKET_PUBLIC).upload(
                path=filename,
                file=content,
                file_options={"content-type": "image/jpeg", "upsert": "true"},
            )
            public_url = supabase.storage.from_(BUCKET_PUBLIC).get_public_url(filename)
            processed_urls.append(public_url)
        except Exception as e:
            print(f"  public upload failed: {e}")

    return {
        "processed_urls": processed_urls,
        "privacy": {
            "blurred": total_faces > 0,
            "faces": total_faces,
            "plates": 0,
        },
    }
