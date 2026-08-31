"""
OCR Text Cleaner — deterministic normalization of raw OCR output.
No AI. No inference. Pure string transformation.
"""

import re


# Common OCR character-level substitutions for medical text
_CHAR_MAP = {
    '&':  'and',
}

# ─── OCR Noise: Medicine prefix garble fixes ─────────────────────────────────
# PaddleOCR frequently misreads Tab → Ta6, TGb, T96, Tob, Tal, Tol on handwritten Rx
_MED_PREFIX_FIXES = [
    (r'\b(Ta6|TGb|T96|T9b|T6b|Tob|Tab6|Tal|Tol|Tabs?|TAB)\.?', 'Tab.'),
    (r'\b(Cap6|Ca6|CaP|CAP|Cqp)\.?',                         'Cap.'),
    (r'\b(Syp6|Sy6|SYP|yp)\.?',                              'Syp.'),
    (r'\b(Inj6|In6|INJ)\.?',                              'Inj.'),
]

# Insert space between compact doctor title: "Dr.Md.ArifHossain" → "Dr. Md. Arif Hossain"
_DOCTOR_TITLE_FIX = [
    (r'\bDr\.?([A-Z])', r'Dr. \1'),
    (r'\bDr\.\s*Md\.?([A-Z])', r'Dr. Md. \1'),
    (r'([a-z])([A-Z])', r'\1 \2'),  # camelCase separation for names like ArifHossain -> Arif Hossain
]

# After prefix normalization, insert space between prefix and medicine name if missing
_MED_SPACE_FIX = re.compile(r'\b(Tab|Cap|Syp|Inj)\.?([A-Z][a-z])')

# Medicine dosage and frequency patterns often OCR'd incorrectly on handwritten Bangladeshi Rx
_DOSAGE_FIXES = [
    (r'(\d+)\s*[mM][gG]',       r'\1mg'),
    (r'(\d+)\s*[mM][lL]',       r'\1ml'),
    (r'(\d+)\s*[mM][cC][gG]',   r'\1mcg'),
    (r'(\d+)\s*[iI][uU]',       r'\1 IU'),
    (r'(\d+)\s*%',               r'\1%'),
    # Handwritten Bangladeshi dosage notation normalization (e.g. 1+0+1, 0+0+1, 0+1+0, 1/2+0+1/2)
    (r'\b(?:I\+ot[l1]|Itoe[l1]|I\+ol|Itoel|ItoelZR|1\+ol)\b',          '1+0+1'),
    (r'\b(?:0\+o[e]?[l1]|otoel|o\+oel|0\+oel)\b',                      '0+0+1'),
    (r'\b(?:o\+to\s*o\s*b|o\+tb|0\+tb)\b',                            '0+1+0'),
    (r'\b(?:1\+00|1\+o\+o)\b',                                         '1+0+0'),
    (r'\b(?:I\+1\+1|1\+1\+1\-)\b',                                     '1+1+1'),
    (r'\b1/2\s*\+\s*0\s*\+\s*1/2\b',                                  '1/2+0+1/2'),
    # Common OCR garbled Bangladeshi prescription duration markers (b/br/bu -> 6 months, g -> 14 days, s -> 7 days)
 (r'(?<=1\+0\+1)\s*[\-\s]*[b|br|bu|zrkmsy\-b]\b',   ' 1+0+1 - 6 months'),
    (r'(?<=0\+0\+1)\s*[\-\s]*[b|br|bu]\b',             ' 0+0+1 - 6 months'),
    (r'(?<=1\+0\+0)\s*[\-\s]*[b|br|bu]\b',             ' 1+0+0 - 6 months'),
    (r'(?<=2\+0\+0)\s*[\-\s]*[b|br|bu]\b',             ' 2+0+0 - 6 months'),
    (r'(?<=1\+0\+1)\s*[\-\s]*g\b',                      ' 1+0+1 - 14 days'),
    (r'(?<=1\+1\+1)\s*[\-\s]*s\b',                      ' 1+1+1 - 7 days'),
    (r'৬\s*মাস',                                       '6 months'),
    (r'১৪\s*দিন',                                      '14 days'),
    (r'৭\s*দিন',                                       '7 days'),
    (r'১\s*মাস',                                       '1 month'),
    (r'২\s*মাস',                                       '2 months'),
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

    # 4. Fix OCR-garbled medicine prefixes FIRST (Tab/Cap/Syp/Inj)
    for pattern, replacement in _MED_PREFIX_FIXES:
        text = re.sub(pattern, replacement, text)

    # 4b. Insert space between prefix and medicine name when missing (TabVastaxel → Tab. Vastaxel)
    text = _MED_SPACE_FIX.sub(r'\1. \2', text)

    # 5. Fix common OCR artifacts on clearly wrong standalone chars
    for bad, good in _CHAR_MAP.items():
        text = text.replace(f' {bad} ', f' {good} ')

    # 6. Normalize dosage units and notation
    for pattern, replacement in _DOSAGE_FIXES:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    # 7. Normalize whitespace within lines (keep newlines)
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

