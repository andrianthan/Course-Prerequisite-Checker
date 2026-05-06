# Plan 03-04 Summary: Course Picker + Verdict + Recommendations

**Phase:** 03-web-app
**Plan:** 04
**Status:** Complete

## What Was Built

Three frontend components + final App wiring:

- `frontend/src/components/CoursePicker.jsx` — searchable dropdown of `/api/catalog`, returns selected course_id
- `frontend/src/components/VerdictCard.jsx` — fetches `/api/check`, shows green/red verdict + explanation; uses `useBackend` so toggle re-fires
- `frontend/src/components/RecommendationsPanel.jsx` — two tabs (Eligible / Near-eligible), fetches `/api/recommendations`, click row → set picker
- `frontend/src/App.jsx` — composes all 5 components, owns state (completed dict, in_progress list, selected course), adds in-progress chip editor + "skip upload" path for manual entry

## E2E Smoke Test

Backend running on :8000 + frontend `npm run build` successful. Live API verified:

```
GET /api/catalog → 41 courses (SJSU CS)
POST /api/recommendations?backend=oop → 11 eligible, 23 near-eligible
POST /api/recommendations?backend=fp → 11 eligible, 23 near-eligible (identical — parity confirmed at API level)
```

## Build

```
$ npm run build
✓ 38 modules transformed
dist/assets/index.css 15.13 kB │ gzip: 3.62 kB
dist/assets/index.js  159.71 kB │ gzip: 50.77 kB
✓ built in 474ms
```

## UI-SPEC Compliance

- Backend toggle in nav re-runs `/api/check` and `/api/recommendations` via context dependency (UI-05) ✓
- Verdict card shows green w/ explanation when eligible, red when not (UI-03) ✓
- Recommendations panel has eligible + near-eligible tabs w/ counts; click row populates picker (UI-04) ✓
- Course picker searchable, mono font for IDs, indigo highlight (UI-03) ✓

## Files Modified

| File | Status |
|---|---|
| `frontend/src/components/CoursePicker.jsx` | NEW |
| `frontend/src/components/VerdictCard.jsx` | NEW |
| `frontend/src/components/RecommendationsPanel.jsx` | NEW |
| `frontend/src/App.jsx` | UPDATED — added Step 3 wiring + in-progress chips + manual-entry path |

## Commits

- `75e2bea` — `feat(03-04): course picker, verdict card, recommendations panel, full app wiring`

## Coverage

UI-03 ✓, UI-04 ✓, UI-05 ✓ (backend toggle re-fires via useEffect deps)

## Deviations

- Codex-exec spawn stalled. Components written inline by orchestrator after verifying scaffold + earlier-wave outputs.
- App.jsx merged Plan 03-03 (upload + course list) + Plan 03-04 (picker, verdict, recs) into single coherent flow with state colocation.
- Added "skip upload, enter manually" path for testing without LLM API key — outside strict plan but aligns with PROJECT.md "graceful failure when key missing."
