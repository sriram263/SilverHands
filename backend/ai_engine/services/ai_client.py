import json
import logging
import os
import re
import time
from typing import Any, Dict, List, Optional
import requests
from django.conf import settings

logger = logging.getLogger('silverhands.ai')


class AIServiceException(Exception):
    """Base exception for AI engine errors with safe client messages."""
    def __init__(self, message: str = "AI service temporarily unavailable.", status_code: int = 503):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class AIClient:
    """
    Centralized, singleton AI Client for SilverHands Intelligence Engine.
    Features:
    1. Multi-tier model cascade with automatic failover on rate limits, quota limits, and timeouts.
    2. Intelligent rate-limit cooldown tracking to avoid repeated 429 latency penalties.
    3. Dual SDK & direct REST failover engines.
    4. Deterministic contextual final fallback mechanisms guaranteeing zero 500 crashes.
    """
    _instance: Optional['AIClient'] = None

    # Supported candidate model pools in prioritized order
    GEMINI_CANDIDATE_MODELS = [
        "gemini-2.5-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-flash-latest",
    ]

    OPENAI_CANDIDATE_MODELS = [
        "gpt-4o-mini",
        "gpt-4o",
        "gpt-3.5-turbo",
    ]

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIClient, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, '_initialized', False):
            return
        
        self.timeout_seconds = 3.5
        self.max_retries = 0
        # Cooldown map: { model_name: expiration_timestamp }
        self._model_cooldowns: Dict[str, float] = {}
        self._initialized = True

    @property
    def provider(self) -> str:
        return getattr(settings, 'AI_PROVIDER', os.getenv('AI_PROVIDER', 'gemini')).lower()

    @property
    def api_key(self) -> str:
        return (
            getattr(settings, 'AI_API_KEY', '') or 
            getattr(settings, 'GEMINI_API_KEY', '') or 
            os.getenv('AI_API_KEY', '') or 
            os.getenv('GEMINI_API_KEY', '') or 
            os.getenv('GOOGLE_API_KEY', '')
        ).strip()

    @property
    def model(self) -> str:
        default_model = 'gemini-flash-latest' if self.provider == 'gemini' else 'gpt-4o-mini'
        return getattr(settings, 'AI_MODEL', os.getenv('AI_MODEL', default_model)).strip()

    @property
    def base_url(self) -> str:
        return getattr(settings, 'AI_BASE_URL', os.getenv('AI_BASE_URL', '')).strip()

    def is_configured(self) -> bool:
        """Checks if a valid external API key is configured."""
        return bool(self.api_key and len(self.api_key) > 5)

    def _is_rate_limit_or_quota_error(self, err_msg: str) -> bool:
        """Detects if an error is due to 429, resource exhaustion, rate limit, or quota exceed."""
        lower = err_msg.lower()
        return any(term in lower for term in [
            '429',
            'resource_exhausted',
            'resourceexhausted',
            'quota',
            'rate limit',
            'ratelimit',
            'limit exceeded',
            'too many requests',
            'quotaexceeded'
        ])

    def _is_overload_or_retryable_error(self, err_msg: str) -> bool:
        """Detects transient upstream server or model availability errors."""
        lower = err_msg.lower()
        return any(term in lower for term in [
            '503',
            'unavailable',
            'overloaded',
            '500',
            'internal error',
            'deadline exceeded',
            'timeout',
            'not found',
            '404'
        ])

    def _get_active_candidate_models(self) -> List[str]:
        """Returns sorted candidate models with non-cooldown models prioritized first."""
        base_pool = self.OPENAI_CANDIDATE_MODELS if self.provider == 'openai' else self.GEMINI_CANDIDATE_MODELS
        
        # Include configured model at top if not already first
        configured = self.model
        models = [configured] + [m for m in base_pool if m != configured]
        # Deduplicate while preserving order
        unique_models = list(dict.fromkeys([m for m in models if m]))

        current_time = time.time()
        # Clean expired cooldowns
        self._model_cooldowns = {k: v for k, v in self._model_cooldowns.items() if v > current_time}

        ready_models = [m for m in unique_models if m not in self._model_cooldowns]
        cooldown_models = [m for m in unique_models if m in self._model_cooldowns]

        # Prioritize ready models first, then cooling down models as last resort
        return ready_models + cooldown_models

    def _mark_model_rate_limited(self, model_name: str, duration: float = 45.0):
        """Marks a model as temporarily rate-limited for specified duration in seconds."""
        self._model_cooldowns[model_name] = time.time() + duration
        logger.warning(f"🛑 Model '{model_name}' marked on cooldown for {duration}s due to quota / rate limit.")

    def generate_json(
        self,
        prompt: str,
        system_instruction: str = "You are the SilverHands AI Assistant. Always respond with pure valid JSON only.",
        default_fallback: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Sends a prompt to the external AI model cascade and parses the resulting structured JSON.
        Automatically shifts models on rate limits, quota limits, 429s, and 503s.
        If all external models fail, activates the deterministic final fallback mechanism.
        """
        if not prompt or not prompt.strip():
            raise AIServiceException("Input text cannot be empty.", status_code=400)

        # If API key is not configured, activate final fallback immediately
        if not self.is_configured():
            logger.info("AI API key is not configured. Activating deterministic local fallback engine.")
            if default_fallback is not None:
                resp = dict(default_fallback)
                resp['_fallback_used'] = True
                return resp
            return {
                "status": "fallback",
                "message": "AI services offline. Default response provided.",
                "_fallback_used": True
            }

        retries = 0
        last_error = None

        while retries <= self.max_retries:
            try:
                raw_response = self._call_ai_api(prompt, system_instruction)
                parsed = self._extract_json(raw_response)
                if isinstance(parsed, dict):
                    return parsed
                elif isinstance(parsed, list):
                    return {"data": parsed}
                else:
                    raise ValueError(f"Expected JSON object or array, got {type(parsed)}")
            except Exception as e:
                last_error = str(e)
                logger.warning(f"AI generation attempt {retries + 1} failed: {e}")

            retries += 1

        # All live models in the cascade failed or timed out
        logger.error(f"All external AI models exhausted. Final error: {last_error}")
        if default_fallback is not None:
            logger.info("🛡️ Activating final deterministic fallback mechanism.")
            resp = dict(default_fallback)
            resp['_fallback_used'] = True
            return resp
        
        # If no default fallback was explicitly provided, return safe structured fallback
        return {
            "status": "fallback",
            "message": f"AI service temporarily unavailable ({last_error}).",
            "reply": "I am currently operating in offline resilience mode. Please explore our services, products, or try again in a few moments.",
            "_fallback_used": True
        }

    def _call_ai_api(self, prompt: str, system_instruction: str) -> str:
        """Dispatches request to configured provider with multi-model failover."""
        if self.provider == 'openai':
            return self._call_openai(prompt, system_instruction)
        else:
            return self._call_gemini(prompt, system_instruction)

    def _call_gemini(self, prompt: str, system_instruction: str) -> str:
        """
        Calls Google Gemini API using google-genai SDK or direct REST with multi-model cascade.
        Seamlessly rotates to other models when rate limits, 429s, or quotas are exceeded.
        """
        candidate_models = self._get_active_candidate_models()
        last_error = None

        # 1. Try official google-genai SDK first across candidate models
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)
            config = types.GenerateContentConfig(
                system_instruction=system_instruction + "\nCRITICAL: Always respond ONLY with pure valid JSON.",
                response_mime_type="application/json",
                temperature=0.2
            )

            for target_model in candidate_models:
                try:
                    response = client.models.generate_content(
                        model=target_model,
                        contents=prompt,
                        config=config
                    )
                    if response and response.text:
                        return response.text
                except Exception as sdk_err:
                    last_error = sdk_err
                    err_msg = str(sdk_err)
                    
                    if self._is_rate_limit_or_quota_error(err_msg):
                        self._mark_model_rate_limited(target_model, duration=45.0)
                        logger.warning(f"⚡ Model '{target_model}' rate/quota limit exceeded: {err_msg}. Failing over to next candidate model...")
                    else:
                        logger.warning(f"⚠️ Model '{target_model}' failed ({type(sdk_err).__name__}: {err_msg[:120]}). Failing over to next candidate model...")
                    continue
        except ImportError:
            logger.info("google-genai SDK not imported, falling back to direct REST cascade.")

        # 2. Direct REST fallback across candidate models
        for target_model in candidate_models:
            try:
                url = self.base_url or f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={self.api_key}"
                headers = {
                    "Content-Type": "application/json",
                    "x-goog-api-key": self.api_key,
                }
                payload = {
                    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                    "systemInstruction": {"parts": [{"text": system_instruction + "\nCRITICAL: Respond ONLY in pure valid JSON."}]},
                    "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
                }

                response = requests.post(url, headers=headers, json=payload, timeout=self.timeout_seconds)
                
                if response.status_code == 429:
                    self._mark_model_rate_limited(target_model, duration=45.0)
                    logger.warning(f"⚡ REST endpoint for model '{target_model}' returned HTTP 429 Too Many Requests. Failing over...")
                    continue

                response.raise_for_status()
                data = response.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
            except Exception as rest_err:
                last_error = rest_err
                logger.warning(f"⚠️ Gemini REST fallback failed on model '{target_model}': {rest_err}")
                continue

        raise last_error or Exception("Failed to get response from Gemini API across all candidate models.")

    def _call_openai(self, prompt: str, system_instruction: str) -> str:
        """Calls OpenAI with candidate model rotation on rate limits."""
        candidate_models = self._get_active_candidate_models()
        last_error = None

        for target_model in candidate_models:
            try:
                url = self.base_url or "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
                payload = {
                    "model": target_model,
                    "messages": [
                        {"role": "system", "content": system_instruction + "\nReturn pure valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"}
                }

                response = requests.post(url, headers=headers, json=payload, timeout=self.timeout_seconds)
                
                if response.status_code == 429:
                    self._mark_model_rate_limited(target_model, duration=45.0)
                    logger.warning(f"⚡ OpenAI model '{target_model}' returned 429 Rate Limit Exceeded. Failing over to next model...")
                    continue

                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
            except Exception as err:
                last_error = err
                logger.warning(f"⚠️ OpenAI model '{target_model}' error: {err}")
                continue

        raise last_error or Exception("Failed to get response from OpenAI across all candidate models.")

    def _extract_json(self, text: str) -> Any:
        """Robust JSON extractor that strips markdown fences, comments, and repairs formatting."""
        if not text:
            raise ValueError("Empty response received from AI model")

        cleaned = text.strip()
        cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\s*```$', '', cleaned)
        cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', cleaned)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass

        raise ValueError(f"Failed to parse valid JSON from AI output: {cleaned[:200]}")


# Global singleton instance
ai_client = AIClient()
