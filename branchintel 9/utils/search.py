import asyncio
import logging
import time
from duckduckgo_search import DDGS

logger = logging.getLogger(__name__)

# Only 2 concurrent searches at a time — DDG rate-limits hard on free tier
_SEARCH_SEMAPHORE = asyncio.Semaphore(2)
_last_search_time = 0.0
_MIN_GAP = 1.2  # seconds between any two searches


async def web_search(query: str, max_results: int = 5) -> list[dict]:
    """
    DuckDuckGo search, rate-limited to avoid 202 Ratelimit errors.
    Returns list of {"title", "href", "body"} dicts.
    """
    global _last_search_time

    async with _SEARCH_SEMAPHORE:
        # Enforce minimum gap between requests
        now = asyncio.get_event_loop().time()
        gap = _MIN_GAP - (now - _last_search_time)
        if gap > 0:
            await asyncio.sleep(gap)

        loop = asyncio.get_event_loop()
        for attempt in range(1, 4):
            try:
                results = await loop.run_in_executor(
                    None, _sync_search, query, max_results
                )
                _last_search_time = asyncio.get_event_loop().time()
                return results
            except Exception as e:
                err = str(e)
                if "Ratelimit" in err or "202" in err:
                    wait = 3 * attempt
                    logger.warning(f"Search rate-limited for '{query[:50]}', waiting {wait}s (attempt {attempt}/3)")
                    await asyncio.sleep(wait)
                else:
                    logger.warning(f"Search failed for '{query[:50]}': {e}")
                    return []
        logger.warning(f"Search gave up after 3 attempts: '{query[:50]}'")
        return []


def _sync_search(query: str, max_results: int) -> list[dict]:
    with DDGS() as ddgs:
        return list(ddgs.text(query, max_results=max_results))


def extract_snippets(results: list[dict]) -> list[str]:
    return [r.get("body", "") for r in results if r.get("body")]


def extract_urls(results: list[dict]) -> list[str]:
    return [r.get("href", "") for r in results if r.get("href")]
