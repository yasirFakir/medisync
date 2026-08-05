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
    AI symptom triage endpoint using Gemini Provider with fallback.
    """
    symptom_text = ", ".join(request.symptoms)
    print(f"🤖 [AI-SERVICE] Received POST /triage/chat request for patient: {request.patientId} (Session: {request.sessionId}, Symptoms: {symptom_text})")

    # Format full conversation history if provided
    history_text = ""
    if request.conversationHistory and len(request.conversationHistory) > 0:
        history_lines = [f"{msg.role.upper()}: {msg.content}" for msg in request.conversationHistory]
        history_text = "\n\nPrevious Conversation History:\n" + "\n".join(history_lines)

    prompt = (
        f"Patient symptoms reported: {symptom_text}.\n"
        f"Additional notes / latest user query: {request.additionalNotes or 'None'}.\n"
        f"{history_text}\n\n"
        "Provide a coherent, direct response taking into account the entire conversation history above. "
        "Assess urgency (LOW, MEDIUM, HIGH, CRITICAL), explain educational precautions, and recommend next actions."
    )

    ai_explanation = await gemini_provider.generate_explanation(
        prompt=prompt,
        system_instruction=MEDICAL_SYSTEM_PROMPT + "\nAssess urgency level clearly."
    )

    # Determine urgency keyword
    urgency = "LOW"
    upper_resp = ai_explanation.upper()
    if "CRITICAL" in upper_resp or "EMERGENCY" in upper_resp:
        urgency = "CRITICAL"
    elif "HIGH" in upper_resp or "URGENT" in upper_resp:
        urgency = "HIGH"
    elif "MEDIUM" in upper_resp or "MODERATE" in upper_resp:
        urgency = "MEDIUM"

    session_id = request.sessionId or str(uuid.uuid4())

    return {
        "sessionId": session_id,
        "urgencyLevel": urgency,
        "response": ai_explanation,
        "recommendedAction": "Consult a healthcare provider or clinic for a physical assessment."
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
