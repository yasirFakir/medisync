import os
import json
import logging
import httpx
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

# ─── SRS v2.0 Medical Safety System Prompt ────────────────────────────────────
TRIAGE_SYSTEM_PROMPT = """
You are the MediSync AI Medical Intelligence & Triage Assistant.
Your primary role is to provide safe, educational guidance, symptom clarification, and home-care comfort advice.

MANDATORY SAFETY BOUNDARIES (SRS Section 4.10):
1. NEVER provide a definitive clinical diagnosis.
2. NEVER prescribe prescription medicines or modify existing dosages.
3. NEVER instruct a patient to abruptly stop prescribed medications.
4. If symptoms indicate an emergency (e.g. chest pain, severe breathing difficulty, sudden numbness, high uncontrolled fever with stiff neck, heavy bleeding), mark urgency as CRITICAL and advise immediate emergency care.
5. Always remind the patient that this guidance is educational and to consult a licensed physician or clinic for official clinical evaluation.

OUTPUT FORMAT REQUIREMENTS:
Provide your response in clear, empathetic, and easily readable markdown.
Include:
- **Assessment & Urgency**: (Specify LOW, MEDIUM, HIGH, or CRITICAL)
- **Understanding & Educational Guidance**: (Clear explanation of possible general causes and precautions)
- **Home Comfort Measures**: (Rest, hydration, safe self-care steps)
- **When to Seek Immediate Care / Recommended Action**: (Clear milestone for when to visit a doctor or ER)
"""

# ─── Non-Gemini Chat Title Generator (Grok / Groq / OpenAI) ───────────────────
async def generate_session_title(symptoms: List[str], additional_notes: Optional[str] = None) -> str:
    """
    Generates a concise 2-4 word chat title using Grok / Groq (Zero Gemini API usage).
    """
    symptom_str = ", ".join(symptoms) if symptoms else "Consultation"
    prompt = f"Generate a short, concise 2 to 4 word title for a health chat where the patient reports: {symptom_str}. Additional context: {additional_notes or 'None'}. Return ONLY the title words, no quotes, no punctuation, no markdown."

    grok_key = os.getenv("GROK_API_KEY", "") or os.getenv("XAI_API_KEY", "")
    if grok_key:
        try:
            headers = {"Authorization": f"Bearer {grok_key}", "Content-Type": "application/json"}
            payload = {
                "model": "grok-beta",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 15,
                "temperature": 0.2
            }
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post("https://api.x.ai/v1/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    title = res.json()["choices"][0]["message"]["content"].strip().strip('"\'')
                    if title:
                        return title
        except Exception:
            pass

    groq_key = os.getenv("GROQ_API_KEY", "")
    if groq_key:
        for model in ["qwen/qwen3.8-27b", "groq/compound", "qwen/qwen3.6-27b"]:
            try:
                headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
                payload = {
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 15,
                    "temperature": 0.2
                }
                async with httpx.AsyncClient(timeout=6.0) as client:
                    res = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
                    if res.status_code == 200:
                        title = res.json()["choices"][0]["message"]["content"].strip().strip('"\'')
                        if title and len(title) > 2:
                            return title
            except Exception:
                pass

    openai_key = os.getenv("OPENAI_API_KEY", "")
    if openai_key and not openai_key.startswith("your_"):
        try:
            headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 15,
                "temperature": 0.2
            }
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    title = res.json()["choices"][0]["message"]["content"].strip().strip('"\'')
                    if title:
                        return title
        except Exception:
            pass

    # Fast deterministic fallback title
    if symptoms:
        return " & ".join(symptoms[:2]) + " Care"
    return "Health Consultation"

