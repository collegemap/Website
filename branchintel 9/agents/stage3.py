"""
Stage 3 — Judgment & Output
============================
Models used:
  3A Scorer      → openai/gpt-oss-20b     (structured chain-of-thought scoring)
  3B Narrator    → google/gemma-3-27b-it  (best prose quality)
  3C Recommender → qwen/qwen3-next-80b    (crisp decision output)
"""

import json
import logging
import re

from models.schemas import (
    CompareRequest, Stage2Result, Stage3Result,
    BranchScorecard, DimensionScore, Recommendation, Confidence,
)
from utils.gemini_client import call_scorer, call_narrator, call_recommender

logger = logging.getLogger(__name__)


def _clean_json(raw: str) -> str:
    return re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()


def _evidence_block(stage2: Stage2Result) -> str:
    er = stage2.evidence_record
    ip = stage2.intent_profile
    lines = [
        f"Intent: {ip.primary_intent.value}",
        f"Weights: {ip.weights}",
        f"Criteria priority: {ip.criteria_priority}",
        "",
        f"=== {er.branch1.branch_label} ===",
        "Top facts:",
    ]
    for f in er.branch1.top_facts:
        lines.append(f"  [{f.confidence.value}] {f.text}")
    lines.append("Weaknesses:")
    for w in er.branch1.weaknesses:
        lines.append(f"  [{w.confidence.value}] {w.text}")
    lines += ["", f"=== {er.branch2.branch_label} ===", "Top facts:"]
    for f in er.branch2.top_facts:
        lines.append(f"  [{f.confidence.value}] {f.text}")
    lines.append("Weaknesses:")
    for w in er.branch2.weaknesses:
        lines.append(f"  [{w.confidence.value}] {w.text}")
    return "\n".join(lines)


# ── 3A Scorer (gpt-oss-20b) ───────────────────────────────────────────────────

_SCORER_SYSTEM = """You are a chain-of-thought scoring agent for IIT branch comparisons.

Score each branch on 4 dimensions (0-100) using ONLY the evidence provided.
Compute a weighted overall score using the intent weights.

Return ONLY valid JSON — no markdown, no preamble.

Schema:
{
  "branch1": {
    "branch_label": "...",
    "placement":  {"score": 0, "confidence": "HIGH|MED|LOW", "reasoning": "1-2 sentences citing evidence", "supporting_claims": ["..."]},
    "research":   {"score": 0, "confidence": "HIGH|MED|LOW", "reasoning": "...", "supporting_claims": []},
    "culture":    {"score": 0, "confidence": "HIGH|MED|LOW", "reasoning": "...", "supporting_claims": []},
    "career_fit": {"score": 0, "confidence": "HIGH|MED|LOW", "reasoning": "...", "supporting_claims": []},
    "overall": 0
  },
  "branch2": { "...same structure..." }
}

Rules:
- Every score must be justified by at least one evidence claim
- If evidence is missing for a dimension, score 50 (neutral) with LOW confidence
- career_fit measures alignment with the user's PRIMARY INTENT — not a formula
- overall = weighted sum using provided intent weights, rounded to nearest integer
- Clamp all scores to [0, 100]
- confidence: HIGH if 2+ HIGH-confidence claims support it, MED if 1 HIGH or 2 MED, LOW otherwise
- supporting_claims: list exact claim texts used (max 3)
"""


async def scorer(stage2: Stage2Result) -> tuple[BranchScorecard, BranchScorecard]:
    logger.info("[3A Scorer] Scoring both branches (gpt-oss-20b)...")
    evidence = _evidence_block(stage2)
    ip = stage2.intent_profile

    user_prompt = f"""Evidence and intent:
{evidence}

Score both branches using these weights: {ip.weights}"""

    raw = await call_scorer(_SCORER_SYSTEM, user_prompt)

    try:
        data = json.loads(_clean_json(raw))

        def parse_scorecard(d: dict) -> BranchScorecard:
            def dim(key: str) -> DimensionScore:
                x = d.get(key, {})
                return DimensionScore(
                    score=max(0, min(100, int(x.get("score", 50)))),
                    confidence=Confidence(x.get("confidence", "LOW")),
                    reasoning=x.get("reasoning", "No reasoning provided."),
                    supporting_claims=x.get("supporting_claims", []),
                )
            return BranchScorecard(
                branch_label=d.get("branch_label", "Unknown"),
                placement=dim("placement"), research=dim("research"),
                culture=dim("culture"),    career_fit=dim("career_fit"),
                overall=max(0, min(100, int(d.get("overall", 50)))),
            )

        sc1 = parse_scorecard(data["branch1"])
        sc2 = parse_scorecard(data["branch2"])
        logger.info(f"[3A] {sc1.branch_label}: {sc1.overall}  |  {sc2.branch_label}: {sc2.overall}")
        return sc1, sc2

    except (json.JSONDecodeError, KeyError, ValueError) as e:
        logger.warning(f"[3A] Parse failed ({e}), using neutral scorecards.")
        neutral = DimensionScore(score=50, confidence=Confidence.LOW,
                                 reasoning="Scoring failed.", supporting_claims=[])
        def _neutral(label: str) -> BranchScorecard:
            return BranchScorecard(
                branch_label=label, placement=neutral, research=neutral,
                culture=neutral, career_fit=neutral, overall=50,
            )
        return (
            _neutral(stage2.evidence_record.branch1.branch_label),
            _neutral(stage2.evidence_record.branch2.branch_label),
        )


