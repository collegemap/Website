"""
Quick smoke test for Stage 1.
Run from the branchintel/ directory:
    python test_stage1.py

Requires: OPENROUTER_API_KEY in .env
DuckDuckGo needs no API key.
"""
import asyncio
import json
import sys
import os

# Make sure imports resolve from the project root
sys.path.insert(0, os.path.dirname(__file__))

from models.schemas import CompareRequest
from agents.stage1 import run_stage1


async def main():
    req = CompareRequest(
        iit1="IIT Bombay",
        branch1="Computer Science",
        iit2="IIT Madras",
        branch2="Electrical Engineering",
        user_query="Which is better for product management roles?",
    )

    print("=" * 60)
    print("BranchIntel — Stage 1 Smoke Test")
    print("=" * 60)
    print(f"Comparing: {req.branch1}/{req.iit1}  vs  {req.branch2}/{req.iit2}")
    print("Running 8 agents in parallel...\n")

    result = await run_stage1(req)

    bundles = [
        ("Placement Hunter 1", result.placement_hunter_1),
        ("Placement Hunter 2", result.placement_hunter_2),
        ("Academic Scout 1",   result.academic_scout_1),
        ("Academic Scout 2",   result.academic_scout_2),
        ("Alumni Tracker 1",   result.alumni_tracker_1),
        ("Alumni Tracker 2",   result.alumni_tracker_2),
        ("Sentiment Agent 1",  result.sentiment_agent_1),
        ("Sentiment Agent 2",  result.sentiment_agent_2),
    ]

    for name, bundle in bundles:
        print(f"\n{'─'*50}")
        print(f"  {name}  →  {bundle.target}")
        print(f"  Overall confidence: {bundle.conf_overall.value}")
        print(f"  Claims ({len(bundle.claims)}):")
        for c in bundle.claims:
            print(f"    [{c.confidence.value}] {c.text}")
        if bundle.gaps:
            print(f"  Gaps: {bundle.gaps}")

    print("\n" + "=" * 60)
    print("Stage 1 complete. All 8 bundles populated.")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
