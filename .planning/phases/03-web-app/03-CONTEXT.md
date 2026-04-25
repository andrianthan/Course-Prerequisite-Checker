# Phase 3: Web App - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

A student can open the app in a browser, upload a transcript, pick a target course, and see a correct verdict — with the demo toggle showing OOP and FP returning identical results.

In scope:
- FastAPI backend exposing endpoints for: transcript upload (PDF), eligibility check, eligible courses list, near-eligible list
- Backend toggle: `?backend=oop|fp` query param (or header) routes eligibility to chosen engine
- React frontend (Vite) with: upload screen, parsed-record confirmation, course picker w/ verdict + explanation, recommended-courses view, OOP/FP toggle UI
- CORS configured for local dev (Vite dev server → FastAPI)
- Polished visual design (graded demo)
- Localhost-only — no deploy

Out of scope:
- Authentication / multi-user (PROJECT.md out-of-scope)
- Persistent DB
- Public deploy
- Mobile app
</domain>

<decisions>
## Implementation Decisions

### Stack (locked from PROJECT.md)
- Backend: FastAPI + uvicorn
- Frontend: React via Vite (minimal tooling, fast dev)
- HTTP between them: JSON, fetch (no axios needed)
- CORS: `fastapi.middleware.cors.CORSMiddleware`, allow `http://localhost:5173` (Vite default) + `http://localhost:3000`
- Backend lives in `app/` (new dir) so `src/` stays library-only
- Frontend lives in `frontend/` (new dir, Vite scaffold)

### API Surface
- `POST /api/transcript` — multipart/form-data, single PDF field. Returns parsed student record JSON.
- `POST /api/check?backend=oop|fp` — body: `{course_id, completed, in_progress}`. Returns `{eligible, explanation}`.
- `POST /api/recommendations?backend=oop|fp` — body: `{completed, in_progress}`. Returns `{eligible: [...], near_eligible: [...]}`.
- `GET /api/catalog` — returns the SJSU CS catalog (course_id list + names) for the dropdown.
- Errors: consistent JSON shape `{"error": "<message>"}` with appropriate HTTP status.

### Frontend Flow
1. Landing — upload PDF (drag-drop or button)
2. After parse — show extracted courses+grades, allow user to confirm/edit
3. Course picker — searchable dropdown, on select show verdict
4. Recommendations panel — eligible + near-eligible (expandable)
5. Persistent OOP/FP toggle in nav — re-runs current view's API calls on flip

### Visual Polish
- Tailwind CSS for fast styling (small bundle, utility-first)
- One color (~indigo-600), neutral grays, generous whitespace
- Loading spinners during API calls
- Inline error states (red borders, error text below input)
- Mobile responsive baseline (not a goal but should not break)

### Claude's Discretion
- Component library: probably none (simple enough for Tailwind + native React). React Router optional if multi-page.
- State management: useState/useContext sufficient. No Redux/Zustand needed.
- File structure inside `frontend/src/`: implementer's call.
- Whether to memoize catalog fetch.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- All Phase 1 + Phase 2 modules importable from FastAPI handlers:
  - `src.shared.loader.load_json` — load catalog
  - `src.oop.checker.build_catalog`, `check_eligibility` — OOP backend
  - `src.fp.checker.parse_catalog`, `check_eligibility` — FP backend
  - `src.shared.recommender.get_eligible_courses, get_near_eligible_courses` — recommender
  - `src.api.transcript_parser.parse_transcript_pdf` — PDF parsing pipeline
  - `src.api.parser.parse_prerequisites_text` — only needed if dynamic prereq input from user (likely not in v1)

### Established Patterns
- Module docstring on line 1, snake_case, 4-space indent, PascalCase classes.
- venv at `venv/` for backend deps.

### Integration Points
- FastAPI endpoint that toggles backend: lazy-import `oop_check` or `fp_check` based on query param; pass to recommender via `check_eligibility=...`.
- For FP backend, `in_progress` must be tuple. Convert from JSON list at endpoint boundary.
- Catalog cached at backend startup (load once into memory).

</code_context>

<specifics>
## Specific Ideas

- Demo polish > production code quality. No auth, no rate limit, single-process uvicorn.
- Backend serves on `:8000` (FastAPI default), frontend Vite dev on `:5173`.
- Two-command boot: `uvicorn app.main:app --reload` + `cd frontend && npm run dev`.
- README updated with run instructions in Phase 4 (not this phase).
- File upload via `<input type="file" accept="application/pdf">`. multipart in fetch.
- Use SJSU catalog only — no upload-your-own-catalog UI.

</specifics>

<deferred>
## Deferred Ideas

- Save/load student records (no persistence)
- Editable transcript after parse — basic edit UI (add/remove courses) acceptable but not required
- Sharing demo link
- Multi-school catalog selector

</deferred>
