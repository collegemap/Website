# BranchIntel — Backend

Fully agentic IIT branch comparison.
10 agents · 3 stages · 6 OpenRouter models · DuckDuckGo search · zero manual data.

---

## Model Assignment

| Agent | Model | Why |
|---|---|---|
| Stage 1 — all 4 search parsers | `nvidia/nemotron-3-nano-30b` | Fast, cheap, great at JSON extraction |
| Stage 2A — Intent Analyst | `qwen/qwen3-next-80b` | Best instruction-following for classification |
| Stage 2B — Evidence Synthesizer | `nvidia/nemotron-super-120b` | Largest model, deep reasoning over many claims |
| Stage 2C — Conflict Arbitrator | `nvidia/nemotron-super-120b` | Same — conflict detection needs heavy reasoning |
| Feedback Loop — Query Refiner | `openai/gpt-oss-20b` | Clean, precise query rewriting |
| Stage 3A — Scorer | `openai/gpt-oss-20b` | Reliable structured scoring output |
| Stage 3B — Narrator | `google/gemma-3-27b` | Best prose quality among the free models |
| Stage 3C — Recommender | `qwen/qwen3-next-80b` | Crisp decision output |

All models accessed via one OpenRouter API key. Automatic retry + fallback to
nemotron-super-120b if any model fails.

---

## Setup

```bash
cd branchintel
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set your OpenRouter API key
```

`.env` contents:
```
OPENROUTER_API_KEY=sk-or-v1-...your key here...
```

---

## How to Run

### Start the API server

```bash
uvicorn main:app --reload --port 8000
```

Open http://localhost:8000/docs for interactive Swagger UI.

### curl example

```bash
curl -X POST http://localhost:8000/compare \
  -H "Content-Type: application/json" \
  -d '{
    "iit1": "IIT Bombay",
    "branch1": "Computer Science",
    "iit2": "IIT Madras",
    "branch2": "Electrical Engineering",
    "user_query": "Which is better for product management roles?"
  }'
```

Response time: 30-90 seconds. Show a loading state in the frontend.

---

### Test individual stages

```bash
# Stage 1 only — real DuckDuckGo searches + nemotron-nano parsing
python test_stage1.py

# Stage 2 only — mock data, fast, tests qwen + nemotron-super
python test_stage2.py

# Full pipeline — mock Stage 1, real Stage 2 + Stage 3
python test_e2e.py
```

---

## Project Structure

```
branchintel/
├── main.py                   FastAPI app
├── requirements.txt
├── .env.example
├── models/
│   └── schemas.py            All Pydantic models
├── agents/
│   ├── stage1.py             4 parallel search agents  (nemotron-nano-30b)
│   ├── stage2.py             Intent + Synth + Arbitrate (qwen + nemotron-super)
│   └── stage3.py             Scorer + Narrator + Rec   (gpt-oss + gemma + qwen)
├── utils/
│   ├── search.py             DuckDuckGo async wrapper
│   └── openrouter_client.py  OpenRouter client — all 6 models, retry logic
├── test_stage1.py
├── test_stage2.py
└── test_e2e.py
```

---

## API Reference

### POST /compare

Request:
```json
{
  "iit1": "IIT Bombay",
  "branch1": "Computer Science",
  "iit2": "IIT Delhi",
  "branch2": "Computer Science",
  "user_query": "Which is better for product management?"
}
```

Key response fields (stage3 is what frontend needs):
```json
{
  "stage3": {
    "scorecard1": {
      "branch_label": "Computer Science / IIT Bombay",
      "placement":  {"score": 75, "confidence": "HIGH", "reasoning": "..."},
      "research":   {"score": 58, "confidence": "MED",  "reasoning": "..."},
      "culture":    {"score": 72, "confidence": "MED",  "reasoning": "..."},
      "career_fit": {"score": 81, "confidence": "HIGH", "reasoning": "..."},
      "overall": 76
    },
    "scorecard2": {},
    "narrative": "150-word paragraph...",
    "recommendation": {
      "winner": "Computer Science / IIT Bombay",
      "ambiguous": false,
      "key_reason": "3x PM placement rate 2022-2024",
      "caveat": "IIT Madras EE is superior for R&D and VLSI",
      "confidence": "HIGH"
    }
  },
  "stage2": {
    "intent_profile": {
      "primary_intent": "CAREER_FOCUSED",
      "weights": {"placement": 0.7, "research": 0.1, "culture": 0.2, "alumni": 0.0, "curriculum": 0.0}
    },
    "evidence_record": {
      "conflict_rate": 0.08,
      "feedback_loop_triggered": false,
      "feedback_loop_count": 0
    }
  },
  "total_agents_used": 10,
  "feedback_loops_triggered": 0,
  "processing_time_seconds": 52.4
}
```

### GET /colleges — list of supported IITs
### GET /branches — list of supported branches
### GET /health — health check

---

## Notes for Frontend Team

| What | Details |
|---|---|
| Response time | 30-90 seconds — show a loading state |
| Primary display | stage3 — scorecards, narrative, recommendation |
| recommendation.ambiguous = true | Neither branch clearly won — handle this state |
| feedback_loops_triggered > 0 | Show "Self-corrected" badge |
| Confidence values | "HIGH" / "MED" / "LOW" — use for colour coding |
| Scores | Integer 0-100 — safe for bar/radar charts |
| CORS | Currently allow_origins=["*"] — lock down before production |
