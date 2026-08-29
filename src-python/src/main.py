import os
import threading

import uvicorn
from fastapi import FastAPI

from .worker import run_worker

app = FastAPI()


@app.get("/")
def root():
    return {"service": "HazardWire worker", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}


def start_worker_thread() -> None:
    t = threading.Thread(target=run_worker, kwargs={"poll_interval": 20}, daemon=True)
    t.start()
    print("Worker thread started")


# Runs when uvicorn loads this module
start_worker_thread()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("src.main:app", host="0.0.0.0", port=port, log_level="info")
