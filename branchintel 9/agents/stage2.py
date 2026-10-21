"""
Stage 2 — Multi-Agent Reasoning + Self-Correcting Feedback Loop
=================================================================
Models used:
  2A Intent Analyst      → qwen/qwen3-next-80b   (instruction-following)
  2B Evidence Synthesizer → nvidia/nemotron-super-120b (deep reasoning over many claims)
  2C Conflict Arbitrator  → nvidia/nemotron-super-120b (conflict detection)
  Query Refiner           → openai/gpt-oss-20b   (targeted query rewriting)

Sequential chain. Feedback loop fires if conflict_rate > 0.30 (max 2 loops).
"""

import asyncio
import json
import logging
import re

from models.schemas import (
    CompareRequest, Stage1Result, Stage2Result,
    IntentProfile, IntentType,
    BranchEvidence, EvidenceRecord,
    Claim, Confidence,
)
from utils.gemini_client import (
    call_intent, call_synth, call_arbitrate, call_refine
)

logger = logging.getLogger(__name__)
MAX_FEEDBACK_LOOPS = 2
CONFLICT_THRESHOLD = 0.30


def _clean_json(raw: str) -> str:
    return re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()


def _bundles_to_text(stage1: Stage1Result) -> str:
    lines = []
    for field_name in stage1.model_fields:
        bundle = getattr(stage1, field_name)
        lines.append(f"\n=== {bundle.agent_id.upper()} — {bundle.target} ===")
        lines.append(f"Overall confidence: {bundle.conf_overall.value}")
        for c in bundle.claims:
            lines.append(f"  [{c.confidence.value}] {c.text}"
                         + (f"  (src: {c.source_url})" if c.source_url else ""))
        if bundle.gaps:
            lines.append(f"  GAPS: {', '.join(bundle.gaps)}")
    return "\n".join(lines)


# ── 2A Intent Analyst (qwen3-80b) ────────────────────────────────────────────

_INTENT_SYSTEM = """You are an expert at understanding what IIT students want when comparing branches.

Return ONLY valid JSON — no markdown, no preamble.

Schema:
{
  "primary_intent": "CAREER_FOCUSED" | "RESEARCH_FOCUSED" | "HOLISTIC",
  "criteria_priority": ["ordered list of: placement, research, culture, alumni, curriculum"],
  "implicit_constraints": ["list of implicit goals or constraints inferred from query"],
  "weights": {
    "placement": 0.0,
    "research":  0.0,
    "culture":   0.0,
    "alumni":    0.0,
    "curriculum": 0.0
  }
}

Rules:
- weights must sum to exactly 1.0
- CAREER_FOCUSED: placement + alumni >= 0.6 combined
- RESEARCH_FOCUSED: research + curriculum >= 0.6 combined
- HOLISTIC: spread evenly, no single dimension > 0.35
- If no query given, default to HOLISTIC with equal weights 0.2 each
"""


async def intent_analyst(
    user_query: str | None,
    iit1: str, branch1: str,
    iit2: str, branch2: str,
) -> IntentProfile:
    logger.info("[2A Intent Analyst] Classifying intent...")
    query_text = user_query or f"Compare {branch1} at {iit1} vs {branch2} at {iit2} overall."
    user_prompt = f"""User query: "{query_text}"
Comparison: {branch1} at {iit1}  vs  {branch2} at {iit2}

Classify intent and produce scoring weights."""

    raw = await call_intent(_INTENT_SYSTEM, user_prompt)
    try:
        data = json.loads(_clean_json(raw))
        weights: dict[str, float] = data["weights"]
        total = sum(weights.values()) or 1.0
        weights = {k: round(v / total, 3) for k, v in weights.items()}
        profile = IntentProfile(
            primary_intent=IntentType(data["primary_intent"]),
            criteria_priority=data["criteria_priority"],
            implicit_constraints=data.get("implicit_constraints", []),
            weights=weights,
        )
        logger.info(f"[2A] {profile.primary_intent.value}  weights={profile.weights}")
        return profile
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        logger.warning(f"[2A] Parse failed ({e}), using HOLISTIC default.")
        return IntentProfile(
            primary_intent=IntentType.HOLISTIC,
            criteria_priority=["placement", "research", "culture", "alumni", "curriculum"],
            implicit_constraints=[],
            weights={"placement": 0.2, "research": 0.2, "culture": 0.2,
                     "alumni": 0.2, "curriculum": 0.2},
        )


