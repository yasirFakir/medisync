"""
Prescription Parser — converts cleaned OCR text into structured medicine objects.
All logic is deterministic regex + rule-based. No AI. No inference.
Unrecognized fields are marked as unknown (LOW confidence) rather than guessed.
"""

import re
from typing import List, Tuple, Optional
from .schemas import (
    ConfidenceLevel, ExtractedField, ParsedMedicine, OCRResult
)
from .cleaner import normalize_frequency


# ─── Confidence Thresholds ───────────────────────────────────────────────────
_HIGH   = 0.85
_MEDIUM = 0.60


def _confidence(score: float) -> ConfidenceLevel:
    if score >= _HIGH:
        return ConfidenceLevel.HIGH
    if score >= _MEDIUM:
        return ConfidenceLevel.MEDIUM
    return ConfidenceLevel.LOW


def _field(value: Optional[str], score: float) -> ExtractedField:
    if not value or not value.strip():
        return ExtractedField(value=None, confidence=ConfidenceLevel.LOW, score=0.0)
    return ExtractedField(
        value=value.strip(),
        confidence=_confidence(score),
        score=round(score, 3),
    )


# ─── Doctor Name Extraction ──────────────────────────────────────────────────
_DOCTOR_PATTERNS = [
    (r'(?:Dr\.?|Doctor)\s+([A-Za-z][A-Za-z\s\-]{2,30}?)(?:\s+(?:MD|M\.D\.|MBBS|FCPS|PHD)\b|\n|$)', 0.90),
    (r'(?:Physician|Prescriber):\s*([A-Za-z][A-Za-z\s\-]{2,30}?)(?:\s+(?:MD|M\.D\.|MBBS|FCPS|PHD)\b|\n|$)', 0.80),
    (r'([A-Z][a-z]+\s+[A-Z][a-z]+),?\s*(?:M\.?D\.?|MBBS|FCPS)', 0.85),
]


def extract_doctor_name(text: str) -> ExtractedField:
    for pattern, score in _DOCTOR_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            return _field(m.group(1).strip(), score)
    return _field(None, 0.0)


# ─── Dosage Unit Extraction ─────────────────────────────────────────────────
_STRENGTH_PATTERN = re.compile(
    r'(\d+(?:\.\d+)?)\s*(mg|mcg|ml|g|IU|%|µg)',
    re.IGNORECASE
)


def _extract_strength(text: str) -> Tuple[Optional[str], float]:
    m = _STRENGTH_PATTERN.search(text)
    if m:
        return f"{m.group(1)}{m.group(2).lower()}", 0.90
    return None, 0.0


# ─── Frequency Extraction ────────────────────────────────────────────────────
_FREQ_PATTERNS = [
    r'\b(once\s*daily|od|qd|q\.d\.)\b',
    r'\b(twice\s*daily|bd|bid|b\.i\.d\.)\b',
    r'\b(three\s*times\s*daily|tds|tid|t\.i\.d\.)\b',
    r'\b(four\s*times\s*daily|qid|q\.i\.d\.)\b',
    r'\b(as\s*needed|sos|prn|p\.r\.n\.)\b',
    r'\b(every\s*\d+\s*hours?|q\d+h)\b',
    r'\b(at\s*bedtime|hs|nocte)\b',
    r'\b(before\s*meals?|ac)\b',
    r'\b(after\s*meals?|pc)\b',
    r'\b(immediately|stat)\b',
]

_COMPILED_FREQ = [(re.compile(p, re.IGNORECASE), 0.88) for p in _FREQ_PATTERNS]


def _extract_frequency(text: str) -> Tuple[Optional[str], float]:
    for pattern, score in _COMPILED_FREQ:
        m = pattern.search(text)
        if m:
            return normalize_frequency(m.group(0)), score
    return None, 0.0


# ─── Duration Extraction ─────────────────────────────────────────────────────
_DURATION_PATTERN = re.compile(
    r'(?:for\s+)?(\d+)\s*(day|days|week|weeks|month|months)',
    re.IGNORECASE
)


def _extract_duration(text: str) -> Tuple[Optional[str], float]:
    m = _DURATION_PATTERN.search(text)
    if m:
        count = m.group(1)
        unit  = m.group(2).lower()
        if not unit.endswith('s'):
            unit += 's'
        return f"{count} {unit}", 0.85
    return None, 0.0


# ─── Special Instructions Extraction ────────────────────────────────────────
_INSTRUCTION_PATTERNS = [
    (r'(with\s+(?:food|water|milk))',                     0.85),
    (r'(avoid\s+[a-z ]{3,40})',                           0.75),
    (r'(do\s+not\s+[a-z ]{3,40})',                       0.75),
    (r'(take\s+on\s+an\s+empty\s+stomach)',               0.90),
    (r'(swallow\s+whole[^.]*)',                           0.80),
    (r'(chew\s+before\s+swallowing)',                     0.80),
    (r'(dissolve\s+in\s+water[^.]*)',                     0.80),
    (r'(apply\s+(?:topically|externally)[^.]*)',          0.85),
]

_COMPILED_INSTR = [(re.compile(p, re.IGNORECASE), s) for p, s in _INSTRUCTION_PATTERNS]


