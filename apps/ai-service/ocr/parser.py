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


# ─── Doctor Name Extraction ────────────────────────────────────────────
_DOCTOR_PATTERNS = [
    # "Dr. Shib Shakhar Bhattacharjee" or "Dr. Md. Arif Hossain" with qualifications
    (r'(?:Dr\.?\s*)([A-Za-z][A-Za-z\.\s\-]{2,45}?)(?=\s*(?:MBBS|MD|MS|BCS|FCPS|PHD|\n|$))', 0.95),
    # Compact OCR: "Dr.Md.ArifHossain" or "Dr.ShibShakhar"
    (r'(?:Dr\.?\s*)([A-Za-z][A-Za-z\.\s]{4,40})(?=\s*(?:MBBS|MD|BCS|\n|$))', 0.90),
    # Physician/Prescriber label
    (r'(?:Physician|Prescriber|Doctor):\s*([A-Za-z][A-Za-z\s\-]{2,35}?)(?=\s*(?:MD|MBBS|FCPS|\n|$))', 0.85),
]


def extract_doctor_name(text: str) -> ExtractedField:
    for pattern, score in _DOCTOR_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if m:
            name = m.group(1).strip().rstrip('.')
            # Separate camelCase if present (e.g. ArifHossain -> Arif Hossain)
            name = re.sub(r'([a-z])([A-Z])', r'\1 \2', name)
            # Filter out non-name titles
            if len(name) >= 3 and not re.match(r'^[\d\W]+$', name):
                return _field(name, score)
    return _field(None, 0.0)


# ─── Prescription Date Extraction ────────────────────────────────────────
_DATE_PATTERNS = [
    (r'(?:Date|Datc)[:\s\.]*([0-9]{1,2}[\.\/\-][0-9]{1,2}[\.\/\-][0-9]{2,4})', 0.95),
    (r'(?:Date|Datc)[^\d]*([0-9]{1,2}[\.\/][0-9]{1,2}[\.\/][0-9]{2,4})', 0.90),
    # Standalone date format DD.MM.YY or DD/MM/YYYY
    (r'(?:^|\s)([0-9]{1,2}[\.\/][0-9]{1,2}[\.\/][0-9]{2,4})(?=\s|$)', 0.85),
    # Compact garbled date like Date.46 or 18/4/26 or ou68.25
    (r'(?:Date|Datc|\.|\&)\.?\s*([0-9]{1,2})[\.\/]*([0-9]{1,2})[\.\/]*([0-9]{2,4})', 0.75),
]