# ── 2B Evidence Synthesizer (nemotron-super-120b) ────────────────────────────

_SYNTH_SYSTEM = """You are an evidence synthesis expert for IIT branch comparisons.

You receive evidence bundles from 4 web-search agents and merge them into a
clean, deduplicated, intent-aligned evidence record for TWO branches.

Return ONLY valid JSON — no markdown, no preamble.

Schema:
{
  "branch1": {
    "branch_label": "branch / IIT name",
    "top_facts": [
      {"text": "...", "source_url": "url or null", "confidence": "HIGH|MED|LOW", "date": "YYYY or null"}
    ],
    "weaknesses": [
      {"text": "...", "source_url": "url or null", "confidence": "HIGH|MED|LOW", "date": "YYYY or null"}
    ],
    "conf_overall": "HIGH|MED|LOW"
  },
  "branch2": { "...same structure..." }
}

Rules:
- top_facts: exactly 5 facts most relevant to user intent/criteria priority
- weaknesses: exactly 3 significant weaknesses or gaps per branch
- Deduplicate — if two agents say the same thing, merge into one claim
- Prioritise facts aligned with the criteria_priority order
- conf_overall = HIGH if most top_facts are HIGH, MED if mixed, LOW if sparse
- Never invent facts. Only use what the bundles contain.
"""


async def evidence_synthesizer(
    stage1: Stage1Result,
    intent_profile: IntentProfile,
    branch1_label: str,
    branch2_label: str,
) -> tuple[BranchEvidence, BranchEvidence]:
    logger.info("[2B Evidence Synthesizer] Merging 8 bundles (nemotron-super-120b)...")

    bundles_text = _bundles_to_text(stage1)
    user_prompt = f"""Intent profile:
- Primary intent: {intent_profile.primary_intent.value}
- Criteria priority: {intent_profile.criteria_priority}
- Weights: {intent_profile.weights}

Branch 1: {branch1_label}
Branch 2: {branch2_label}

Evidence from all 8 agents:
{bundles_text}

Synthesize into a clean evidence record for both branches."""

    raw = await call_synth(_SYNTH_SYSTEM, user_prompt)

    try:
        data = json.loads(_clean_json(raw))

        def parse_branch(d: dict) -> BranchEvidence:
            return BranchEvidence(
                branch_label=d["branch_label"],
                top_facts=[
                    Claim(text=c["text"], source_url=c.get("source_url"),
                          confidence=Confidence(c.get("confidence", "MED")),
                          date=c.get("date"))
                    for c in d.get("top_facts", [])
                ],
                weaknesses=[
                    Claim(text=c["text"], source_url=c.get("source_url"),
                          confidence=Confidence(c.get("confidence", "MED")),
                          date=c.get("date"))
                    for c in d.get("weaknesses", [])
                ],
                conf_overall=Confidence(d.get("conf_overall", "MED")),
            )

        b1 = parse_branch(data["branch1"])
        b2 = parse_branch(data["branch2"])
        logger.info(f"[2B] Done. b1={b1.conf_overall.value} b2={b2.conf_overall.value}")
        return b1, b2

    except (json.JSONDecodeError, KeyError, ValueError) as e:
        logger.warning(f"[2B] Parse failed ({e}). Building fallback evidence.")
        def _fallback(label, h, sc, at, sa) -> BranchEvidence:
            all_claims = h.claims[:2] + sc.claims[:2] + at.claims[:1] + sa.claims[:1]
            return BranchEvidence(
                branch_label=label,
                top_facts=all_claims[:5],
                weaknesses=[Claim(text=g, confidence=Confidence.LOW)
                            for src in [h, sc, at, sa] for g in src.gaps[:1]][:3],
                conf_overall=Confidence.LOW,
            )
        return (
            _fallback(branch1_label, stage1.placement_hunter_1, stage1.academic_scout_1,
                      stage1.alumni_tracker_1, stage1.sentiment_agent_1),
            _fallback(branch2_label, stage1.placement_hunter_2, stage1.academic_scout_2,
                      stage1.alumni_tracker_2, stage1.sentiment_agent_2),
        )


