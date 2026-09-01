"""
OCR Router — FastAPI routes for prescription OCR pipeline.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from .service import run_ocr_pipeline, ImageValidationError
from .schemas import OCRResult, OCRErrorResponse

router = APIRouter(prefix="/ocr", tags=["OCR"])


@router.post(
    "/prescription",
    response_model=OCRResult,
    summary="Extract structured data from a prescription image",
    description=(
        "Upload a prescription image (JPEG/PNG/PDF). "
        "Returns structured medicine data with per-field confidence scores. "
        "Fields with LOW confidence are flagged for user review. "
        "This endpoint performs extraction only — no medical reasoning."
    ),
    responses={
        200: {"model": OCRResult,          "description": "Structured OCR result"},
        400: {"model": OCRErrorResponse,   "description": "Invalid file"},
        422: {"model": OCRErrorResponse,   "description": "Validation error"},
        500: {"model": OCRErrorResponse,   "description": "OCR processing error"},
    }
)
async def extract_prescription(file: UploadFile = File(...)) -> OCRResult:
    content      = await file.read()
    content_type = file.content_type or "application/octet-stream"
    filename     = file.filename or "upload"

    try:
        result = await run_ocr_pipeline(content, content_type, filename)
        return result
    except HTTPException:
        raise
    except ImageValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")


# ─── Legacy alias kept for backward compatibility ─────────────────────────────
@router.post(
    "/digitize",
    summary="[Legacy] Digitize prescription (alias for /ocr/prescription)",
    include_in_schema=True,
)
async def digitize_prescription_legacy(file: UploadFile = File(...)) -> dict:
    """
    Backward-compatible endpoint. Calls the new OCR pipeline
    and maps result to the original flat response shape.
    """
    content      = await file.read()
    content_type = file.content_type or "application/octet-stream"
    filename     = file.filename or "upload"

    try:
        result = await run_ocr_pipeline(content, content_type, filename)
    except HTTPException:
        raise
    except ImageValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

    # Map to legacy shape expected by the backend prescriptions.controller.ts
    medicines = [
        {
            "brandName":       m.brand_name.value       or "Unknown",
            "saltComposition": m.strength.value         or "",
            "dosage":          m.dosage.value           or "",
            "frequency":       m.frequency.value        or "",
            "duration":        m.duration.value         or "",
        }
        for m in result.medicines
    ]

    return {
        "digitizedNotes": result.raw_text,
        "doctorName":     result.doctor_name.value or "Unknown",
        "medicines":      medicines if medicines else [
            {
                "brandName": "Unknown",
                "saltComposition": "",
                "dosage": "",
                "frequency": "",
                "duration": "",
            }
        ],
    }
