"""
OCR Schemas — Pydantic models for OCR input/output.
All fields are extraction-only. No medical reasoning.
"""

from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class ConfidenceLevel(str, Enum):
    HIGH   = "high"    # ≥ 0.85
    MEDIUM = "medium"  # 0.60 – 0.84
    LOW    = "low"     # < 0.60


class ExtractedField(BaseModel):
    value:      Optional[str]   = None
    confidence: ConfidenceLevel = ConfidenceLevel.LOW
    score:      float           = 0.0   # raw 0.0–1.0 confidence score


class ParsedMedicine(BaseModel):
    brand_name:           ExtractedField
    strength:             ExtractedField
    dosage:               ExtractedField
    frequency:            ExtractedField
    duration:             ExtractedField
    special_instructions: ExtractedField


class OCRResult(BaseModel):
    prescription_id:  Optional[str]         = None
    raw_text:         str                   = ""
    doctor_name:      ExtractedField
    patient_name:     ExtractedField               # Patient name extracted from header
    patient_age:      ExtractedField               # Patient age
    patient_gender:   ExtractedField               # Patient gender/sex
    prescription_date: ExtractedField                # Date written on prescription
    clinical_tests:   List[ExtractedField]  = []   # Diagnostic tests / lab work requested
    follow_up_date:   ExtractedField               # Follow up date / next visit
    medicines:        List[ParsedMedicine]  = []
    low_confidence_fields: List[str]        = []   # field paths needing user review
    ocr_engine:       str                   = "paddleocr"
    processing_time_ms: int                 = 0


class OCRErrorResponse(BaseModel):
    error:   str
    detail:  Optional[str] = None
