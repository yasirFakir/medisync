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

        # 1. Primary Always-Free Provider: Groq Llama 3.3 70B (Fast & No Quota Blocks)
        groq_key = os.getenv("GROQ_API_KEY", "")
        if groq_key:
            try:
                import httpx
                headers = {
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": sys_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 800
                }
                async with httpx.AsyncClient(timeout=12.0) as groq_client:
                    res = await groq_client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
                    if res.status_code == 200:
                        content = res.json()["choices"][0]["message"]["content"]
                        if content:
                            logger.info("Successfully generated AI response via Groq Llama 3.3.")
                            return content
                    logger.warning(f"Groq API returned HTTP {res.status_code}: {res.text}")
            except Exception as groq_err:
                logger.warning(f"Groq API provider error: {groq_err}")

        # 2. Secondary Provider: Gemini SDK
        if self.client and hasattr(self.client, 'models'):
            for model_name in ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']:
                try:
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=full_prompt,
                    )
                    if response and hasattr(response, 'text'):
                        return response.text
                except Exception as e:
                    logger.warning(f"Gemini SDK model {model_name} failed/quota exceeded: {e}")

        # 3. Tertiary Provider: Gemini REST HTTP
        try:
            import httpx
            for model_name in ['gemini-1.5-flash', 'gemini-2.0-flash']:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
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
                    logger.warning(f"Gemini REST model {model_name} returned {res.status_code}: {res.text}")
        except Exception as err:
            logger.error(f"HTTP fallback error for Gemini API: {err}")

        return "MediSync Medical Assistant is temporarily unable to reach AI providers. Please check network connectivity and API keys."