# ── 2C Conflict Arbitrator (nemotron-super-120b) ─────────────────────────────

_ARBITRATE_SYSTEM = """You are a conflict arbitration agent for IIT branch comparison data.

You receive a synthesized evidence record and the raw agent bundles.
Detect where agents disagree and issue rulings.

Return ONLY valid JSON — no markdown, no preamble.

Schema:
{
  "conflicts": [
    {
      "topic": "short topic name e.g. 'average CTC'",
      "agents_disagree": ["agent_id1", "agent_id2"],
      "ruling": "RESOLVED" | "UNRESOLVED",
      "resolution": "brief explanation of which claim wins and why"
    }
  ],
  "conflict_rate": 0.0,
  "unresolved_topics": ["list of UNRESOLVED topic strings"],
  "recommended_requery": ["specific search queries to resolve unresolved conflicts"]
}

Rules:
- A conflict exists when two agents make claims about the SAME topic with DIFFERENT values
- conflict_rate = number_of_conflicts / max(total_claims, 1) — clamp to [0.0, 1.0]
- RESOLVED if one claim is more recent or from a more credible source
- UNRESOLVED if claims are equally credible but contradict each other
- recommended_requery only needed if there are UNRESOLVED conflicts
"""


async def conflict_arbitrator(
    b1: BranchEvidence,
    b2: BranchEvidence,
    stage1: Stage1Result,
) -> tuple[float, list[str], list[str]]:
    logger.info("[2C Conflict Arbitrator] Checking conflicts (nemotron-super-120b)...")

    total_claims = sum(
        len(getattr(stage1, f).claims) for f in stage1.model_fields
    )
    if total_claims == 0:
        return 0.0, [], []

    evidence_summary = f"""Branch 1 — {b1.branch_label}:
Top facts: {[c.text for c in b1.top_facts]}
Weaknesses: {[c.text for c in b1.weaknesses]}

Branch 2 — {b2.branch_label}:
Top facts: {[c.text for c in b2.top_facts]}
Weaknesses: {[c.text for c in b2.weaknesses]}"""

    user_prompt = f"""Synthesized evidence:
{evidence_summary}

Raw agent bundles:
{_bundles_to_text(stage1)}

Total claims: {total_claims}

Detect conflicts, issue rulings, compute conflict_rate."""

    raw = await call_arbitrate(_ARBITRATE_SYSTEM, user_prompt)
    try:
        data = json.loads(_clean_json(raw))
        rate = max(0.0, min(1.0, float(data.get("conflict_rate", 0.0))))
        unresolved = data.get("unresolved_topics", [])
        requery = data.get("recommended_requery", [])
        logger.info(
            f"[2C] conflict_rate={rate:.2f}  unresolved={len(unresolved)}"
            + ("  → FEEDBACK LOOP" if rate > CONFLICT_THRESHOLD else "  → clean")
        )
        return rate, unresolved, requery
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        logger.warning(f"[2C] Parse failed ({e}), assuming no conflicts.")
        return 0.0, [], []


# ── Query Refiner (gpt-oss-20b) ───────────────────────────────────────────────

_REFINE_SYSTEM = """You are a search query refinement agent.

Given a list of unresolved conflicts and gaps, write precise targeted web search
queries that will surface data to resolve them.

Return ONLY valid JSON — no markdown, no preamble.

Schema:
{
  "queries": [
    {
      "query": "exact search string",
      "target_agent": "placement_hunter | academic_scout | alumni_tracker | sentiment_agent",
      "resolves": "brief description of what this targets"
    }
  ]
}

Rules:
- Write 2-4 queries maximum
- Include IIT name, branch, year where relevant
- Prefer official sources: "official report", "placement brochure", "NIRF"
"""


async def query_refiner(
    unresolved_topics: list[str],
    recommended_queries: list[str],
    iit1: str, branch1: str,
    iit2: str, branch2: str,
) -> list[dict]:
    logger.info("[QueryRefiner] Rewriting queries (gpt-oss-20b)...")
    user_prompt = f"""Comparison: {branch1} at {iit1}  vs  {branch2} at {iit2}

Unresolved conflicts:
{chr(10).join(f'- {t}' for t in unresolved_topics)}

Suggested requery directions:
{chr(10).join(f'- {q}' for q in recommended_queries)}

Write precise search queries."""

    raw = await call_refine(_REFINE_SYSTEM, user_prompt)
    try:
        data = json.loads(_clean_json(raw))
        queries = data.get("queries", [])
        logger.info(f"[QueryRefiner] {len(queries)} refined queries generated.")
        return queries
    except (json.JSONDecodeError, KeyError) as e:
        logger.warning(f"[QueryRefiner] Parse failed ({e}).")
        return []


