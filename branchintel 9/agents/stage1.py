"""
Stage 1 — Intelligence Gathering via Gemini 2.0 Flash
======================================================
8 specialized agents ask Gemini focused questions about IIT branches.
Each agent has a specific domain — placements, academics, alumni, culture.
Gemini has strong training knowledge on all major IITs.
"""

import json
import logging
import re

from models.schemas import (
    AgentBundle, Claim, Confidence, CompareRequest, Stage1Result
)
from utils.gemini_client import call_parser

logger = logging.getLogger(__name__)


KNOWLEDGE_SYSTEM = """You are a highly knowledgeable expert on Indian IITs with detailed,
accurate knowledge of placements, academics, alumni careers, and student culture at all IITs.

You will be asked about a specific IIT branch on a focused topic.
Be specific — use real numbers, real company names, real facts from your training knowledge.
Write like a well-informed senior student or placement advisor who knows the data cold.

Return ONLY valid JSON — no markdown fences, no preamble, no explanation.

Schema:
{
  "claims": [
    {
      "text": "specific factual claim (1 sentence, include numbers/names where known)",
      "source_url": null,
      "confidence": "HIGH" | "MED" | "LOW",
      "date": "2023" | "2024" | null
    }
  ],
  "gaps": ["things you are genuinely uncertain about"],
  "conf_overall": "HIGH" | "MED" | "LOW"
}

Rules:
- Give 5-6 specific, detailed claims
- HIGH: well-known, widely reported, confident this is accurate
- MED: approximately correct, may be slightly off
- LOW: rough estimate or uncertain
- Be specific — "average CTC ~28-32 LPA" is better than "high salary"
- Include company names, specific numbers, named labs, named roles
- conf_overall reflects your overall confidence in this data
"""


async def _ask_gemini(agent_id: str, target: str, question: str) -> AgentBundle:
    user_prompt = f"""Tell me everything you know about: {question}

Target branch: {target}

Be specific with numbers, company names, and facts. Return as JSON."""

    try:
        raw = await call_parser(KNOWLEDGE_SYSTEM, user_prompt)
        raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
        data = json.loads(raw)
        claims = [
            Claim(
                text=c["text"],
                source_url=None,
                confidence=Confidence(c.get("confidence", "MED")),
                date=c.get("date"),
            )
            for c in data.get("claims", [])
        ]
        bundle = AgentBundle(
            agent_id=agent_id, stage=1, target=target,
            claims=claims,
            gaps=data.get("gaps", []),
            conf_overall=Confidence(data.get("conf_overall", "MED")),
            raw_snippets=[],
        )
        logger.info(f"[{agent_id}] {target} — {len(claims)} claims [{bundle.conf_overall.value}]")
        return bundle

    except (json.JSONDecodeError, KeyError, ValueError) as e:
        logger.warning(f"[{agent_id}] Parse failed: {e}")
        return AgentBundle(
            agent_id=agent_id, stage=1, target=target,
            claims=[], gaps=["Response parse failed"],
            conf_overall=Confidence.LOW, raw_snippets=[],
        )


async def placement_hunter(iit: str, branch: str) -> AgentBundle:
    return await _ask_gemini(
        "placement_hunter", f"{branch} / {iit}",
        f"Placement statistics for {branch} at {iit} — "
        f"average CTC, median CTC, highest package, top 5 recruiting companies, "
        f"number of FAANG/MAANG offers, PPO conversion rate, total students placed, "
        f"percentage of students placed. Use 2023-2024 data."
    )


async def academic_scout(iit: str, branch: str) -> AgentBundle:
    return await _ask_gemini(
        "academic_scout", f"{branch} / {iit}",
        f"Academic profile of {branch} at {iit} — "
        f"major curriculum highlights, elective areas and specializations, "
        f"top research labs with their names, faculty count and notable professors, "
        f"NIRF ranking position, publications and research grants, "
        f"industry collaborations and international tie-ups."
    )


async def alumni_tracker(iit: str, branch: str) -> AgentBundle:
    return await _ask_gemini(
        "alumni_tracker", f"{branch} / {iit}",
        f"Alumni career outcomes for {branch} at {iit} — "
        f"most common job roles 3-5 years post graduation (SDE, PM, quant, etc), "
        f"top companies where alumni work, percentage split across "
        f"software/core/product management/research/startups/higher studies, "
        f"any well-known alumni names and their current roles."
    )


async def sentiment_agent(iit: str, branch: str) -> AgentBundle:
    return await _ask_gemini(
        "sentiment_agent", f"{branch} / {iit}",
        f"Honest student experience for {branch} at {iit} — "
        f"academic workload and stress level, peer competitiveness culture, "
        f"how students rate department quality, professor quality and accessibility, "
        f"common complaints students post on Reddit/Quora, "
        f"hidden advantages or disadvantages not obvious from rankings, "
        f"overall student satisfaction."
    )


async def run_stage1(req: CompareRequest) -> Stage1Result:
    logger.info(
        f"[Stage 1] Gemini intelligence gathering — "
        f"{req.branch1}/{req.iit1} vs {req.branch2}/{req.iit2}"
    )

    ph1 = await placement_hunter(req.iit1, req.branch1)
    ph2 = await placement_hunter(req.iit2, req.branch2)
    as1 = await academic_scout(req.iit1, req.branch1)
    as2 = await academic_scout(req.iit2, req.branch2)
    at1 = await alumni_tracker(req.iit1, req.branch1)
    at2 = await alumni_tracker(req.iit2, req.branch2)
    sa1 = await sentiment_agent(req.iit1, req.branch1)
    sa2 = await sentiment_agent(req.iit2, req.branch2)

    logger.info("[Stage 1] All 8 agents complete.")
    return Stage1Result(
        placement_hunter_1=ph1, placement_hunter_2=ph2,
        academic_scout_1=as1,   academic_scout_2=as2,
        alumni_tracker_1=at1,   alumni_tracker_2=at2,
        sentiment_agent_1=sa1,  sentiment_agent_2=sa2,
    )
