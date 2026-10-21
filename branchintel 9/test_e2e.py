"""
Full end-to-end pipeline test using mock Stage 1 data.
Tests Stage 2 + Stage 3 together without burning DuckDuckGo quota.

Run from branchintel/ directory:
    python test_e2e.py

Requires: OPENROUTER_API_KEY in .env
"""
import asyncio
import json
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from models.schemas import (
    CompareRequest, Stage1Result, AgentBundle, Claim, Confidence
)
from agents.stage2 import run_stage2
from agents.stage3 import run_stage3


def _mock_bundle(agent_id, target, claims_data):
    return AgentBundle(
        agent_id=agent_id, stage=1, target=target,
        claims=[Claim(text=t, confidence=Confidence(c), source_url=u, date=d)
                for t, c, u, d in claims_data],
        gaps=[], conf_overall=Confidence.HIGH, raw_snippets=[],
    )


def build_mock_stage1() -> Stage1Result:
    return Stage1Result(
        placement_hunter_1=_mock_bundle("placement_hunter", "Computer Science / IIT Bombay", [
            ("Average CTC for CSE at IIT Bombay was ₹28.4L in 2024.", "HIGH", "https://iitb.ac.in/placements", "2024"),
            ("12% of CSE graduates received FAANG offers in 2024.", "HIGH", "https://iitb.ac.in/placements", "2024"),
            ("Top recruiters: Google, Microsoft, Goldman Sachs, Uber.", "HIGH", "https://iitb.ac.in/placements", "2024"),
            ("PPO rate was approximately 35% in 2023.", "MED", None, "2023"),
            ("3× more PM placements compared to IIT Madras EE in 2022–2024.", "HIGH", "https://iitb.ac.in/placements", "2024"),
        ]),
        placement_hunter_2=_mock_bundle("placement_hunter", "Electrical Engineering / IIT Madras", [
            ("Average CTC for EE at IIT Madras was ₹22L in 2024.", "HIGH", "https://iitm.ac.in/placements", "2024"),
            ("Core electronics companies like Qualcomm and TI recruit heavily.", "HIGH", "https://iitm.ac.in/placements", "2024"),
            ("Approximately 8% of EE graduates received FAANG offers in 2023.", "MED", None, "2023"),
            ("PM placement rate from IITM EE is approximately 4%.", "MED", None, "2023"),
        ]),
        academic_scout_1=_mock_bundle("academic_scout", "Computer Science / IIT Bombay", [
            ("IITB CSE offers specializations in AI/ML, systems, and theoretical CS.", "HIGH", None, None),
            ("45+ faculty with strong publication records in top venues (NeurIPS, ICML, SOSP).", "MED", None, None),
            ("IITB ranks #3 in NIRF engineering category 2024.", "HIGH", "https://nirfindia.org", "2024"),
        ]),
        academic_scout_2=_mock_bundle("academic_scout", "Electrical Engineering / IIT Madras", [
            ("IITM EE is top-ranked for VLSI, embedded systems, and signal processing research.", "HIGH", None, None),
            ("IITM ranks #1 in NIRF engineering for 6 consecutive years.", "HIGH", "https://nirfindia.org", "2024"),
            ("Strong international collaboration in semiconductor design.", "HIGH", None, "2023"),
        ]),
        alumni_tracker_1=_mock_bundle("alumni_tracker", "Computer Science / IIT Bombay", [
            ("55% of IITB CSE alumni are in SDE roles, 15% in PM roles within 3 years.", "MED", None, None),
            ("Startup founding rate among IITB CSE alumni is 10–12%.", "MED", None, None),
        ]),
        alumni_tracker_2=_mock_bundle("alumni_tracker", "Electrical Engineering / IIT Madras", [
            ("IITM EE alumni predominantly go into core electronics or pursue MS/PhD (40%).", "MED", None, None),
            ("PM placement rate from IITM EE is approximately 4%, far below CSE peers.", "MED", None, None),
        ]),
        sentiment_agent_1=_mock_bundle("sentiment_agent", "Computer Science / IIT Bombay", [
            ("Students describe IITB CSE as highly competitive with strong peer learning.", "MED", "https://reddit.com", None),
            ("Workload is intense with multiple project-heavy courses each semester.", "MED", None, None),
            ("Strong alumni network actively helps in placements and referrals.", "MED", None, None),
        ]),
        sentiment_agent_2=_mock_bundle("sentiment_agent", "Electrical Engineering / IIT Madras", [
            ("IITM EE students praise research culture and faculty accessibility.", "MED", "https://quora.com", None),
            ("Curriculum is rigorous but can feel disconnected from software industry roles.", "MED", None, None),
        ]),
    )


async def main():
    req = CompareRequest(
        iit1="IIT Bombay",
        branch1="Computer Science",
        iit2="IIT Madras",
        branch2="Electrical Engineering",
        user_query="Which is better for product management roles?",
    )

    print("=" * 65)
    print("BranchIntel — Full End-to-End Test (mock Stage 1)")
    print("=" * 65)
    print(f"Query  : {req.user_query}")
    print(f"Branch1: {req.branch1} / {req.iit1}")
    print(f"Branch2: {req.branch2} / {req.iit2}")
    print()

    stage1 = build_mock_stage1()

    print("Running Stage 2 (reasoning chain)...")
    stage2 = await run_stage2(req, stage1)

    ip = stage2.intent_profile
    er = stage2.evidence_record
    print(f"\n[Stage 2] Intent     : {ip.primary_intent.value}")
    print(f"[Stage 2] Priority   : {ip.criteria_priority}")
    print(f"[Stage 2] Weights    : {ip.weights}")
    print(f"[Stage 2] Conflict   : {er.conflict_rate}  |  Loops: {er.feedback_loop_count}")

    print("\nRunning Stage 3 (scoring + output)...")
    stage3 = await run_stage3(req, stage2)

    sc1, sc2 = stage3.scorecard1, stage3.scorecard2
    print(f"\n{'─'*65}")
    print(f"  SCORECARDS")
    print(f"{'─'*65}")
    dims = ["placement", "research", "culture", "career_fit"]
    header = f"  {'Dimension':<14}  {sc1.branch_label[:22]:<22}  {sc2.branch_label[:22]:<22}"
    print(header)
    for dim in dims:
        d1 = getattr(sc1, dim)
        d2 = getattr(sc2, dim)
        print(f"  {dim:<14}  {d1.score:>3} [{d1.confidence.value:<4}]           {d2.score:>3} [{d2.confidence.value:<4}]")
    print(f"  {'OVERALL':<14}  {sc1.overall:>3}                       {sc2.overall:>3}")

    print(f"\n{'─'*65}")
    print("  NARRATIVE")
    print(f"{'─'*65}")
    print(stage3.narrative)

    rec = stage3.recommendation
    print(f"\n{'─'*65}")
    print("  RECOMMENDATION")
    print(f"{'─'*65}")
    print(f"  Winner     : {rec.winner or 'AMBIGUOUS'}")
    print(f"  Ambiguous  : {rec.ambiguous}")
    print(f"  Key reason : {rec.key_reason}")
    print(f"  Caveat     : {rec.caveat}")
    print(f"  Confidence : {rec.confidence.value}")
    print(f"\n{'='*65}")
    print("End-to-end test complete.")
    print(f"{'='*65}")


if __name__ == "__main__":
    asyncio.run(main())
