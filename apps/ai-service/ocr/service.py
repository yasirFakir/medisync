"""
OCR Service — orchestrates image validation, PaddleOCR extraction,
text cleaning, and prescription parsing.

Design principle: OCR extracts. Medical intelligence reasons.
This service does NOT interpret medical meaning.
"""

import io
import time
import logging
from typing import Tuple, List

from PIL import Image

from .schemas import OCRResult, ExtractedField, ConfidenceLevel
from .cleaner import clean_text
from .parser import parse_prescription

logger = logging.getLogger(__name__)

# ─── Allowed MIME types ───────────────────────────────────────────────────────
ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "application/pdf"}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# ─── Lazy PaddleOCR initialization ────────────────────────────────────────────
_ocr_engine = None


def _get_ocr_engine():
    """
    Lazily initializes PaddleOCR on first use to avoid startup delay.
    """
    global _ocr_engine
    if _ocr_engine is None:
        try:
            from paddleocr import PaddleOCR
            _ocr_engine = PaddleOCR(
                use_angle_cls=True,
                lang='en',
                use_gpu=False,
                show_log=False,
                # Suppress verbose download logs
                enable_mkldnn=False,
            )
            logger.info("PaddleOCR engine initialized.")
        except ImportError:
            logger.warning("PaddleOCR not installed. Will use fallback stub.")
            _ocr_engine = None
    return _ocr_engine


# ─── Image Validation ─────────────────────────────────────────────────────────
class ImageValidationError(Exception):
    pass


def validate_image(content: bytes, content_type: str) -> None:
    """
    Validates uploaded image before OCR.
    Raises ImageValidationError on failure.
    """
    if content_type not in ALLOWED_TYPES:
        raise ImageValidationError(
            f"Unsupported file type '{content_type}'. Allowed: JPEG, PNG, PDF."
        )

    if len(content) > MAX_SIZE_BYTES:
        raise ImageValidationError(
            f"File too large ({len(content) // 1024}KB). Maximum is 10MB."
        )

    if len(content) < 100:
        raise ImageValidationError("File appears to be empty or corrupted.")

    # For images, verify PIL can open it
    if content_type != "application/pdf":
        try:
            img = Image.open(io.BytesIO(content))
            img.verify()
        except Exception:
            raise ImageValidationError("Image file is unreadable or corrupted.")


# ─── PaddleOCR Extraction ────────────────────────────────────────────────────
def _extract_with_paddleocr(content: bytes) -> Tuple[str, List[float]]:
    """
    Run PaddleOCR on raw image bytes.
    Returns (raw_text, list_of_word_confidences).
    """
    engine = _get_ocr_engine()
    if engine is None:
        # Fallback stub when PaddleOCR is unavailable
        logger.warning("PaddleOCR unavailable — returning stub text.")
        return _stub_text(), [0.70]

    import numpy as np
    img = Image.open(io.BytesIO(content)).convert("RGB")
    img_np = np.array(img)

    result = engine.ocr(img_np, cls=True)

    lines:       list[str]   = []
    confidences: list[float] = []

    if result and result[0]:
        for line in result[0]:
            # line = [[bbox], [text, score]]
            if line and len(line) >= 2:
                text_data = line[1]
                if text_data and len(text_data) >= 2:
                    text  = text_data[0]
                    score = float(text_data[1])
                    lines.append(text)
                    confidences.append(score)

    raw_text = '\n'.join(lines)
    return raw_text, confidences


def _stub_text() -> str:
    """
    Fallback stub prescription text when PaddleOCR is unavailable.
    Used in development / unit tests.
    """
    return """Dr. Ahmed Khan MBBS, FCPS
MediSync Medical Centre

Rx:
1. Napa 500mg
   Twice daily after meals for 5 days

2. Moxacil 500mg Amoxicillin
   Three times daily for 7 days
   Take with food

3. Cetirizine 10mg
   Once daily at bedtime for 3 days

Patient: John Doe    Date: 2026-07-26
"""


# ─── Main OCR Pipeline ────────────────────────────────────────────────────────
async def run_ocr_pipeline(content: bytes, content_type: str, filename: str) -> OCRResult:
    """
    Full OCR pipeline:
      1. Validate image
      2. Extract text with PaddleOCR
      3. Clean text
      4. Parse into structured prescription
      5. Return OCRResult with confidence info

    Raises ImageValidationError on invalid input.
    """
    start = time.time()

    # ── 1. Validate ───────────────────────────────────────────────────────────
    validate_image(content, content_type)

    # ── 2. Extract ────────────────────────────────────────────────────────────
    raw_text, word_confidences = _extract_with_paddleocr(content)

    if not raw_text.strip():
        logger.warning(f"OCR returned empty text for file: {filename}")
        raw_text = "[OCR returned no readable text]"

    # ── 3. Clean ──────────────────────────────────────────────────────────────
    cleaned = clean_text(raw_text)

    # ── 4. Parse ──────────────────────────────────────────────────────────────
    doctor_field, medicines, low_confidence_fields = parse_prescription(cleaned, word_confidences)

    elapsed_ms = int((time.time() - start) * 1000)

    return OCRResult(
        raw_text=              cleaned,
        doctor_name=           doctor_field,
        medicines=             medicines,
        low_confidence_fields= low_confidence_fields,
        ocr_engine=            "paddleocr" if _ocr_engine else "stub",
        processing_time_ms=    elapsed_ms,
    )
