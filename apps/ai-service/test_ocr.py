"""
Automated unit & integration tests for OCR Pipeline (TASK-004).
Run with pytest or python test_ocr.py
"""

import sys
import os
import asyncio

# Add ai-service to python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ocr.cleaner import clean_text, normalize_frequency
from ocr.parser import parse_prescription, extract_doctor_name
from ocr.schemas import ConfidenceLevel, ExtractedField


def test_text_cleaner():
    raw_ocr = "Dr.  John Doe   MBBS\r\n\r\nRx:\nNapa   500 mg \n 2x daily "
    cleaned = clean_text(raw_ocr)
    assert "Dr. John Doe MBBS" in cleaned
    assert "500mg" in cleaned
    print("✅ test_text_cleaner passed")


def test_frequency_normalization():
    assert normalize_frequency("bd") == "Twice daily"
    assert normalize_frequency("once daily") == "Once daily"
    assert normalize_frequency("tds") == "Three times daily"
    print("✅ test_frequency_normalization passed")


def test_doctor_extraction():
    field = extract_doctor_name("Prescription by Dr. Sarah Jenkins MD\nDate: 2026-07-26")
    assert field.value == "Sarah Jenkins"
    assert field.confidence == ConfidenceLevel.HIGH
    print("✅ test_doctor_extraction passed")


def test_prescription_parser():
    cleaned = (
        "Dr. Ahmed Khan MBBS\n"
        "1. Napa 500mg\n"
        "   Twice daily after meals for 5 days\n"
        "2. Moxacil 250mg\n"
        "   Three times daily for 7 days"
    )
    doc, medicines, low_conf = parse_prescription(cleaned, [0.95, 0.92])

    assert doc.value == "Ahmed Khan"
    assert len(medicines) >= 2
    assert medicines[0].brand_name.value == "Napa"
    assert medicines[0].strength.value == "500mg"
    assert medicines[0].frequency.value == "Twice daily"
    assert medicines[0].duration.value == "5 days"
    print("✅ test_prescription_parser passed")


if __name__ == "__main__":
    test_text_cleaner()
    test_frequency_normalization()
    test_doctor_extraction()
    test_prescription_parser()
    print("\n🎉 All 4 OCR tests passed successfully!")
