from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

app = FastAPI(
    title="MediSync AI Service",
    description="FastAPI AI microservice for OCR prescription digitization and symptom triage",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "operational", "service": "medisync-ai", "version": "1.0.0"}


# ─── OCR Endpoint ─────────────────────────────────────────────────────────────
@app.post("/ocr/digitize")
async def digitize_prescription(file: UploadFile = File(...)):
    """
    Receives prescription image and returns structured medicine data.
    TODO: Integrate Tesseract OCR + NLP parsing
    """
    contents = await file.read()

    # Stub response — replace with real Tesseract + NLP logic
    return {
        "digitizedNotes": f"[OCR stub] Received {len(contents)} bytes from {file.filename}",
        "doctorName": "Dr. Stub",
        "medicines": [
            {
                "brandName": "Napa",
                "saltComposition": "Paracetamol",
                "dosage": "500mg",
                "frequency": "Twice daily",
                "duration": "5 days"
            }
        ]
    }


# ─── Triage Chat Endpoint ────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: str

class TriageRequest(BaseModel):
    patientId: str
    symptoms: List[str]
    additionalNotes: Optional[str] = None
    conversationHistory: Optional[List[ChatMessage]] = None


@app.post("/triage/chat")
async def triage_chat(request: TriageRequest):
    """
    AI symptom triage endpoint.
    TODO: Integrate LLM (Gemini/OpenAI) for real triage logic
    """
    symptom_text = ", ".join(request.symptoms)

    # Stub response — replace with real AI model call
    return {
        "sessionId": "stub-session-001",
        "urgencyLevel": "LOW",
        "response": f"[AI Stub] You reported: {symptom_text}. Please consult a doctor for a proper diagnosis.",
        "recommendedAction": "Schedule a clinic visit within 48 hours."
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
