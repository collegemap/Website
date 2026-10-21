"""
OpenRouter client — all models via one API key.

Model registry (only models confirmed working on free tier):
  PARSER      = nemotron-nano-30b    Stage 1 JSON extraction
  INTENT      = nemotron-super-120b  Stage 2A intent classification
  SYNTH       = nemotron-super-120b  Stage 2B evidence synthesis
  ARBITRATE   = nemotron-super-120b  Stage 2C conflict arbitration
  REFINE      = nemotron-nano-30b    Feedback loop query rewriting
  SCORER      = nemotron-super-120b  Stage 3A scoring
  NARRATOR    = gemma-3-27b          Stage 3B narrative
  RECOMMENDER = nemotron-nano-30b    Stage 3C recommendation
"""

import asyncio
import logging
import os
import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE    = "https://openrouter.ai/api/v1/chat/completions"

# ── Models (only using confirmed-working free tier models) ────────────────────
MODEL_NANO   = "nvidia/nemotron-3-nano-30b-a3b:free"
MODEL_SUPER  = "nvidia/nemotron-3-super-120b-a12b:free"
MODEL_GEMMA  = "google/gemma-3-27b-it:free"

MODEL_PARSER      = MODEL_NANO
MODEL_INTENT      = MODEL_SUPER   # qwen kept 429ing, use super
MODEL_SYNTH       = MODEL_SUPER
MODEL_ARBITRATE   = MODEL_SUPER
MODEL_REFINE      = MODEL_NANO
MODEL_SCORER      = MODEL_SUPER
MODEL_NARRATOR    = MODEL_GEMMA
MODEL_RECOMMENDER = MODEL_NANO

# ── Rate limiter — max 2 concurrent LLM calls ────────────────────────────────
_SEM = asyncio.Semaphore(2)

_HTTP: httpx.AsyncClient | None = None


def _get_http() -> httpx.AsyncClient:
    global _HTTP
    if _HTTP is None or _HTTP.is_closed:
        _HTTP = httpx.AsyncClient(timeout=180.0)
    return _HTTP


async def call_model(
    model: str,
    system: str,
    user: str,
    max_tokens: int = 2048,
    retries: int = 3,
) -> str:
    """
    Call any OpenRouter model. Returns assistant message text.
    Retries on 429 / 5xx. Falls back to MODEL_SUPER on failure.
    """
    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY not set in .env")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type":  "application/json",
        "HTTP-Referer":  "https://branchintel.iitpalakkad",
        "X-Title":       "BranchIntel",
    }
    payload = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
    }

    async with _SEM:
        for attempt in range(1, retries + 1):
            try:
                resp = await _get_http().post(
                    OPENROUTER_BASE, headers=headers, json=payload
                )

                if resp.status_code == 200:
                    data = resp.json()
                    text = data["choices"][0]["message"].get("content") or ""
                    if not text.strip():
                        logger.warning(f"[{model}] Empty response attempt {attempt}, retrying...")
                        await asyncio.sleep(3 * attempt)
                        continue
                    logger.info(f"[{model}] OK ({len(text)} chars)")
                    return text

                if resp.status_code == 429:
                    wait = 8 * attempt  # 8s, 16s, 24s
                    logger.warning(f"[{model}] 429 rate-limit, retry {attempt}/{retries} in {wait}s")
                    await asyncio.sleep(wait)
                    continue

                if resp.status_code >= 500:
                    wait = 5 * attempt
                    logger.warning(f"[{model}] {resp.status_code} server error, retry {attempt}/{retries} in {wait}s")
                    await asyncio.sleep(wait)
                    continue

                # 4xx — not retrying, but fall through to fallback
                logger.error(f"[{model}] {resp.status_code}: {resp.text[:300]}")
                break

            except httpx.TimeoutException:
                logger.warning(f"[{model}] Timeout attempt {attempt}/{retries}")
                if attempt == retries:
                    break
                await asyncio.sleep(5 * attempt)

        # All retries exhausted — try fallback if different model
        if model != MODEL_SUPER:
            logger.warning(f"[{model}] Failed, falling back to {MODEL_SUPER}")
            return await call_model(MODEL_SUPER, system, user, max_tokens, retries=2)

        raise RuntimeError(f"[{model}] All retries failed with no fallback.")


# ── Convenience wrappers ──────────────────────────────────────────────────────

async def call_parser(system: str, user: str) -> str:
    return await call_model(MODEL_PARSER, system, user, max_tokens=1024)

async def call_intent(system: str, user: str) -> str:
    return await call_model(MODEL_INTENT, system, user, max_tokens=512)

async def call_synth(system: str, user: str) -> str:
    return await call_model(MODEL_SYNTH, system, user, max_tokens=3000)  # increased

async def call_arbitrate(system: str, user: str) -> str:
    return await call_model(MODEL_ARBITRATE, system, user, max_tokens=1024)

async def call_refine(system: str, user: str) -> str:
    return await call_model(MODEL_REFINE, system, user, max_tokens=512)

async def call_scorer(system: str, user: str) -> str:
    return await call_model(MODEL_SCORER, system, user, max_tokens=3000)  # increased

async def call_narrator(system: str, user: str) -> str:
    return await call_model(MODEL_NARRATOR, system, user, max_tokens=512)

async def call_recommender(system: str, user: str) -> str:
    return await call_model(MODEL_RECOMMENDER, system, user, max_tokens=512)