async def generate_triage_response(
    symptoms: List[str],
    additional_notes: Optional[str] = None,
    conversation_history: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Executes multi-LLM triage reasoning supporting Grok (xAI), Groq, OpenAI, and Gemini fallbacks.
    Strictly preserves medical safety boundaries.
    """
    symptom_str = ", ".join(symptoms) if symptoms else "General health inquiry"
    
    # Generate chat title (without using Gemini)
    session_title = await generate_session_title(symptoms, additional_notes)
    
    # Build conversational history context
    history_messages: List[Dict[str, str]] = [
        {"role": "system", "content": TRIAGE_SYSTEM_PROMPT}
    ]
    
    if conversation_history:
        for msg in conversation_history:
            role = msg.get("role", "user")
            # Map role to standard 'user' or 'assistant'
            std_role = "assistant" if role.lower() in ["assistant", "ai", "bot"] else "user"
            history_messages.append({"role": std_role, "content": msg.get("content", "")})

    # Latest user query
    user_prompt = f"Symptoms reported: {symptom_str}."
    if additional_notes:
        user_prompt += f"\nAdditional Details / Latest Question: {additional_notes}"
    
    history_messages.append({"role": "user", "content": user_prompt})

    response_text = ""
    provider_used = "fallback"

    # ── 1. Grok (xAI API) ───────────────────────────────────────────────────────
    grok_key = os.getenv("GROK_API_KEY", "") or os.getenv("XAI_API_KEY", "")
    if grok_key:
        try:
            headers = {
                "Authorization": f"Bearer {grok_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "grok-beta",
                "messages": history_messages,
                "temperature": 0.3,
                "max_tokens": 1000
            }
            async with httpx.AsyncClient(timeout=14.0) as client:
                res = await client.post("https://api.x.ai/v1/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    response_text = data["choices"][0]["message"]["content"]
                    provider_used = "Grok (xAI)"
                    logger.info("Successfully generated triage via Grok (xAI).")
                else:
                    logger.warning(f"Grok API returned HTTP {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Grok API error: {e}")

    # ── 2. Groq (Fast High-Capacity LLM: Qwen / Compound / LLaMA) ────────────────
    if not response_text:
        groq_key = os.getenv("GROQ_API_KEY", "")
        if groq_key:
            models_to_try = ["qwen/qwen3.8-27b", "groq/compound", "qwen/qwen3.6-27b", "openai/gpt-oss-120b"]
            for model in models_to_try:
                try:
                    headers = {
                        "Authorization": f"Bearer {groq_key}",
                        "Content-Type": "application/json"
                    }
                    payload = {
                        "model": model,
                        "messages": history_messages,
                        "temperature": 0.3,
                        "max_tokens": 1000
                    }
                    async with httpx.AsyncClient(timeout=14.0) as client:
                        res = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
                        if res.status_code == 200:
                            data = res.json()
                            content = data["choices"][0]["message"]["content"]
                            if content and len(content.strip()) > 10:
                                response_text = content
                                provider_used = f"Groq ({model})"
                                logger.info(f"Successfully generated triage via Groq {model}.")
                                break
                        else:
                            logger.warning(f"Groq {model} returned HTTP {res.status_code}: {res.text}")
                except Exception as e:
                    logger.warning(f"Groq {model} failed: {e}")

    # ── 3. OpenAI Fallback ───────────────────────────────────────────────────────
    if not response_text:
        openai_key = os.getenv("OPENAI_API_KEY", "")
        if openai_key and not openai_key.startswith("your_"):
            try:
                headers = {
                    "Authorization": f"Bearer {openai_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": history_messages,
                    "temperature": 0.3,
                    "max_tokens": 1000
                }
                async with httpx.AsyncClient(timeout=14.0) as client:
                    res = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        response_text = data["choices"][0]["message"]["content"]
                        provider_used = "OpenAI (gpt-4o-mini)"
                        logger.info("Successfully generated triage via OpenAI.")
            except Exception as e:
                logger.warning(f"OpenAI triage error: {e}")

    # ── 4. Deterministic Rule-Based Triage Fallback ──────────────────────────────
    if not response_text:
        logger.warning("All external LLM providers failed or unconfigured; using deterministic triage engine.")
        # Assess based on red-flag keywords
        lower_prompt = user_prompt.lower()
        if any(w in lower_prompt for w in ["chest pain", "shortness of breath", "unconscious", "stroke", "paralysis", "bleeding"]):
            urgency = "CRITICAL"
            response_text = (
                f"⚠️ **Urgent Medical Notice**: You reported severe symptoms ({symptom_str}).\n\n"
                "These symptoms may indicate a condition requiring emergency medical attention.\n\n"
                "**Immediate Recommended Action:**\n"
                "- Please proceed to the nearest emergency room or hospital immediately.\n"
                "- Do not attempt to drive yourself if experiencing dizziness or severe pain."
            )
            recommended_action = "Seek immediate emergency medical care."
        elif any(w in lower_prompt for w in ["high fever", "vomiting", "stomach pain", "severe"]):
            urgency = "MEDIUM"
            response_text = (
                f"You reported moderate symptoms ({symptom_str}).\n\n"
                "**Educational Guidance:**\n"
                "- Ensure plenty of rest and adequate fluid intake (water, oral rehydration solutions).\n"
                "- Monitor your temperature and symptoms over the next 12–24 hours.\n\n"
                "**Recommended Action:**\n"
                "- If symptoms persist beyond 24 hours or worsen, schedule a consultation with a physician."
            )
            recommended_action = "Schedule a clinic consultation if symptoms do not improve."
        else:
            urgency = "LOW"
            response_text = (
                f"Thank you for sharing your symptoms ({symptom_str}).\n\n"
                "**General Guidance & Home Care:**\n"
                "- Get plenty of rest and drink adequate fluids.\n"
                "- Keep track of any changes or new symptoms.\n\n"
                "**Recommended Action:**\n"
                "- Consult a healthcare provider if you have underlying conditions or if symptoms persist."
            )
            recommended_action = "Monitor symptoms and rest. Consult a doctor if needed."

        return {
            "title": session_title,
            "urgencyLevel": urgency,
            "response": response_text,
            "recommendedAction": recommended_action,
            "provider": provider_used
        }

    # ── Urgency Level Extraction from AI Text ───────────────────────────────────
    urgency = "LOW"
    upper_resp = response_text.upper()
    if "URGENCY: CRITICAL" in upper_resp or "CRITICAL" in upper_resp[:200] or "EMERGENCY" in upper_resp[:200]:
        urgency = "CRITICAL"
    elif "URGENCY: HIGH" in upper_resp or "HIGH" in upper_resp[:200] or "URGENT" in upper_resp[:200]:
        urgency = "HIGH"
    elif "URGENCY: MEDIUM" in upper_resp or "MEDIUM" in upper_resp[:200] or "MODERATE" in upper_resp[:200]:
        urgency = "MEDIUM"

    recommended_action = "Consult a licensed healthcare professional for official diagnosis and treatment."
    if urgency == "CRITICAL":
        recommended_action = "Visit nearest emergency room or call medical emergency helpline immediately."
    elif urgency == "HIGH":
        recommended_action = "Visit a doctor or urgent care clinic within 24 hours."

    return {
        "title": session_title,
        "urgencyLevel": urgency,
        "response": response_text,
        "recommendedAction": recommended_action,
        "provider": provider_used
    }
