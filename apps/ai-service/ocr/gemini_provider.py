import os
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# System Safety Prompt template enforcing MediSync safety rules
MEDICAL_SYSTEM_PROMPT = """
You are MediSync Medical Assistant, an educational and clarification AI assistant.
Follow these mandatory safety rules:
1. Provide educational summaries and clear explanations of medicines, uses, precautions, and instructions.
2. DO NOT provide definitive diagnoses or prescribe dosages.
3. Include a subtle disclaimer encouraging consultation with a qualified healthcare professional.
4. Keep explanations concise, clear, and reassuring.
"""

class GeminiProvider:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.client = None
        self._init_client()

    def _init_client(self):
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is missing in environment.")
            return

        try:
            # Try new google-genai SDK first
            from google import genai
            self.client = genai.Client(api_key=self.api_key)
            logger.info("Initialized Google GenAI SDK client successfully.")
        except ImportError:
            try:
                # Fallback to legacy google-generativeai SDK
                import google.generativeai as legacy_genai
                legacy_genai.configure(api_key=self.api_key)
                self.client = legacy_genai.GenerativeModel('gemini-1.5-flash')
                logger.info("Initialized legacy google.generativeai client successfully.")
            except ImportError:
                logger.warning("Neither google-genai nor google-generativeai is installed.")

    async def generate_explanation(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        if not self.api_key:
            return "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file."

        sys_prompt = system_instruction or MEDICAL_SYSTEM_PROMPT
        full_prompt = f"{sys_prompt}\n\nUser Question:\n{prompt}"

        # 1. Try google-genai SDK client
        if self.client and hasattr(self.client, 'models'):
            try:
                response = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=full_prompt,
                )
                if response and hasattr(response, 'text'):
                    return response.text
            except Exception as e:
                logger.error(f"Error calling Gemini genai client: {e}")

        # 2. Try raw REST HTTP call as robust fallback
        try:
            import httpx
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
            payload = {
                "contents": [{
                    "parts": [{"text": full_prompt}]
                }]
            }
            async with httpx.AsyncClient(timeout=15.0) as http_client:
                res = await http_client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                logger.error(f"Gemini REST API error {res.status_code}: {res.text}")
        except Exception as err:
            logger.error(f"HTTP fallback error for Gemini API: {err}")

        return "MediSync Medical Assistant is temporarily unable to reach Gemini API. Please check network connectivity and API key."
