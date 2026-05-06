---
status: passed
phase: 02-llm-+-recommender
verified: 2026-04-25
score: 6/6 requirements
---

# Phase 2 Verification: LLM + Recommender

## Goal
The app can parse a real SJSU transcript PDF and natural-language prereq text into structured data, and can recommend what courses a student should take next.

## Status: PASSED

All 6 phase requirements satisfied with code evidence + test coverage.

## Requirement Coverage

| REQ-ID | Status | Evidence |
|--------|--------|----------|
| LLM-01 | ✓ | `src/api/parser.py::parse_prerequisites_text` — calls OpenRouter, jsonschema validates RULE_SCHEMA. Tests: TestParsePrerequisitesText. |
| LLM-02 | ✓ | `src/api/transcript_parser.py::parse_transcript_text` — LLM call w/ STUDENT_RECORD_SCHEMA. Tests: TestParseTranscriptText. |
| LLM-03 | ✓ | `src/api/transcript_parser.py::parse_transcript_pdf` — pypdf.PdfReader → text → parse_transcript_text. Tests: TestParseTranscriptPdf. |
| LLM-04 | ✓ | `src/api/_client.py::get_client` — raises EnvironmentError with clear message when OPENROUTER_API_KEY unset. Tests: TestMissingApiKey. |
| REC-01 | ✓ | `src/shared/recommender.py::get_eligible_courses` — excludes already-done + in-progress. Tests: TestGetEligibleCourses. Live verified on sjsu_cs_catalog.json: 11 eligible. |
| REC-02 | ✓ | `src/shared/recommender.py::get_near_eligible_courses` — parses "Not eligible: X", names missing prereq. Tests: TestGetNearEligibleCourses. Live: 23 near-eligible. |

## Test Results

```
$ pytest tests/
54 passed in 0.31s
```

- Phase 1 tests: 32/32 (no regression)
- Phase 2 tests: 22/22 (new in tests/test_phase2.py)
- Total: 54/54

## Deliverables

| File | Status |
|------|--------|
| `src/api/_client.py` | NEW — shared OpenRouter client w/ API key guard |
| `src/api/parser.py` | IMPL — replaces stub; calls LLM + validates RULE_SCHEMA |
| `src/api/transcript_parser.py` | IMPL — replaces stub; PDF + text parsing |
| `src/shared/recommender.py` | IMPL — replaces stub; eligible + near-eligible |
| `tests/test_phase2.py` | NEW — 22 tests, mocked LLM, real recommender |
| `requirements.txt` | UPDATED — pypdf>=6.0.0, jsonschema>=4.0.0 |

## Notes

- Codex-exec used for execution (matches user's CLAUDE.md routing rule). 02-04 + 02-01 timed out and were completed inline.
- LLM tests mock `get_client` per-module (stable across openai SDK versions).
- Recommender tests use real OOP backend on sjsu_cs_catalog — no LLM dependency.
