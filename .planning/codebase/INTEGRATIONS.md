# External Integrations

**Analysis Date:** 2026-04-24

## APIs & External Services

**LLM Service:**
- OpenRouter (https://openrouter.ai/api/v1) - LLM-powered natural language parsing
  - SDK/Client: `openai>=1.0.0` (OpenAI SDK used as client for OpenRouter API)
  - Auth: `OPENROUTER_API_KEY` environment variable
  - Usage locations:
    - `src/api/parser.py` - Parses natural-language prerequisite descriptions into structured JSON rules
    - `src/api/transcript_parser.py` - Extracts courses and grades from transcript text

## Data Storage

**Databases:**
- None - Project uses file-based JSON storage only

**File Storage:**
- Local filesystem only
- Catalog data: `data/sample_catalog.json`, `data/sjsu_cs_catalog.json`
- Student records: `data/sample_student.json`
- Data loading: `src/shared/loader.py` (simple file I/O via built-in `json` module)

**Caching:**
- None implemented

## Authentication & Identity

**Auth Provider:**
- None - Not applicable (no user system)

**API Authentication:**
- OpenRouter API Key only
  - Method: Bearer token in Authorization header (handled by openai SDK)
  - Credential source: `OPENROUTER_API_KEY` environment variable
  - Location: `.env` file (must not be committed; example at `.env.example`)

## Monitoring & Observability

**Error Tracking:**
- None - No external error tracking service

**Logs:**
- Console output only (via print/Python logging - not yet implemented)

## CI/CD & Deployment

**Hosting:**
- Not applicable (academic command-line project)

**CI Pipeline:**
- None detected

**Test Execution:**
- Local via `pytest` command
- No automated testing service integrated

## Environment Configuration

**Required env vars:**
- `OPENROUTER_API_KEY` - OpenRouter API key for LLM calls
  - Set in: `.env` file
  - Example provided: `.env.example`

**Secrets location:**
- `.env` file (local, not committed)
- Must be created before running code that calls LLM APIs

**Env var loading:**
- Handled by `python-dotenv` via `load_dotenv()` calls in:
  - `src/api/parser.py`
  - `src/api/transcript_parser.py`

## Webhooks & Callbacks

**Incoming:**
- None - Project has no server/API endpoint

**Outgoing:**
- None - Project only calls OpenRouter API (no webhook delivery)

## Data Format Specifications

**LLM Input/Output:**
- Input: Natural language text (prerequisites in prose, transcript images/text)
- Output: Structured JSON following schema defined in `src/shared/schemas.py`
- Rule format: JSON objects with `type` (course/and/or) and required fields

**Course Catalog Format:**
- JSON with course ID as key, course object as value
- Fields: `id`, `title`, `description`, `prerequisite` (rule structure)

**Student Record Format:**
- JSON with completed courses and in-progress courses
- Fields: Student name/ID, `completed` (dict of course_id -> grade), `in_progress` (list)

---

*Integration audit: 2026-04-24*
