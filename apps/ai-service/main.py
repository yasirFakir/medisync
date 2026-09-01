import os
from pathlib import Path

# Auto-load root .env file at startup
root_env = Path(__file__).resolve().parent.parent.parent / ".env"
if root_env.exists():
    with open(root_env, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import uuid

from ocr.router import router as ocr_router
from ocr.gemini_provider import GeminiProvider, MEDICAL_SYSTEM_PROMPT
from triage_service import generate_triage_response

app = FastAPI(
    title="MediSync AI Service",
    description="FastAPI AI microservice for OCR prescription digitization, AI Medical Assistant & Triage",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://localhost:3000",
        "http://medisync-backend:3001",
        "http://backend:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Provider instance
gemini_provider = GeminiProvider()

# ─── OCR Routes ────────────────────────────────────────────────────────────────
app.include_router(ocr_router)


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    print("🔍 [AI-SERVICE] Received GET /health request")
    return {
        "status": "operational",
        "service": "medisync-ai",
        "gemini_configured": bool(gemini_provider.api_key),
        "version": "2.0.0"
    }


# ─── Triage & Medical Assistant Models ───────────────────────────────────────
class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: str

class TriageRequest(BaseModel):
    patientId: str
    sessionId: Optional[str] = None
    symptoms: List[str]
    additionalNotes: Optional[str] = None
    conversationHistory: Optional[List[ChatMessage]] = None

class MedicineExplainRequest(BaseModel):
    medicineName: str
    saltComposition: Optional[str] = None
    question: Optional[str] = None

class PrescriptionExplainRequest(BaseModel):
    medicines: List[Dict[str, Any]]
    patientNotes: Optional[str] = None

@app.post("/triage/chat")
async def triage_chat(request: TriageRequest):
    """
    AI symptom triage endpoint using multi-LLM Medical Intelligence Engine (Grok / Groq / OpenAI fallback).
    """
    symptom_text = ", ".join(request.symptoms)
    print(f"🤖 [AI-SERVICE] Received POST /triage/chat request for patient: {request.patientId} (Session: {request.sessionId}, Symptoms: {symptom_text})")

    # Convert conversationHistory models to dicts if present
    history_dicts = None
    if request.conversationHistory:
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in request.conversationHistory]

    triage_result = await generate_triage_response(
        symptoms=request.symptoms,
        additional_notes=request.additionalNotes,
        conversation_history=history_dicts
    )

    session_id = request.sessionId or str(uuid.uuid4())

    return {
        "sessionId": session_id,
        "title": triage_result.get("title", "Health Consultation"),
        "urgencyLevel": triage_result.get("urgencyLevel", "LOW"),
        "response": triage_result.get("response", ""),
        "recommendedAction": triage_result.get("recommendedAction", "Consult a healthcare provider or clinic for a physical assessment.")
    }

@app.post("/ai/explain-medicine")
async def explain_medicine(request: MedicineExplainRequest):
    """
    TASK-006: Medical Intelligence Service — Explain medicine, uses, precautions.
    """
    prompt = (
        f"Medicine: {request.medicineName}\n"
        f"Salt Composition: {request.saltComposition or 'N/A'}\n"
        f"User Query: {request.question or 'Explain what this medicine is used for, common precautions, and basic guidance.'}"
    )

    response_text = await gemini_provider.generate_explanation(prompt)
    return {
        "medicineName": request.medicineName,
        "explanation": response_text,
        "provider": "Gemini API"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
