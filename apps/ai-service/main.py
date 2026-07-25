from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import uuid

from ocr.router import router as ocr_router

app = FastAPI(
    title="MediSync AI Service",
    description="FastAPI AI microservice for OCR prescription digitization and symptom triage",
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

# ─── OCR Routes ────────────────────────────────────────────────────────────────
app.include_router(ocr_router)


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    print("🔍 [AI-SERVICE] Received GET /health request")
    return {"status": "operational", "service": "medisync-ai", "version": "2.0.0"}


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
    print(f"🤖 [AI-SERVICE] Received POST /triage/chat request for patient: {request.patientId} (Symptoms: {symptom_text})")

    # Stub response — replace with real AI model call
    return {
        "sessionId": str(uuid.uuid4()),
        "urgencyLevel": "LOW",
        "response": f"[AI Stub] You reported: {symptom_text}. Please consult a doctor for a proper diagnosis.",
        "recommendedAction": "Schedule a clinic visit within 48 hours."
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
