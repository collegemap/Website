from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# ─────────────────────────────────────────────
#  Input
# ─────────────────────────────────────────────

class CompareRequest(BaseModel):
    iit1: str = Field(..., example="IIT Bombay")
    branch1: str = Field(..., example="Computer Science")
    iit2: str = Field(..., example="IIT Delhi")
    branch2: str = Field(..., example="Computer Science")
    user_query: Optional[str] = Field(
        None,
        example="Which is better for product management roles?"
    )


# ─────────────────────────────────────────────
#  Stage 1 — Evidence from web search agents
# ─────────────────────────────────────────────

class Confidence(str, Enum):
    HIGH = "HIGH"
    MED  = "MED"
    LOW  = "LOW"


class Claim(BaseModel):
    text: str
    source_url: Optional[str] = None
    confidence: Confidence
    date: Optional[str] = None


class AgentBundle(BaseModel):
    agent_id: str           # e.g. "placement_hunter"
    stage: int = 1
    target: str             # e.g. "CSE / IIT Bombay"
    claims: list[Claim]
    gaps: list[str]         # things the agent couldn't find
    conf_overall: Confidence
    raw_snippets: list[str] = Field(default_factory=list)


class Stage1Result(BaseModel):
    placement_hunter_1: AgentBundle
    placement_hunter_2: AgentBundle
    academic_scout_1:   AgentBundle
    academic_scout_2:   AgentBundle
    alumni_tracker_1:   AgentBundle
    alumni_tracker_2:   AgentBundle
    sentiment_agent_1:  AgentBundle
    sentiment_agent_2:  AgentBundle


# ─────────────────────────────────────────────
#  Stage 2 — Reasoning agents
# ─────────────────────────────────────────────

class IntentType(str, Enum):
    CAREER    = "CAREER_FOCUSED"
    RESEARCH  = "RESEARCH_FOCUSED"
    HOLISTIC  = "HOLISTIC"


class IntentProfile(BaseModel):
    primary_intent: IntentType
    criteria_priority: list[str]   # e.g. ["placement", "culture", "research"]
    implicit_constraints: list[str]
    weights: dict[str, float]      # e.g. {"placement": 0.7, "culture": 0.2, "research": 0.1}


class BranchEvidence(BaseModel):
    branch_label: str              # e.g. "CSE / IIT Bombay"
    top_facts: list[Claim]         # top 5 intent-aligned facts
    weaknesses: list[Claim]        # top 3 weaknesses
    conf_overall: Confidence


class EvidenceRecord(BaseModel):
    branch1: BranchEvidence
    branch2: BranchEvidence
    conflict_rate: float           # 0.0 – 1.0
    feedback_loop_triggered: bool
    feedback_loop_count: int       # max 2


class Stage2Result(BaseModel):
    intent_profile: IntentProfile
    evidence_record: EvidenceRecord


# ─────────────────────────────────────────────
#  Stage 3 — Scoring & output agents
# ─────────────────────────────────────────────

class DimensionScore(BaseModel):
    score: int                     # 0–100
    confidence: Confidence
    reasoning: str                 # chain-of-thought, 1–2 sentences
    supporting_claims: list[str]   # claim texts used


class BranchScorecard(BaseModel):
    branch_label: str
    placement:    DimensionScore
    research:     DimensionScore
    culture:      DimensionScore
    career_fit:   DimensionScore
    overall:      int              # weighted composite 0–100


class Recommendation(BaseModel):
    winner: Optional[str]          # branch_label or None if AMBIGUOUS
    ambiguous: bool
    key_reason: str
    caveat: str
    confidence: Confidence


class Stage3Result(BaseModel):
    scorecard1:     BranchScorecard
    scorecard2:     BranchScorecard
    narrative:      str            # 150-word comparison paragraph
    recommendation: Recommendation


# ─────────────────────────────────────────────
#  Final API response
# ─────────────────────────────────────────────

class CompareResponse(BaseModel):
    request_id: str
    iit1: str
    branch1: str
    iit2: str
    branch2: str
    user_query: Optional[str]

    stage1: Stage1Result
    stage2: Stage2Result
    stage3: Stage3Result

    total_agents_used: int = 10
    feedback_loops_triggered: int
    processing_time_seconds: float


class ErrorResponse(BaseModel):
    error: str
    detail: str
