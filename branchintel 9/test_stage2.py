"""
Smoke test for Stage 2.
Uses a small mock Stage1Result so you don't burn search quota every run.

Run from branchintel/ directory:
    python test_stage2.py

Requires: OPENROUTER_API_KEY in .env
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from models.schemas import (
    CompareRequest, Stage1Result, AgentBundle, Claim, Confidence
)
from agents.stage2 import run_stage2


def _mock_bundle(agent_id: str, target: str, claims_data: list[tuple]) -> AgentBundle:
    return AgentBundle(
        agent_id=agent_id,
        stage=1,
        target=target,
        claims=[
            Claim(text=text, confidence=Confidence(conf), source_url=url, date=date)
            for text, conf, url, date in claims_data
        ],
        gaps=[],
        conf_overall=Confidence.HIGH,
        raw_snippets=[],
    )


def build_mock_stage1() -> Stage1Result:
    return Stage1Result(
        placement_hunter_1=_mock_bundle("placement_hunter", "Computer Science / IIT Bombay", [
            ("Average CTC for CSE at IIT Bombay was ₹28.4L in 2024.", "HIGH", "https://iitb.ac.in/placements", "2024"),
            ("12% of CSE graduates at IITB received FAANG offers in 2024.", "HIGH", "https://iitb.ac.in/placements", "2024"),
            ("Top recruiters include Google, Microsoft, Goldman Sachs, and Uber.", "HIGH", "https://iitb.ac.in/placements", "2024"),
            ("PPO rate for CSE at IITB was approximately 35% in 2023.", "MED", None, "2023"),
        ]),
        placement_hunter_2=_mock_bundle("placement_hunter", "Electrical Engineering / IIT Madras", [
            ("Average CTC for EE at IIT Madras was ₹22L in 2024.", "HIGH", "https://iitm.ac.in/placements", "2024"),
            ("Core electronics companies like Qualcomm and Texas Instruments recruit heavily.", "HIGH", "https://iitm.ac.in/placements", "2024"),
            ("Approximately 8% of EE graduates received FAANG offers in 2023.", "MED", None, "2023"),
        ]),
        academic_scout_1=_mock_bundle("academic_scout", "Computer Science / IIT Bombay", [
            ("IITB CSE offers specializations in AI/ML, systems, and theoretical CS.", "HIGH", None, None),
            ("The department has 45+ faculty with strong publication records in top venues.", "MED", None, None),
            ("IITB ranks #3 in NIRF engineering category.", "HIGH", "https://nirfindia.org", "2024"),
        ]),
        academic_scout_2=_mock_bundle("academic_scout", "Electrical Engineering / IIT Madras", [
            ("IITM EE is known for VLSI, embedded systems, and signal processing research.", "HIGH", None, None),
            ("IITM ranks #1 in NIRF engineering category for 6 consecutive years.", "HIGH", "https://nirfindia.org", "2024"),
            ("Strong research output in semiconductor design with international collaborations.", "HIGH", None, "2023"),
        ]),
        alumni_tracker_1=_mock_bundle("alumni_tracker", "Computer Science / IIT Bombay", [
            ("Most IITB CSE alumni end up in SDE roles (55%) or PM roles (15%) within 3 years.", "MED", None, None),
            ("Startup founding rate among IITB CSE alumni is estimated at 10-12%.", "MED", None, None),
        ]),
        alumni_tracker_2=_mock_bundle("alumni_tracker", "Electrical Engineering / IIT Madras", [
            ("IITM EE alumni predominantly go into core electronics or pursue MS/PhD (40%).", "MED", None, None),
            ("PM placement rate from IITM EE is approximately 4%, much lower than CSE peers.", "MED", None, None),
        ]),
        sentiment_agent_1=_mock_bundle("sentiment_agent", "Computer Science / IIT Bombay", [
            ("Students describe IITB CSE culture as highly competitive but with strong peer learning.", "MED", "https://reddit.com", None),
            ("Workload is intense, with multiple project-heavy courses each semester.", "MED", None, None),
        ]),
        sentiment_agent_2=_mock_bundle("sentiment_agent", "Electrical Engineering / IIT Madras", [
            ("IITM EE students praise the research culture and faculty accessibility.", "MED", "https://quora.com", None),
            ("Students note the curriculum is rigorous but can feel disconnected from software industry.", "MED", None, None),
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

    print("=" * 60)
    print("BranchIntel — Stage 2 Smoke Test (mock Stage 1 data)")
    print("=" * 60)

    stage1 = build_mock_stage1()
    result = await run_stage2(req, stage1)

    ip = result.intent_profile
    print(f"\n[2A] Intent: {ip.primary_intent.value}")
    print(f"     Priority: {ip.criteria_priority}")
    print(f"     Weights:  {ip.weights}")
    print(f"     Constraints: {ip.implicit_constraints}")

    er = result.evidence_record
    print(f"\n[2B+2C] conflict_rate={er.conflict_rate}  loops={er.feedback_loop_count}")

    for label, branch in [("Branch 1", er.branch1), ("Branch 2", er.branch2)]:
        print(f"\n  {label}: {branch.branch_label}  [{branch.conf_overall.value}]")
        print("  Top facts:")
        for f in branch.top_facts:
            print(f"    [{f.confidence.value}] {f.text}")
        print("  Weaknesses:")
        for w in branch.weaknesses:
            print(f"    [{w.confidence.value}] {w.text}")

    print("\n" + "=" * 60)
    print("Stage 2 complete.")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
