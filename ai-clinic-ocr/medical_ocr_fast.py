"""
Medical Document OCR - Optimized Single Request
================================================
Single API call using Google Gen AI SDK for:
- Direct PDF upload (File API) for speed and lower token usage
- Structured JSON output using Pydantic schema
- Robust error handling and retries

Usage:
    python medical_ocr_fast.py document.pdf
    python medical_ocr_fast.py scan.png --model gemini-2.5-flash
"""

import argparse
import json
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Set

from dotenv import load_dotenv
from ocr_types.medical_types import (
    MedicalOCR,
)  # Ensure this matches your local file structure
from pydantic import ValidationError
from google import genai
from google.genai import types

# PyMuPDF for fast PDF rendering (no external dependencies)
try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

# =============================================================================
# Configuration
# =============================================================================
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# =============================================================================
# Compact Prompt
# =============================================================================
COMPACT_PROMPT = """You are an advanced medical OCR engine. Extract ALL medical information from this document.

CRITICAL INSTRUCTIONS:
1. Extract patient demographics, medical history (conditions, meds, surgeries), social history, labs, and imaging.
2. If the document contains multiple sections (e.g., History, Labs, Imaging), split them correctly into their respective lists.
3. Preserve original text exactly, especially for Arabic names or medical notes.
4. Normalize dates to YYYY-MM-DD format if possible.
5. If a field is missing, leave it null or empty list.
6. Return purely the JSON object matching the schema."""


def parse_page_selection(selection: Optional[str]) -> Optional[List[int]]:
    """Convert a CLI page selection string into sorted page numbers."""
    if not selection:
        return None

    pages: Set[int] = set()
    for chunk in selection.split(","):
        chunk = chunk.strip()
        if not chunk:
            continue
        if "-" in chunk:
            try:
                start, end = chunk.split("-", 1)
                start_idx = int(start)
                end_idx = int(end)
                if start_idx <= 0 or end_idx <= 0 or end_idx < start_idx:
                    raise ValueError(f"Invalid page range: {chunk}")
                pages.update(range(start_idx, end_idx + 1))
            except ValueError:
                raise ValueError(f"Invalid range format: {chunk}")
        else:
            try:
                page = int(chunk)
                if page <= 0:
                    raise ValueError("Page numbers must be greater than zero")
                pages.add(page)
            except ValueError:
                raise ValueError(f"Invalid page number: {chunk}")

    return sorted(pages) if pages else None