def extract_prescription_date(text: str) -> ExtractedField:
    for pattern, score in _DATE_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if m:
            groups = m.groups()
            if len(groups) == 3:
                d, m_val, y = groups[0], groups[1], groups[2]
                date_str = f"{d.zfill(2)}/{m_val.zfill(2)}/20{y[-2:]}"
                return _field(date_str, score)
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
    r'\b([01]\+[01]\+[01](?:\+[01])?|[01]\-[01]\-[01])\b', # Bangladeshi notation: 1+0+1, 1+1+1, 0+0+1
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
# A medicine line starts with Tab, Cap, Syp, Inj, a numbered list, or medicine brand name with strength
_MEDICINE_LINE = re.compile(
    r'^(?:Tab\.?|Cap\.?|Syp\.?|Inj\.?|Syr\.?|T96|Ta6|Ta|Tob|Tal|Tol|Tos|TGb|Cqp|aplopie|yp)\.?\s*([A-Za-z0-9\-\+]{2,35})' # Prefix like Tab. Vastaxel, Cap LansO, aplopie, Tal, Tol
    r'|'
    r'^(?:\d+[\.\)]\s*)([A-Za-z][A-Za-z0-9\-\+]{1,35})'                               # Explicitly numbered like "1. Napa"
    r'|'
    r'^(?!Dr\.|Doctor|Rx:|Patient:|Date:|[A-Z\s]{4,}:)([A-Za-z][A-Za-z0-9\-\+]{1,35})\s+\d+(?:\.\d+)?\s*(?:mg|mcg|ml|g|IU|%)', # Name + dosage
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

        # Terminate current medicine block on doctor header or clinical test / advice section
        if _DOCTOR_PATTERNS[0][0] in stripped or stripped.lower().startswith(('rx:', 'patient:', 'date:', 'adv:', 'advice:', 'ix:', 'investigation:')):
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


# ─── Clinical Tests & Next Visit Extraction ────────────────────────────────────
# Explicitly labelled advice/investigation section
_TEST_LABEL_PATTERN = re.compile(
    r'(?:Adv(?:ice)?|Ix|Investigation|Test|Lab|R/O)[:\s]+(.*?)(?=\n[A-Z]|$)',
    re.IGNORECASE | re.DOTALL
)
# Known test names even when garbled by OCR
_KNOWN_TESTS = [
    (r'\b(?:S\.?\s*)?(?:Troponin|Troponi)[\s\-]?[IT]\b',                'Troponin I/T'),
    (r'\b(?:S\.?\s*)?(?:Lipid|Lipid\s*Prohile|Lipid\s*Profile|kpidjnofi)\b', 'S. Lipid Profile'),
    (r'\b(?:CBC|Complete\s*Blood\s*Count|C&C)\b',                        'CBC'),
    (r'\b(?:ECG|EKG|Electro\s*cardio)\b',                               'ECG'),
    (r'\b(?:CXR|Chest\s*X[\s\-]?Ray|X\.?Ray\s*Chest|x\.ray\s*chy)\b',  'CXR (Chest X-Ray)'),
    (r'\b(?:S\.?\s*)?(?:Creatinine|Creatinin|s\.yegtimi|S\.?\s*Cr)\b',   'S. Creatinine'),
    (r'\b(?:S\.?\s*)?(?:Electrolyte|Elenolyh|s\.Hecmplyhe)\b',          'S. Electrolyte'),
    (r'\b(?:Fasting\s*)?(?:Blood\s*Sugar|Blood\s*Glucose|FBS|RBS|FB5)\b', 'Blood Sugar (FBS/RBS)'),
    (r'\b(?:HbA1c|Hba1c|HAC\-78|Glycated)\b',                            'HbA1c'),
    (r'\b(?:USG|Ultrasound|Ultra\s*sono)\b',                            'USG'),
    (r'\b(?:CT\s*Scan|CT\s*chest|CT\s*brain)\b',                        'CT Scan'),
    (r'\b(?:MRI|MR\s*brain|MRIOS\s*BYOi)\b',                            'MRI of Brain'),
    (r'\b(?:ECHO|Echocardiograph|Echo\s*cardio)\b',                     'ECHO'),
    (r'\b(?:Holter|HoltexMonihx|Holter\s*Monitor)\b',                    'Holter Monitor'),
    (r'\b(?:URINE|Urine\s*R/?M/?E|Usiu\s*PNE)\b',                      'Urine R/M/E'),
    (r'\b(?:S\.?\s*)?(?:TSH|s\.TSH|5\.Ts1)\b',                          'S. TSH'),
]

_FOLLOW_UP_PATTERNS = [
    (r'(?:Follow\s*up|Next\s*visit|Review|See\s*again)\s*(?:after|in|on)?\s*([0-9]+\s*(?:days?|weeks?|months?)|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{2,4})', 0.90),
    (r'(?:Return\s*in)\s*([0-9]+\s*(?:days?|weeks?|months?))', 0.85),
]


def extract_clinical_tests(text: str) -> List[ExtractedField]:
    found: List[str] = []

    # 1. Extract from explicit Adv/Ix labelled section
    m = _TEST_LABEL_PATTERN.search(text)
    if m:
        section = m.group(1).strip()
        # Split on commas, semicolons, newlines
        for item in re.split(r'[,;\n]+', section):
            item = item.strip()
            if item and len(item) > 2:
                found.append(item)

    # 2. Scan full text for known test names (fuzzy keyword match)
    for pattern, canonical in _KNOWN_TESTS:
        if re.search(pattern, text, re.IGNORECASE):
            if canonical not in found:
                found.append(canonical)

    return [_field(t, 0.85) for t in found]


def extract_follow_up_date(text: str) -> ExtractedField:
    for pattern, score in _FOLLOW_UP_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            return _field(m.group(1).strip(), score)
    return _field(None, 0.0)


# ─── Public Parser ────────────────────────────────────────────────────────────
def parse_prescription(cleaned_text: str, ocr_word_confidences: List[float] = []) -> Tuple[ExtractedField, ExtractedField, List[ExtractedField], ExtractedField, List[ParsedMedicine], List[str]]:
    """
    Parse cleaned OCR text into structured prescription fields.

    Returns:
        doctor_name: ExtractedField
        prescription_date: ExtractedField
        clinical_tests: List[ExtractedField]
        follow_up_date: ExtractedField
        medicines: list of ParsedMedicine
        low_confidence_fields: list of field paths flagged for user review
    """
    low_confidence: List[str] = []
    medicines: List[ParsedMedicine] = []

    # ─── Doctor Name ──────────────────────────────────────────────────────────
    doctor = extract_doctor_name(cleaned_text)
    if doctor.confidence == ConfidenceLevel.LOW:
        low_confidence.append('doctor_name')

    # ─── Prescription Date ────────────────────────────────────────────────────
    prescription_date = extract_prescription_date(cleaned_text)

    # ─── Clinical Tests & Next Visit ──────────────────────────────────────────
    clinical_tests = extract_clinical_tests(cleaned_text)
    follow_up_date = extract_follow_up_date(cleaned_text)

    # ─── Average OCR word confidence (from PaddleOCR scores) ────────────────
    avg_ocr_conf = (
        sum(ocr_word_confidences) / len(ocr_word_confidences)
        if ocr_word_confidences else 0.70
    )

    # ─── Medicine Blocks ─────────────────────────────────────────────────────
    blocks = _split_medicine_blocks(cleaned_text)

    for idx, block in enumerate(blocks):
        block_prefix = f"medicine[{idx}]"

        first_line = block.split('\n')[0].strip()
        name_match = re.match(r'^(?:Tab\.?|Cap\.?|Syp\.?|Inj\.?|Syr\.?|T96|Ta6|Ta|Tob|Tal|Tol|Tos|TGb|Cqp|aplopie|yp)\.?\s*|\d+[\.\)]\s*([A-Za-z][A-Za-z0-9\-\+]{1,35})', first_line, re.IGNORECASE)
        # Fallback to general first word match if prefix was stripped
        clean_first_line = re.sub(r'^(?:(?:Tab\.?|Cap\.?|Syp\.?|Inj\.?|Syr\.?|T96|Ta6|Ta|Tob|Tal|Tol|Tos|TGb|Cqp|aplopie|yp)\.?\s*|\d+[\.\)]\s*)+', '', first_line, flags=re.IGNORECASE).strip()
        brand_name_raw = clean_first_line.split()[0] if clean_first_line else (name_match.group(1).strip() if name_match else None)

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

    return doctor, prescription_date, clinical_tests, follow_up_date, medicines, low_confidence

