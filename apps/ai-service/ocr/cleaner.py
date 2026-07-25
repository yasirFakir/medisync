"""
OCR Text Cleaner — deterministic normalization of raw OCR output.
No AI. No inference. Pure string transformation.
"""

import re


# Common OCR character-level substitutions for medical text
_CHAR_MAP = {
    '|':  'I',
    '!':  'I',
    '0':  'O',   # only in word context — handled below
    '@':  'a',
    '$':  'S',
    '&':  'and',
}

# Medicine dosage patterns often OCR'd incorrectly
_DOSAGE_FIXES = [
    (r'(\d+)\s*[mM][gG]',       r'\1mg'),
    (r'(\d+)\s*[mM][lL]',       r'\1ml'),
    (r'(\d+)\s*[mM][cC][gG]',   r'\1mcg'),
    (r'(\d+)\s*[iI][uU]',       r'\1 IU'),
    (r'(\d+)\s*%',               r'\1%'),
]

# Frequency normalization
_FREQ_MAP = {
    r'\b(od|once\s*daily|1x\s*daily|q\.?d\.?)\b':              'Once daily',
    r'\b(bd|bid|twice\s*daily|2x\s*daily|b\.?i\.?d\.?)\b':    'Twice daily',
    r'\b(tds|tid|3x\s*daily|t\.?i\.?d\.?|thrice\s*daily)\b':  'Three times daily',
    r'\b(qid|4x\s*daily|q\.?i\.?d\.?)\b':                     'Four times daily',
    r'\b(sos|as\s*needed|prn|p\.?r\.?n\.?)\b':                'As needed',
    r'\b(stat|immediately|now)\b':                             'Immediately',
    r'\bac\b':                                                 'Before meals',
    r'\bpc\b':                                                 'After meals',
    r'\bhs\b':                                                 'At bedtime',
}


def clean_text(raw: str) -> str:
    """
    Normalize raw OCR text while preserving medical formatting.
    Returns cleaned string.
    """
    text = raw

    # 1. Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')

    # 2. Collapse excessive blank lines (max 1 blank line between blocks)
    text = re.sub(r'\n{3,}', '\n\n', text)

    # 3. Strip leading/trailing whitespace per line
    lines = [line.strip() for line in text.split('\n')]
    text  = '\n'.join(lines)

    # 4. Fix common OCR artifacts on clearly wrong standalone chars
    for bad, good in _CHAR_MAP.items():
        text = text.replace(f' {bad} ', f' {good} ')

    # 5. Normalize dosage units
    for pattern, replacement in _DOSAGE_FIXES:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    # 6. Normalize whitespace within lines (keep newlines)
    text = re.sub(r'[ \t]+', ' ', text)

    return text.strip()


def normalize_frequency(raw: str) -> str:
    """
    Map raw frequency text to standardized form.
    Returns original if no match found.
    """
    for pattern, normalized in _FREQ_MAP.items():
        if re.search(pattern, raw, flags=re.IGNORECASE):
            return normalized
    return raw.strip()
