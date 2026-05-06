# Course Prerequisite Checker

## What This Is

A web-based Course Prerequisite Checker for SJSU CS courses, built as a CS152 class project by Andrian Than and Lisa Yu. Students upload their unofficial transcript, pick a target course, and the app says whether they're eligible plus what's missing. Backend implements the same prerequisite-evaluation logic in two paradigms (OOP and FP) so we can compare design tradeoffs in the accompanying paper.

## Core Value

The demo must show a student uploading a transcript, picking a course, and seeing a correct eligible/not-eligible verdict with explanation — backed by both OOP and FP implementations producing identical results.

## Requirements

### Validated

<!-- Inferred from existing code (brownfield) -->

- ✓ Project scaffolding (`src/oop/`, `src/fp/`, `src/api/`, `src/shared/`) — existing
- ✓ JSON schemas for catalog and student records (`src/shared/schemas.py`) — existing
- ✓ JSON loader utilities (`src/shared/loader.py`) — existing
- ✓ Shared pytest test suite covering NoPrerequisites, SimpleCourseRule, AndRule, OrRule (`tests/test_checker.py`) — existing
- ✓ Sample data: `data/sample_catalog.json`, `data/sample_student.json`, `data/sjsu_cs_catalog.json` — existing

### Active

<!-- Hypotheses until shipped -->

**Core eligibility logic (both paradigms must pass shared tests):**

- [ ] OOP rule classes (Course, Rule, CourseRule, AndRule, OrRule) with polymorphic evaluation
- [ ] FP rule types (frozen dataclasses) with pure-function evaluation
- [ ] OOP `check_eligibility(course, completed, in_progress)` returns `(bool, explanation)`
- [ ] FP `check_eligibility(course, completed, in_progress)` returns `(bool, explanation)`
- [ ] Min-grade constraint support (proposal stretch — needed because SJSU catalog uses it)
- [ ] Equivalencies via OR rules (already covered by OrRule)
- [ ] Cycle detection on catalog load (invalid catalogs flagged)
- [ ] Human-readable explanation output ("Eligible because X" / "Missing Y or Z")

**LLM integration:**

- [ ] `parse_prerequisites_text` — natural-language prereq text → structured rule JSON via OpenRouter
- [ ] `parse_transcript_text` — raw transcript text → structured student record
- [ ] `parse_transcript_pdf` — extract text from uploaded PDF, then parse to student record

**Recommender:**

- [ ] `get_eligible_courses(catalog, completed, in_progress)` — list courses student can take next
- [ ] `get_near_eligible_courses(...)` — courses one prereq away, with what's missing

**Web UI (FastAPI + React, localhost only):**

- [ ] FastAPI backend with endpoints for: upload transcript (PDF), check eligibility, list eligible courses, list near-eligible
- [ ] Backend toggle: switch eligibility engine between OOP and FP at request time (for demo)
- [ ] React frontend: upload transcript, pick target course, show verdict + explanation
- [ ] React frontend: recommended-courses view (eligible + near-eligible)
- [ ] Polished visual design (this is a graded demo, not a CLI)

**Deliverables (non-code):**

- [ ] Final paper / report comparing OOP vs FP on readability, modularity, ease of extension, maintainability
- [ ] Slide deck for class presentation
- [ ] Working demo runnable on Andrian's laptop during class

### Out of Scope

- **Concurrency / parallel batch eligibility check** — Proposal listed as optional; cut to focus on demo + paper. GIL would mute speedup anyway.
- **Public deployment (Render/Vercel/etc.)** — Localhost demo only. Saves a phase, no infra risk on demo day.
- **Authentication / multi-user** — Single-user local demo, no login flow.
- **Persistent database** — Catalog + student records load from JSON. No DB layer.
- **Course catalogs beyond SJSU CS** — Sample SJSU CS catalog is enough to demo. Other depts/schools out.
- **Co-requisites (allowed "in progress")** — Proposal stretch; partial in-progress signal is already part of `check_eligibility(...)` signature, but full co-req semantics deferred unless trivial.
- **Quantitative perf benchmarks in paper** — Tied to concurrency stretch; cut.

## Context

- **Class:** CS152 (Programming Paradigms), San José State University.
- **Team:** Andrian Than, Lisa Yu (split decided privately by team — phase plans don't need to assign owners).
- **Deadline:** First or second week of May 2026 (~2-3 weeks from project init on 2026-04-24). Andrian to confirm exact date from syllabus.
- **Brownfield state:** Repo has scaffolding, schemas, loader, and a shared pytest suite. Most `src/` modules are stubs (`pass`). LLM parsers and recommender are TODO. No web UI yet.
- **Existing assets in parent dir:** `CS152___Project_Proposal (1).pdf` is the source-of-truth proposal for graded scope. Older 2023 finance-tracker artifacts in parent dir are unrelated.
- **Why two paradigms:** Class requires comparison; both implementations must produce identical results on the shared test suite. Paper's qualitative comparison hinges on this.
- **Why a web app demo:** Proposal allows freedom on UI; user picked polished web demo over CLI. Localhost is fine for in-class demo.
- **LLM provider:** OpenRouter (already wired in `src/api/parser.py` and `transcript_parser.py`). Requires `OPENROUTER_API_KEY` in `.env`.

## Constraints

- **Timeline:** ~2-3 weeks to demo + paper + slides. Phase granularity must stay coarse.
- **Tech stack (backend):** Python 3, OpenAI SDK pointed at OpenRouter, pytest. Existing code commits to this.
- **Tech stack (web):** FastAPI + React (user choice). Prefer minimal React tooling (Vite) to keep setup time low.
- **Tech stack (PDF parse):** `pypdf` or `pdfplumber` for text extraction before LLM cleanup. Avoid OCR — assume student transcript is text-extractable.
- **Behavior parity:** OOP and FP backends MUST return identical `(eligible, explanation)` for every shared test case. Non-negotiable for paper validity.
- **API key safety:** `.env` is gitignored; never commit keys. `.env.example` already in repo.
- **Demo runs locally:** No deploy. Andrian's laptop must boot the app via two commands (backend + frontend) on demo day.
- **Class grade:** Production polish not required, but visual polish on UI matters because it's a graded demo.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web app over CLI | User wants polished demo; class scoring favors visible product | — Pending |
| FastAPI + React stack | User chose; React gives polish, FastAPI matches Python core | — Pending |
| Drop concurrency stretch | Demo focus; GIL mutes Python speedup; saves time for UI/paper | — Pending |
| Localhost-only demo | No deploy infra to fail on demo day; saves a phase | — Pending |
| Keep both OOP and FP impls behind a runtime toggle | Lets demo show paradigm-equivalence live; supports paper claim | — Pending |
| Use OpenRouter for both prereq and transcript parsing | Already wired in code; one API key, multiple model choices | — Pending |
| Treat min-grade as required (not stretch) | SJSU catalog uses it; demo without it would feel fake | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-24 after initialization*
