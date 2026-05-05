# Plan 02-01 Summary: Foundation (deps + LLM client)

**Phase:** 02-llm-+-recommender
**Plan:** 01
**Status:** Complete

## What Was Built

Foundation modules so subsequent Wave 2 plans (02-02 prereq parser, 02-03 transcript parser) have working imports.

## Files Modified

| File | Change |
|------|--------|
| `requirements.txt` | +2 lines (pypdf>=6.0.0, jsonschema>=4.0.0) |
| `src/api/_client.py` | NEW (30 lines) — `get_client()` + `MODEL` constant |

## Behavior Verified

- `get_client()` raises `EnvironmentError` with "OPENROUTER_API_KEY" in message when env var unset (verified inline)
- `get_client()` returns OpenAI client when key present
- `MODEL = "google/gemma-3-12b-it:free"` exported

## Deps Installed

- pypdf 6.10.2
- jsonschema 4.26.0
- (also pulled in: openai 2.32.0, python-dotenv 1.2.2, etc. into newly-created `venv/`)

## venv Note

Project requires venv due to PEP 668 (system Python externally managed). Created at `venv/` and used for verification. Future devs run: `python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`.

## Phase 1 Regression Check

`pytest tests/test_checker.py` → 32 passed, 0 failed. No regression.

## Commits

- `e323bab` — `feat(02-01): add pypdf and jsonschema to requirements`
- `90d019c` — `feat(02-01): create shared OpenRouter client factory with API key guard`

## Deviations

- Plan was executed inline by orchestrator (codex-exec stream timed out before any work). 2 simple file ops; inline was faster than retry.
- Created `venv/` for dependency install (system Python is PEP 668 externally managed).