# ── Feedback Loop re-run ──────────────────────────────────────────────────────

async def _run_targeted_requery(
    refined_queries: list[dict],
    stage1: Stage1Result,
    req: CompareRequest,
) -> Stage1Result:
    from agents.stage1 import _ask_gemini

    agent_queries: dict[str, list[str]] = {
        "placement_hunter": [], "academic_scout": [],
        "alumni_tracker": [],  "sentiment_agent": [],
    }
    for rq in refined_queries:
        agent = rq.get("target_agent", "placement_hunter")
        if agent in agent_queries:
            agent_queries[agent].append(rq["query"])

    updated = stage1.model_copy()

    async def rerun(agent_id: str, iit: str, branch: str, queries: list[str]):
        if not queries:
            return None
        target = f"{branch} / {iit}"
        question = " ".join(queries)
        return await _ask_gemini(agent_id, target,
            f"Resolve and clarify: {question} for {branch} at {iit}")

    tasks = {}
    for agent_id, queries in agent_queries.items():
        if queries:
            tasks[f"{agent_id}_1"] = rerun(agent_id, req.iit1, req.branch1, queries)
            tasks[f"{agent_id}_2"] = rerun(agent_id, req.iit2, req.branch2, queries)

    if tasks:
        results_list = await asyncio.gather(*tasks.values())
        result_map = dict(zip(tasks.keys(), results_list))
        for key in stage1.model_fields:
            if key in result_map and result_map[key] is not None:
                old = getattr(updated, key)
                new = result_map[key]
                seen = {c.text for c in old.claims}
                merged = old.claims + [c for c in new.claims if c.text not in seen]
                merged_gaps = list(set(old.gaps) - set(new.gaps or []))
                object.__setattr__(updated, key,
                    old.model_copy(update={"claims": merged, "gaps": merged_gaps}))

    return updated


# ── Stage 2 Entry Point ───────────────────────────────────────────────────────

async def run_stage2(req: CompareRequest, stage1: Stage1Result) -> Stage2Result:
    branch1_label = f"{req.branch1} / {req.iit1}"
    branch2_label = f"{req.branch2} / {req.iit2}"

    intent_profile = await intent_analyst(
        req.user_query, req.iit1, req.branch1, req.iit2, req.branch2
    )

    current_stage1 = stage1
    loop_count = 0
    feedback_triggered = False

    for loop_num in range(MAX_FEEDBACK_LOOPS + 1):
        b1, b2 = await evidence_synthesizer(
            current_stage1, intent_profile, branch1_label, branch2_label
        )
        conflict_rate, unresolved_topics, recommended_queries = await conflict_arbitrator(
            b1, b2, current_stage1
        )

        if conflict_rate <= CONFLICT_THRESHOLD or loop_num >= MAX_FEEDBACK_LOOPS:
            break

        feedback_triggered = True
        loop_count += 1
        logger.info(f"[Stage 2] Feedback loop {loop_count}/{MAX_FEEDBACK_LOOPS}")

        refined_queries = await query_refiner(
            unresolved_topics, recommended_queries,
            req.iit1, req.branch1, req.iit2, req.branch2,
        )
        if not refined_queries:
            break
        current_stage1 = await _run_targeted_requery(refined_queries, current_stage1, req)

    evidence_record = EvidenceRecord(
        branch1=b1, branch2=b2,
        conflict_rate=round(conflict_rate, 3),
        feedback_loop_triggered=feedback_triggered,
        feedback_loop_count=loop_count,
    )
    logger.info(
        f"[Stage 2] Done. conflict_rate={conflict_rate:.2f}  "
        f"loops={loop_count}  intent={intent_profile.primary_intent.value}"
    )
    return Stage2Result(intent_profile=intent_profile, evidence_record=evidence_record)
