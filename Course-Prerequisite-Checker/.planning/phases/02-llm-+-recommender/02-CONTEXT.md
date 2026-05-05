# Phase 2: LLM + Recommender - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

The app can parse a real SJSU transcript PDF and natural-language prereq text into structured data, and can recommend what courses a student should take next.

In scope:
- `src/api/parser.py` — `parse_prerequisites_text(text)` calls OpenRouter, returns JSON validating against `RULE_SCHEMA`
- `src/api/transcript_parser.py` — `parse_transcript_text(text)` and `parse_transcript_pdf(pdf_path)` produce student records
- `src/shared/recommender.py` — `get_eligible_courses` and `get_near_eligible_courses` use the existing OOP/FP `check_eligibility`
- Graceful failure when `OPENROUTER_API_KEY` is missing
- One PDF text-extraction lib added to `requirements.txt` (pypdf or pdfplumber)

Out of scope (deferred to Phase 3):
- Web/HTTP layer
- Frontend
- Concurrency / parallel batch checks
</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — discuss phase was skipped per workflow.skip_discuss=true. Use ROADMAP phase goal, success criteria, codebase conventions (CLAUDE.md), and Phase 1 patterns to guide decisions.

Key prior decisions inherited from Phase 1 / PROJECT.md (locked):
- OpenRouter via `openai` SDK (already in requirements.txt) — pattern in `src/api/parser.py`
- API key from `OPENROUTER_API_KEY` env var via `dotenv`
- JSON rules must validate against `src/shared/schemas.py` `RULE_SCHEMA`
- Student record shape: `{"completed": {course_id: grade}, "in_progress": [course_id, ...]}` matches `data/sample_student.json`
- Recommender consumes either OOP or FP backend via uniform `check_eligibility(course, completed, in_progress) -> (bool, str)` interface
- No new heavy deps; pypdf or pdfplumber acceptable for PDF text extraction
- Letter-grade strings only (Phase 1 lock)

</decisions>

<code_context>
## Existing Code Insights

Codebase context will be gathered during plan-phase research. Phase 1 produced:
- `src/shared/grades.py`, `src/shared/errors.py`, `src/shared/graph.py` — usable
- `src/oop/checker.py` and `src/fp/checker.py` — both expose `check_eligibility(course, completed, in_progress)` returning `(bool, explanation)`
- `src/oop/checker.py` exposes `build_catalog`, `src/fp/checker.py` exposes `parse_catalog`
- `src/shared/schemas.py` exposes `RULE_SCHEMA` for validating LLM output

</code_context>

<specifics>
## Specific Ideas

- LLM model choice: a small/cheap OpenRouter model is fine (e.g. `meta-llama/llama-3.1-8b-instruct` or similar). Quality matters less than reliability + JSON output.
- Use OpenRouter response_format JSON mode if supported by chosen model; otherwise ask for JSON in prompt and parse with json.loads + jsonschema validation.
- Recommender should work for both OOP and FP backends — accept a `check_eligibility` callable as an argument or import both and parameterize.

</specifics>

<deferred>
## Deferred Ideas

- Concurrency / batch eligibility check (CON-01..03) — out of scope (v2)
- Co-requisite full semantics (CORQ-01..02) — out of scope (v2)
- Caching LLM responses across runs — not required for demo
- Multi-school catalog support — out of scope (SJSU CS only)

</deferred>