def _extract_instructions(text: str) -> Tuple[Optional[str], float]:
    found = []
    max_score = 0.0
    for pattern, score in _COMPILED_INSTR:
        m = pattern.search(text)
        if m:
            found.append(m.group(1).strip())
            max_score = max(max_score, score)
    if found:
        return '; '.join(found), max_score
    return None, 0.0


# ─── Medicine Block Detection ────────────────────────────────────────────────
# A medicine line starts with a numbered list or medicine brand name with strength/dosage
_MEDICINE_LINE = re.compile(
    r'^(?:\d+[\.\)]\s*)'                     # explicitly numbered like "1. " or "1) "
    r'([A-Za-z][A-Za-z0-9\-\+]{1,35})'
    r'|'                                     # or a standalone word followed by dosage unit (e.g., "Napa 500mg")
    r'^(?!Dr\.|Doctor|Rx:|Patient:|Date:)([A-Za-z][A-Za-z0-9\-\+]{1,35})\s+\d+(?:\.\d+)?\s*(?:mg|mcg|ml|g|IU|%)',
    re.IGNORECASE
)

_NON_MED_WORDS = {'dr', 'doctor', 'rx', 'patient', 'date', 'twice', 'once', 'three', 'four', 'take', 'with', 'after', 'before'}


def _split_medicine_blocks(text: str) -> List[str]:
    """
    Heuristically split cleaned OCR text into per-medicine blocks.
    Returns list of text blocks, one per medicine entry.
    """
    blocks:  List[str]  = []
    current: List[str]  = []

    for line in text.split('\n'):
        stripped = line.strip()
        if not stripped:
            continue

        # Ignore doctor header lines or non-medicine lines
        if _DOCTOR_PATTERNS[0][0] in stripped or stripped.lower().startswith(('rx:', 'patient:', 'date:')):
            if current:
                blocks.append('\n'.join(current))
                current = []
            continue

        if _MEDICINE_LINE.match(stripped):
            if current:
                blocks.append('\n'.join(current))
            current = [stripped]
        elif current:
            current.append(stripped)

    if current:
        blocks.append('\n'.join(current))

    return blocks


# ─── Public Parser ────────────────────────────────────────────────────────────
def parse_prescription(cleaned_text: str, ocr_word_confidences: List[float] = []) -> Tuple[ExtractedField, List[ParsedMedicine], List[str]]:
    """
    Parse cleaned OCR text into structured prescription fields.

    Returns:
        doctor_name: ExtractedField
        medicines:   list of ParsedMedicine
        low_confidence_fields: list of field paths flagged for user review
    """
    low_confidence: List[str] = []
    medicines:      List[ParsedMedicine] = []

    # ─── Doctor Name ──────────────────────────────────────────────────────────
    doctor = extract_doctor_name(cleaned_text)
    if doctor.confidence == ConfidenceLevel.LOW:
        low_confidence.append('doctor_name')

    # ─── Average OCR word confidence (from PaddleOCR scores) ────────────────
    avg_ocr_conf = (
        sum(ocr_word_confidences) / len(ocr_word_confidences)
        if ocr_word_confidences else 0.70
    )

    # ─── Medicine Blocks ─────────────────────────────────────────────────────
    blocks = _split_medicine_blocks(cleaned_text)

    for idx, block in enumerate(blocks):
        block_prefix = f"medicine[{idx}]"

        # Extract brand name (strip leading number and trailing dosage/strength)
        first_line = block.split('\n')[0].strip()
        name_match = re.match(r'^(?:\d+[\.\)]\s*)?([A-Za-z][A-Za-z0-9\-\+]{1,35})', first_line)
        brand_name_raw = name_match.group(1).strip() if name_match else None

        # Derive confidence for brand name from OCR avg + name heuristic
        brand_score = min(avg_ocr_conf * 0.95 + 0.05, 1.0) if brand_name_raw else 0.0
        brand_field = _field(brand_name_raw, brand_score)

        strength_raw, strength_score   = _extract_strength(block)
        frequency_raw, frequency_score = _extract_frequency(block)
        duration_raw, duration_score   = _extract_duration(block)
        instructions_raw, instr_score  = _extract_instructions(block)

        # Dosage = strength if available, else generic fallback
        dosage_field = _field(strength_raw, strength_score)

        med = ParsedMedicine(
            brand_name=           brand_field,
            strength=             _field(strength_raw,       strength_score),
            dosage=               dosage_field,
            frequency=            _field(frequency_raw,      frequency_score),
            duration=             _field(duration_raw,       duration_score),
            special_instructions= _field(instructions_raw,   instr_score),
        )

        # Flag any low-confidence field for user review
        fields_map = {
            'brand_name':           med.brand_name,
            'strength':             med.strength,
            'frequency':            med.frequency,
            'duration':             med.duration,
            'special_instructions': med.special_instructions,
        }
        for fname, fobj in fields_map.items():
            if fobj.confidence == ConfidenceLevel.LOW:
                low_confidence.append(f"{block_prefix}.{fname}")

        # Only include blocks that at least have a name
        if brand_name_raw:
            medicines.append(med)

    return doctor, medicines, low_confidence
