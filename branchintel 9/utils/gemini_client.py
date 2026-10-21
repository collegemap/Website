"""
Gemini multi-model client with graceful fallback.
If ALL models hit rate limits, returns a sensible default so the
pipeline never crashes — it just completes with lower confidence.
"""

import asyncio
import json
import logging
import os
import httpx
from dotenv import load_dotenv

load_dotenv()
logging.getLogger("httpx").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
BASE = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

# Priority order — model IDs must exist for the Gemini API (see ai.google.dev model list)
MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]

_SEMS = {m: asyncio.Semaphore(2) for m in MODELS}
_HTTP: httpx.AsyncClient | None = None


def _get_http() -> httpx.AsyncClient:
    global _HTTP
    if _HTTP is None or _HTTP.is_closed:
        _HTTP = httpx.AsyncClient(timeout=120.0)
    return _HTTP


async def _try_model(model: str, system: str, user: str, max_tokens: int) -> str | None:
    """Try one model. Returns text on success, None on rate-limit, raises on hard error."""
    if model not in _SEMS:
        _SEMS[model] = asyncio.Semaphore(2)

    url = BASE.format(model=model)
    payload = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0.4},
    }

    async with _SEMS[model]:
        try:
            resp = await _get_http().post(url, params={"key": GEMINI_API_KEY}, json=payload)

            if resp.status_code == 200:
                data = resp.json()
                cand = data.get("candidates") or []
                if not cand:
                    logger.warning(f"[{model}] 200 but no candidates (blocked or empty)")
                    return None
                parts = (cand[0].get("content") or {}).get("parts") or []
                if not parts:
                    logger.warning(f"[{model}] 200 but no content parts")
                    return None
                text = parts[0].get("text") or ""
                if text.strip():
                    logger.info(f"[{model}] OK ({len(text)} chars)")
                    return text
                return None

            if resp.status_code == 429:
                logger.warning(f"[{model}] 429 rate-limited, trying next model...")
                return None  # signal to try next model

            logger.error(f"[{model}] {resp.status_code}: {resp.text[:200]}")
            return None

        except httpx.TimeoutException:
            logger.warning(f"[{model}] Timeout")
            return None
        except Exception as e:
            logger.warning(f"[{model}] Error: {e}")
            return None


async def call_gemini(system: str, user: str, max_tokens: int = 2000, preferred: str = None) -> str:
    """
    Try models in priority order. First success wins.
    If preferred model is set, try it first.
    Never crashes — returns a safe fallback JSON if all models fail.
    """
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set in .env")

    order = MODELS.copy()
    if preferred and preferred in order:
        order.remove(preferred)
        order.insert(0, preferred)

    for model in order:
        result = await _try_model(model, system, user, max_tokens)
        if result:
            return result
        await asyncio.sleep(1)  # small gap between model attempts

    # All models rate-limited — return safe fallback so pipeline doesn't crash
    logger.error("ALL Gemini models rate-limited. Returning fallback response.")
    return json.dumps({
        "claims": [{"text": "Data temporarily unavailable due to rate limits.", "confidence": "LOW", "source_url": None, "date": None}],
        "gaps": ["All models rate-limited"],
        "conf_overall": "LOW",
        "primary_intent": "HOLISTIC",
        "criteria_priority": ["placement", "research", "culture", "alumni", "curriculum"],
        "implicit_constraints": [],
        "weights": {"placement": 0.2, "research": 0.2, "culture": 0.2, "alumni": 0.2, "curriculum": 0.2},
        "branch1": {"branch_label": "Branch 1", "top_facts": [], "weaknesses": [], "conf_overall": "LOW"},
        "branch2": {"branch_label": "Branch 2", "top_facts": [], "weaknesses": [], "conf_overall": "LOW"},
        "conflict_rate": 0.0, "unresolved_topics": [], "recommended_requery": [],
        "conflicts": [],
        "branch1_score": {"placement": {"score": 50, "confidence": "LOW", "reasoning": "Rate limited", "supporting_claims": []}, "research": {"score": 50, "confidence": "LOW", "reasoning": "Rate limited", "supporting_claims": []}, "culture": {"score": 50, "confidence": "LOW", "reasoning": "Rate limited", "supporting_claims": []}, "career_fit": {"score": 50, "confidence": "LOW", "reasoning": "Rate limited", "supporting_claims": []}, "overall": 50},
        "winner": None, "ambiguous": True,
        "key_reason": "Insufficient data due to temporary rate limiting.",
        "caveat": "Please retry in a minute.",
        "confidence": "LOW",
        "narrative": "Unable to generate comparison due to temporary API rate limits. Please try again in 60 seconds.",
        "queries": []
    })


# ── Wrappers — preferred model per stage ─────────────────────────────────────

async def call_parser(system: str, user: str) -> str:
    return await call_gemini(system, user, max_tokens=1500, preferred="gemini-2.5-flash")

async def call_intent(system: str, user: str) -> str:
    return await call_gemini(system, user, max_tokens=600, preferred="gemini-2.5-pro")

async def call_synth(system: str, user: str) -> str:
    return await call_gemini(system, user, max_tokens=3000, preferred="gemini-2.5-pro")

async def call_arbitrate(system: str, user: str) -> str:
    return await call_gemini(system, user, max_tokens=1500, preferred="gemini-2.0-flash")

async def call_refine(system: str, user: str) -> str:
    return await call_gemini(system, user, max_tokens=600, preferred="gemini-2.0-flash")

async def call_scorer(system: str, user: str) -> str:
    return await call_gemini(system, user, max_tokens=3000, preferred="gemini-2.5-flash")

async def call_narrator(system: str, user: str) -> str:
    return await call_gemini(system, user, max_tokens=600, preferred="gemini-2.5-flash-lite")

async def call_recommender(system: str, user: str) -> str:
    return await call_gemini(system, user, max_tokens=600, preferred="gemini-2.5-flash-lite")

async def call_model(model: str, system: str, user: str, max_tokens: int = 2048, retries: int = 3) -> str:
    return await call_gemini(system, user, max_tokens=max_tokens)
