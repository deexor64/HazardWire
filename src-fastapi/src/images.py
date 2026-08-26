import os
import urllib.request
import uuid
from io import BytesIO

import cv2
import numpy as np

from .core.client import supabase

BUCKET = "hazard-images"


def _download_image(url: str) -> np.ndarray | None:
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            data = resp.read()
        arr = np.frombuffer(data, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"  image download failed: {e}")
        return None


def _blur_faces(img: np.ndarray) -> tuple[np.ndarray, int]:
    """Blur faces. Returns (image, face_count). No-op if cascade unavailable."""
    if not hasattr(cv2, "CascadeClassifier"):
        print(
            "  CascadeClassifier not available in this OpenCV build — skipping face blur"
        )
        return img, 0

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(cascade_path)

    if face_cascade.empty():
        print("  Failed to load face cascade — skipping face blur")
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
        raise ValueError("Failed to encode image")
    return buf.tobytes()


def process_report_images(raw_urls: list[str]) -> dict:
    """
    Download raw images, blur faces, upload as processed_<uuid>.jpg
    Returns:
      {
        "processed_urls": [...],
        "privacy": {"blurred": bool, "faces": int, "plates": 0}
      }
    """
    processed_urls = []
    total_faces = 0

    for url in raw_urls or []:
        img = _download_image(url)
        if img is None:
            # keep original if we can't process
            processed_urls.append(url)
            continue

        img, faces = _blur_faces(img)
        total_faces += faces

        try:
            filename = f"processed_{uuid.uuid4()}.jpg"
            content = _encode_jpg(img)
            supabase.storage.from_(BUCKET).upload(
                path=filename,
                file=content,
                file_options={"content-type": "image/jpeg", "upsert": "true"},
            )
            public_url = supabase.storage.from_(BUCKET).get_public_url(filename)
            processed_urls.append(public_url)
        except Exception as e:
            print(f"  processed upload failed: {e}")
            processed_urls.append(url)

    return {
        "processed_urls": processed_urls,
        "privacy": {
            "blurred": total_faces > 0,
            "faces": total_faces,
            "plates": 0,  # best-effort later
        },
    }