def analyze_document_streaming(
    file_path: str,
    api_key: Optional[str] = None,
    model: str = "gemini-2.5-flash-lite",
    selected_pages: Optional[List[int]] = None,
    progress_cb: Optional[Callable[[int, str], None]] = None,
) -> Dict[str, Any]:
    """Analyze a medical document using Gemini 2.0 Flash with robust PDF handling."""

    def report(percent: int, message: str) -> None:
        if progress_cb:
            progress_cb(max(0, min(100, percent)), message)

    # 1. Setup Client
    api_key = api_key or GEMINI_API_KEY
    if not api_key:
        raise ValueError("Gemini API key not configured. Set GEMINI_API_KEY env var.")

    client = genai.Client(api_key=api_key)
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    start_time = datetime.now()
    print(f"\n⚡ Processing: {file_path}")
    report(2, "starting")

    parts = []

    # =========================================================================
    # STRATEGY 1: Direct PDF Upload (File API)
    # Best for: Speed, Token Efficiency, Text Accuracy
    # =========================================================================
    if path.suffix.lower() == ".pdf" and not selected_pages:
        print(" 📄 Mode: Direct PDF Upload (File API)")
        temp_path = None
        try:
            report(12, "preparing pdf upload")
            # --- FIX FOR ARABIC FILENAMES ---
            # The API client fails if the local filename has non-ASCII characters.
            # We create a temporary copy with a safe English name.
            safe_filename = f"temp_upload_{int(time.time())}.pdf"
            temp_path = Path(safe_filename)

            # Read original bytes -> Write to safe temp file
            temp_path.write_bytes(path.read_bytes())

            # Upload the SAFE file
            report(20, "uploading pdf")
            myfile = client.files.upload(
                file=temp_path,
                config=types.UploadFileConfig(display_name="medical_document"),
            )

            # Clean up temp file immediately (we don't need it anymore)
            if temp_path.exists():
                temp_path.unlink()

            # Poll for processing completion
            poll_count = 0
            while myfile.state == "PROCESSING":
                print("   ⏳ Processing PDF...")
                poll_count += 1
                report(min(60, 30 + poll_count * 5), "processing pdf")
                time.sleep(1)
                myfile = client.files.get(name=myfile)

            if myfile.state == "FAILED":
                raise ValueError(f"PDF processing failed: {myfile.error.message}")

            parts = [myfile, COMPACT_PROMPT]

        except Exception as e:
            # Ensure temp cleanup in case of error
            if temp_path and temp_path.exists():
                temp_path.unlink()

            print(
                f"   ⚠️ Direct upload failed ({e}), falling back to image conversion..."
            )
            parts = []  # Reset to trigger fallback

    # =========================================================================
    # STRATEGY 2: Fallback / Image Conversion
    # Used if: Not a PDF, specific pages requested, or PDF upload failed
    # =========================================================================
    if not parts:
        print(
            f" 🖼️ Mode: Image Analysis (Pages: {selected_pages if selected_pages else 'All'})"
        )

        if path.suffix.lower() == ".pdf":
            if fitz is None:
                raise ImportError(
                    "PyMuPDF (fitz) is required for page selection or fallback. Install with: pip install pymupdf"
                )

            # Open PDF with PyMuPDF
            doc = fitz.open(file_path)
            total_pages_in_doc = len(doc)

            # Determine which pages to process
            if selected_pages:
                page_indices = [
                    p - 1 for p in selected_pages if 1 <= p <= total_pages_in_doc
                ]
            else:
                page_indices = list(range(total_pages_in_doc))

            if not page_indices:
                doc.close()
                raise ValueError("No valid pages selected.")

            # Build request parts
            parts = [COMPACT_PROMPT]
            total_pages = len(page_indices)

            # Render pages to images using PyMuPDF (faster than Poppler)
            # zoom=2.0 gives ~144 DPI (72 * 2), good balance of quality/speed
            zoom_matrix = fitz.Matrix(2.0, 2.0)

            for idx, page_idx in enumerate(page_indices):
                report(15 + int(((idx + 1) / total_pages) * 45), "rendering pages")
                page = doc[page_idx]
                pix = page.get_pixmap(matrix=zoom_matrix)
                img_bytes = pix.tobytes("jpeg")
                parts.append(f"\n[Page {page_idx + 1}]")
                parts.append(
                    types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg")
                )

            doc.close()
            print(f"   📊 Processed {total_pages} page images.")

        else:
            # Single Image File (JPG/PNG)
            report(20, "preparing image")
            with open(file_path, "rb") as f:
                img_bytes = f.read()
            mime_type = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
            parts = [
                COMPACT_PROMPT,
                types.Part.from_bytes(data=img_bytes, mime_type=mime_type),
            ]

    # =========================================================================
    # EXECUTE API CALL
    # =========================================================================
    print(f" 🚀 Sending request to {model}...")
    report(70, "analyzing document")

    max_retries = 3
    base_delay = 2
    response = None

    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=model,
                contents=parts,
                config={
                    "response_mime_type": "application/json",
                    # Ensure you use .model_json_schema() for Pydantic classes
                    "response_json_schema": MedicalOCR.model_json_schema(),
                    "temperature": 0.0,
                },
            )
            break
        except Exception as exc:
            if "503" in str(exc) or "429" in str(exc):
                delay = base_delay * (2**attempt)
                print(f"   ⏳ Rate limited/Busy, retrying in {delay}s...")
                time.sleep(delay)
            else:
                raise exc

    if not response:
        raise RuntimeError("Failed to get response from Gemini after retries.")

    total_time = (datetime.now() - start_time).total_seconds()
    print(f" ✓ Done ({total_time:.1f}s)")

    # =========================================================================
    # PARSE RESULTS
    # =========================================================================
    usage = response.usage_metadata
    prompt_tokens = usage.prompt_token_count if usage else 0
    output_tokens = usage.candidates_token_count if usage else 0

    try:
        # Validate response against Pydantic schema
        report(90, "parsing response")
        model_obj = MedicalOCR.model_validate_json(response.text)
        extraction = model_obj.model_dump()
        print(" ✅ JSON Schema Validation Passed")
    except ValidationError as ve:
        print(f" ⚠️ Validation Error: {ve}")
        return {"success": False, "error": str(ve), "raw_response": response.text}

    report(100, "done")

    return {
        "success": True,
        "file": str(file_path),
        "model": model,
        "extraction": extraction,
        "timing": {
            "total_seconds": total_time,
            "tokens_per_second": output_tokens / total_time if total_time > 0 else 0,
        },
        "usage": {"prompt_tokens": prompt_tokens, "output_tokens": output_tokens},
        "timestamp": datetime.now().isoformat(),
    }


