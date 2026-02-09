"""
FastAPI server for Medical Document OCR & Analysis.

Run with:
    uvicorn api:app --reload --port 8000
"""

import os

# Set Paddle environment variables for every run
os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_enable_pir_api"] = "0"
import asyncio
import json
import tempfile
import shutil
import threading
from pathlib import Path
from typing import Optional
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from config import settings
from medical_ocr_fast import analyze_document_streaming

# =============================================================================
# FastAPI App
# =============================================================================
app = FastAPI(
    title="Medical OCR API",
    description="API for extracting structured medical information from documents using Gemini AI",
    version="1.0.0",
)

# CORS configuration from environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Models
# =============================================================================
class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str


class OCRResponse(BaseModel):
    success: bool
    file: str
    model: str
    extraction: dict
    usage: Optional[dict] = None
    timestamp: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None


# =============================================================================
# Endpoints
# =============================================================================
@app.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
    }


@app.post("/analyze", response_model=OCRResponse)
async def analyze_document(
    file: UploadFile = File(..., description="Medical document (PDF or image)"),
    model: str = Query(
        default="gemini-2.5-flash-lite",
        description="Gemini model to use",
        enum=[
            "gemini-3-flash-preview",
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
        ],
    ),
    use_schema: bool = Query(
        default=True, description="Enforce JSON schema for structured output"
    ),
):
    """
    Analyze a medical document and extract structured information.

    Accepts PDF or image files (JPEG, PNG, WebP, GIF).
    Returns structured medical data including patient info, diagnoses,
    medications, vital signs, and more.
    """
    # Validate file type
    allowed_extensions = {".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp"}
    file_ext = Path(file.filename).suffix.lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Allowed: {', '.join(allowed_extensions)}",
        )

    # Create temp file to store upload
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, file.filename)

    try:
        # Save uploaded file
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Run analysis (single request, streaming)
        result = analyze_document_streaming(
            file_path=temp_path,
            model=model,
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=500, detail=result.get("error", "Analysis failed")
            )

        # Update file path to original filename
        result["file"] = file.filename

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp files
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.post("/analyze/stream")
async def analyze_document_stream(
    file: UploadFile = File(..., description="Medical document (PDF or image)"),
    model: str = Query(
        default="gemini-2.5-flash-lite",
        description="Gemini model to use",
        enum=[
            "gemini-3-flash-preview",
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
        ],
    ),
    use_schema: bool = Query(
        default=True, description="Enforce JSON schema for structured output"
    ),
):
    allowed_extensions = {".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp"}
    file_ext = Path(file.filename).suffix.lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Allowed: {', '.join(allowed_extensions)}",
        )

    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, file.filename)

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    loop = asyncio.get_running_loop()
    queue: asyncio.Queue[dict] = asyncio.Queue()

    def push_event(event: str, data: dict) -> None:
        loop.call_soon_threadsafe(queue.put_nowait, {"event": event, "data": data})

    def progress_cb(percent: int, message: str) -> None:
        push_event("progress", {"percent": percent, "message": message})

    def run_analysis() -> None:
        try:
            progress_cb(5, "file saved")
            result = analyze_document_streaming(
                file_path=temp_path,
                model=model,
                progress_cb=progress_cb,
            )

            if not result.get("success"):
                push_event(
                    "error",
                    {
                        "error": result.get("error", "Analysis failed"),
                        "detail": result.get("detail"),
                    },
                )
            else:
                result["file"] = file.filename
                push_event("result", result)
        except Exception as exc:
            push_event(
                "error",
                {"error": "Analysis failed", "detail": str(exc)},
            )
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    threading.Thread(target=run_analysis, daemon=True).start()

    async def event_stream():
        while True:
            payload = await queue.get()
            event = payload["event"]
            data = payload["data"]
            yield f"event: {event}\ndata: {json.dumps(data)}\n\n"
            if event in {"result", "error"}:
                break

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc),
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
