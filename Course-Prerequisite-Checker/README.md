# Course Prerequisite Checker

CS152 class project — Andrian Than, Lisa Yu, San José State University.

A web-based eligibility checker for SJSU CS courses. Students upload their unofficial transcript, pick a target course, and see whether they're eligible plus what's missing. The same prerequisite-evaluation logic is implemented in **two paradigms (OOP and FP)** so both backends produce identical results — toggleable in the UI to demonstrate parity.

## Features

- Upload SJSU transcript PDF → LLM-parsed student record (or enter courses manually)
- Pick a course → instant eligibility verdict with natural-language explanation
- Recommendations panel: eligible courses + near-eligible (one prereq away)
- OOP/FP backend toggle — same student record, same verdict from both engines
- Min-grade prerequisite enforcement, AND/OR rule composition, cycle detection at parse time

## Project Structure

```
src/
├── oop/              # Object-Oriented implementation (Course, Rule hierarchy w/ polymorphic evaluate)
├── fp/               # Functional Programming implementation (frozen dataclasses + pure functions)
├── api/              # LLM-powered parsers (transcript PDF → student record, prereq text → rules)
├── shared/           # grades.py, errors.py, graph.py (cycle detection), recommender.py, loader.py, schemas.py
app/
└── main.py           # FastAPI backend — 4 endpoints with OOP/FP toggle, CORS, lifespan catalog cache
frontend/
└── src/              # Vite + React 18 + Tailwind v3 — single-page demo UI
tests/
├── test_checker.py   # Shared OOP+FP test suite (32 tests, behavioral parity)
└── test_phase2.py    # LLM parser + recommender tests (22 tests, mocked LLM)
data/                 # Sample catalogs + SJSU CS catalog (41 courses)
.planning/            # GSD workflow artifacts (phases, requirements, roadmap)
```

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # add OPENROUTER_API_KEY for transcript PDF parsing
```

```bash
cd frontend
npm install
```

## Run the demo

Two terminals:

**Terminal 1 — backend (FastAPI on :8000)**
```bash
source venv/bin/activate
uvicorn app.main:app --reload
```

**Terminal 2 — frontend (Vite dev server on :5173)**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Run tests

```bash
source venv/bin/activate
python -m pytest tests/ -v
# expect 54 passed
```

## OOP/FP backend toggle

The top-right pill toggles which engine handles eligibility checks. Both backends share:
- The same `data/sjsu_cs_catalog.json` catalog
- The same `RULE_SCHEMA` shape
- The same `(eligible: bool, explanation: str)` return contract
- The same shared utilities (`src/shared/grades.py`, `errors.py`, `graph.py`)

The verdict and recommendation lists are identical for any given student record on both backends — paper section §V documents this parity claim quantitatively.

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/catalog` | Returns all 41 SJSU CS courses |
| POST | `/api/transcript` | Upload PDF → parsed student record JSON |
| POST | `/api/check?backend=oop\|fp` | `{course_id, completed, in_progress}` → `{eligible, explanation}` |
| POST | `/api/recommendations?backend=oop\|fp` | `{completed, in_progress}` → `{eligible: [...], near_eligible: [...]}` |

All errors return JSON: `{"error": "<message>"}` with appropriate HTTP status.

## Documentation

- **Paper:** `docs/PAPER.md` — OOP vs FP comparison on readability, modularity, ease of extension, maintainability
- **Slides:** `docs/SLIDES.md` — class presentation deck (markdown, render via Marp or pandoc)
- **Planning:** `.planning/` — GSD workflow artifacts (4 phases, 35 requirements, full traceability)

## Tech stack

- **Backend:** Python 3.14 · FastAPI · pypdf · jsonschema · openai (OpenRouter) · python-dotenv · pytest
- **Frontend:** React 18 · Vite 5 · Tailwind CSS v3
- **LLM:** OpenRouter (default model: `google/gemma-3-12b-it:free`)

## Team

- Andrian Than ([andrian.than@sjsu.edu](mailto:andrian.than@sjsu.edu))
- Lisa Yu ([elizabeth.yu@sjsu.edu](mailto:elizabeth.yu@sjsu.edu))