def print_results(result: Dict[str, Any]) -> None:
    """Pretty print extraction results."""
    print("\n" + "=" * 60)
    print("📋 Medical Document Analysis Results")
    print("=" * 60)

    if not result.get("success"):
        print(f"❌ Error: {result.get('error')}")
        return

    print(f"\n📁 File: {result['file']}")
    print(f"🤖 Model: {result['model']}")

    timing = result.get("timing", {})
    usage = result.get("usage", {})
    print(f"⏱️  Time: {timing.get('total_seconds', 0):.1f}s")
    print(
        f"💰 Tokens: In={usage.get('prompt_tokens', 0):,}, Out={usage.get('output_tokens', 0):,}"
    )

    extraction = result.get("extraction", {})

    # --- Deep Display of Extracted Data ---

    # 1. Patient
    pat = extraction.get("patient", {})
    if pat:
        name = pat.get("name") or "Unknown"
        age = pat.get("age")
        print(f"\n👤 Patient: {name} (Age: {age if age else 'N/A'})")
        if pat.get("phone"):
            print(f"   Phone: {pat.get('phone')}")

    # 2. History
    conditions = extraction.get("patientConditions", [])
    if conditions:
        print(f"\n🏥 Conditions ({len(conditions)}):")
        for c in conditions[:3]:
            print(f"   • {c.get('conditionName')} ({c.get('conditionStatus')})")
        if len(conditions) > 3:
            print(f"     ... +{len(conditions)-3} more")

    meds = extraction.get("patientMedications", [])
    if meds:
        print(f"\n💊 Medications ({len(meds)}):")
        for m in meds[:3]:
            print(f"   • {m.get('drugName')} {m.get('dosage') or ''}")

    surgeries = extraction.get("patientSurgeries", [])
    if surgeries:
        print(f"\n🔪 Surgeries ({len(surgeries)}):")
        for s in surgeries[:3]:
            print(
                f"   • {s.get('procedureName')} ({s.get('surgeryDate') or 'No date'})"
            )

    # 3. Labs
    labs = extraction.get("patientLabs", [])
    if labs:
        print(f"\n🧪 Labs ({len(labs)}):")
        for item in labs[:5]:
            val = item.get("results", {}).get("value", "")
            unit = item.get("results", {}).get("unit", "")
            print(f"   • {item.get('testName')}: {val} {unit}")

    # 4. Imaging
    imgs = extraction.get("patientImaging", [])
    if imgs:
        print(f"\n📸 Imaging ({len(imgs)}):")
        for i in imgs:
            print(f"   • {i.get('studyName')} ({i.get('modality')})")


def main():
    parser = argparse.ArgumentParser(
        description="Medical Document OCR - Fast Single Request",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("file", type=str, help="Path to PDF or image file")
    parser.add_argument(
        "--output", type=str, default="output/medical_ocr", help="Output directory"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="gemini-2.5-flash-lite",
        help="Gemini model to use",
    )
    parser.add_argument(
        "--pages",
        type=str,
        default=None,
        help="Pages to process (e.g. 1,3-5). Disables direct PDF upload.",
    )

    args = parser.parse_args()

    try:
        selected_pages = parse_page_selection(args.pages)

        result = analyze_document_streaming(
            args.file,
            model=args.model,
            selected_pages=selected_pages,
        )

        print_results(result)

        # Save to JSON
        output_dir = Path(args.output)
        output_dir.mkdir(parents=True, exist_ok=True)
        out_name = Path(args.file).stem + "_fast.json"

        with open(output_dir / out_name, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        print(f"\n💾 Saved full JSON to: {output_dir / out_name}")

    except Exception as e:
        print(f"\n❌ Fatal Error: {e}")
        exit(1)


if __name__ == "__main__":
    main()
