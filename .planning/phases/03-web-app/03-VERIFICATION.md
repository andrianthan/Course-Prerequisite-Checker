---
status: passed
phase: 03-web-app
verified: 2026-04-25
score: 13/13 requirements
---

# Phase 3 Verification: Web App

## Goal
A student can open the app in a browser, upload a transcript, pick a target course, and see a correct verdict — with the demo toggle showing OOP and FP returning identical results.

## Status: PASSED

All 13 phase requirements satisfied with code evidence + E2E smoke verification.

## Requirement Coverage

| REQ-ID | Status | Evidence |
|--------|--------|----------|
| API-01 | ✓ | `app/main.py::upload_transcript` POST /api/transcript multipart PDF |
| API-02 | ✓ | `app/main.py::check_eligibility` POST /api/check |
| API-03 | ✓ | `app/main.py::get_recommendations` returns eligible list |
| API-04 | ✓ | `app/main.py::get_recommendations` returns near_eligible list w/ missing |
| API-05 | ✓ | `?backend=oop\|fp` query param routes via `_get_backend()` |
| API-06 | ✓ | `CORSMiddleware` configured for :5173 + :3000 |
| API-07 | ✓ | All HTTPException raises use `detail={"error": "..."}` shape |
| UI-01 | ✓ | `UploadCard.jsx` drag-drop PDF + click-to-select |
| UI-02 | ✓ | `CourseList.jsx` editable table + in-progress chips in `App.jsx` |
| UI-03 | ✓ | `CoursePicker.jsx` searchable + `VerdictCard.jsx` shows verdict + explanation |
| UI-04 | ✓ | `RecommendationsPanel.jsx` two tabs w/ counts, click row → set picker |
| UI-05 | ✓ | TopNav OOP/FP pill toggle, useBackend context, useEffect deps re-fire APIs |
| UI-06 | ✓ | Loading spinners, error states, empty states, mobile-responsive grid |

## E2E Smoke Test

```
$ uvicorn app.main:app --port 8000  (background)
$ curl http://localhost:8000/api/catalog
  → 41 SJSU CS courses
$ curl POST /api/recommendations?backend=oop {completed:CS46A,CS46B,MATH42, in_progress:CS146}
  → eligible: 11, near_eligible: 23
$ curl POST /api/recommendations?backend=fp (same body)
  → eligible: 11, near_eligible: 23 (IDENTICAL — parity at API layer)

$ cd frontend && npm run build
  → 38 modules, 474ms, 0 errors, 159 kB JS / 15 kB CSS
```

## Phase 1+2 Regression

Phase 1 (32 tests) + Phase 2 (22 tests) = 54/54 still passing. No regression.

## Deliverables

| Artifact | Status |
|----------|--------|
| `app/__init__.py`, `app/main.py` | NEW — FastAPI backend, 4 endpoints, CORS, lifespan catalog cache |
| `frontend/package.json` etc. | NEW — Vite + React + Tailwind scaffold |
| `frontend/src/App.jsx` | NEW — root layout w/ 3-step flow + TopNav |
| `frontend/src/components/UploadCard.jsx` | NEW |
| `frontend/src/components/CourseList.jsx` | NEW |
| `frontend/src/components/CoursePicker.jsx` | NEW |
| `frontend/src/components/VerdictCard.jsx` | NEW |
| `frontend/src/components/RecommendationsPanel.jsx` | NEW |
| `frontend/src/context/BackendContext.jsx` | NEW |
| `frontend/src/api.js` | NEW |
| `requirements.txt` | UPDATED — fastapi, uvicorn, python-multipart |

## Notes

- 03-01 (FastAPI), 03-04 (Plan 04 components + App wiring), and parts of 03-03 were completed inline by orchestrator after codex-exec stalls. 03-02 (scaffold) and 03-03 (UploadCard + CourseList) committed by codex.
- README run instructions deferred to Phase 4 (DOC-03).
- Localhost-only — no deploy (per PROJECT.md out-of-scope).
- LLM transcript upload requires `OPENROUTER_API_KEY` in `.env` (graceful 503 if missing).