# ── 3B Narrator (gemma-3-27b) ─────────────────────────────────────────────────

_NARRATOR_SYSTEM = """You are a narrative writing agent for IIT branch comparisons.

Write exactly ONE paragraph (130-160 words) comparing two branches.

Rules:
- Ground EVERY sentence in the evidence provided — no hallucination
- Cite sources inline like: [IITB report 2024] or [Reddit survey]
- Start with the most important differentiator based on user intent
- Cover: placement, research depth, alumni paths, culture — in criteria_priority order
- End with a transition sentence that sets up the recommendation
- Write in clear, direct prose — no bullet points, no headers
- Do NOT mention scores or numbers not present in the evidence
"""


async def narrator(
    sc1: BranchScorecard,
    sc2: BranchScorecard,
    stage2: Stage2Result,
) -> str:
    logger.info("[3B Narrator] Writing narrative (gemma-3-27b)...")
    evidence = _evidence_block(stage2)
    ip = stage2.intent_profile

    user_prompt = f"""Evidence and intent:
{evidence}

Scores:
- {sc1.branch_label}: placement={sc1.placement.score}, research={sc1.research.score}, culture={sc1.culture.score}, career_fit={sc1.career_fit.score}, overall={sc1.overall}
- {sc2.branch_label}: placement={sc2.placement.score}, research={sc2.research.score}, culture={sc2.culture.score}, career_fit={sc2.career_fit.score}, overall={sc2.overall}

Criteria priority: {ip.criteria_priority}

Write the 130-160 word comparison paragraph."""

    narrative = await call_narrator(_NARRATOR_SYSTEM, user_prompt)
    narrative = narrative.strip()
    logger.info(f"[3B] Narrative written ({len(narrative.split())} words).")
    return narrative


# ── 3C Recommender (qwen3-80b) ────────────────────────────────────────────────

_RECOMMENDER_SYSTEM = """You are a recommendation agent for IIT branch comparisons.

Based on scores, evidence, and narrative, produce a final recommendation card.

Return ONLY valid JSON — no markdown, no preamble.

Schema:
{
  "winner": "exact branch_label string OR null if ambiguous",
  "ambiguous": true | false,
  "key_reason": "single most decisive reason (1 sentence, specific)",
  "caveat": "one important caveat or counter-scenario (1 sentence)",
  "confidence": "HIGH|MED|LOW"
}

Rules:
- ambiguous = true if overall scores are within 8 points AND no single dimension
  clearly separates them for the user's primary intent
- If ambiguous = true, winner must be null
- key_reason must cite a specific fact from evidence (not just "better scores")
- caveat: when would the other branch be the better choice?
- confidence HIGH: winner leads by 15+ points or dominates on top-priority dimension
- confidence MED: 8-14 points ahead
- confidence LOW: <8 points or borderline ambiguous
"""


async def recommender(
    sc1: BranchScorecard,
    sc2: BranchScorecard,
    narrative: str,
    stage2: Stage2Result,
) -> Recommendation:
    logger.info("[3C Recommender] Final recommendation (qwen3-80b)...")
    ip = stage2.intent_profile
    er = stage2.evidence_record

    user_prompt = f"""Intent: {ip.primary_intent.value}
Criteria priority: {ip.criteria_priority}

Scores:
- {sc1.branch_label}: overall={sc1.overall}, placement={sc1.placement.score}, research={sc1.research.score}, culture={sc1.culture.score}, career_fit={sc1.career_fit.score}
- {sc2.branch_label}: overall={sc2.overall}, placement={sc2.placement.score}, research={sc2.research.score}, culture={sc2.culture.score}, career_fit={sc2.career_fit.score}

Key evidence:
Branch 1 top facts: {[f.text for f in er.branch1.top_facts[:3]]}
Branch 2 top facts: {[f.text for f in er.branch2.top_facts[:3]]}

Narrative:
{narrative[:400]}

Produce the recommendation card."""

    raw = await call_recommender(_RECOMMENDER_SYSTEM, user_prompt)
    try:
        data = json.loads(_clean_json(raw))
        rec = Recommendation(
            winner=data.get("winner"),
            ambiguous=bool(data.get("ambiguous", False)),
            key_reason=data.get("key_reason", "Insufficient evidence for a clear recommendation."),
            caveat=data.get("caveat", ""),
            confidence=Confidence(data.get("confidence", "LOW")),
        )
        logger.info(f"[3C] winner={rec.winner}  ambiguous={rec.ambiguous}  conf={rec.confidence.value}")
        return rec
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        logger.warning(f"[3C] Parse failed ({e}), returning ambiguous.")
        return Recommendation(
            winner=None, ambiguous=True,
            key_reason="Could not determine a clear winner from available evidence.",
            caveat="Run again with a more specific query for better results.",
            confidence=Confidence.LOW,
        )


# ── Stage 3 Entry Point ───────────────────────────────────────────────────────

async def run_stage3(req: CompareRequest, stage2: Stage2Result) -> Stage3Result:
    sc1, sc2  = await scorer(stage2)
    narrative = await narrator(sc1, sc2, stage2)
    rec       = await recommender(sc1, sc2, narrative, stage2)
    return Stage3Result(scorecard1=sc1, scorecard2=sc2, narrative=narrative, recommendation=rec)
