# Plan 03-01 Summary: FastAPI Backend

**Phase:** 03-web-app
**Plan:** 01
**Status:** Complete

## What Was Built

`app/main.py` (199 lines) — FastAPI app with all 4 endpoints + CORS + backend toggle + catalog cache at startup via lifespan.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/catalog` | GET | Returns sorted [{course_id, name}, ...] |
| `/api/transcript` | POST (multipart) | PDF → parsed student record |
| `/api/check?backend=oop\|fp` | POST | {eligible, explanation} |
| `/api/recommendations?backend=oop\|fp` | POST | {eligible, near_eligible} |

## Smoke Tests Passed

- Import OK: `from app.main import app`
- Server boots: `uvicorn app.main:app --port 8001`
- `/api/catalog` → JSON array (CS100W, CS116A, ...)
- `/api/check?backend=oop` for CS46B w/ CS46A completed → `{eligible:true, explanation:"Eligible"}`
- `/api/check?backend=fp` for same → identical result (parity confirmed at API level)
- CORS origins configured for :5173 + :3000

## Files Modified

| File | Lines |
|------|-------|
| `requirements.txt` | +3 lines (fastapi, uvicorn, python-multipart) |
| `app/__init__.py` | NEW (1 line) |
| `app/main.py` | NEW (199 lines) |

## Deps Installed

fastapi 0.121.0, uvicorn 0.41.0, python-multipart 0.0.20

## Commits

- `c765891` — `feat(03-01): FastAPI backend with catalog + transcript + check + recommendations endpoints`

## Coverage

API-01 ✓, API-02 ✓, API-03 ✓, API-04 ✓, API-05 ✓ (toggle works), API-06 ✓ (CORS), API-07 ✓ (consistent error shape via HTTPException + detail dict)

## Deviations

- Codex-exec stalled before any work. Executed inline.
- Plan was prescriptive — copied verbatim.
