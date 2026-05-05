# Technology Stack

**Analysis Date:** 2026-04-24

## Languages

**Primary:**
- Python 3.14.3 - All core logic, API clients, tests, data processing

## Runtime

**Environment:**
- Python 3.14.3 (available via `python3`)
- Virtual environment (`venv/`) recommended for dependency isolation

**Package Manager:**
- pip
- Lockfile: Not present (requirements.txt only, no `requirements-lock.txt` or `Pipfile.lock`)

## Frameworks

**Core:**
- None - Pure Python with dataclasses and manual implementations

**Testing:**
- pytest 7.0.0+ - Unit and integration test framework
- Run via: `pytest`

**LLM Integration:**
- openai 1.0.0+ - OpenRouter API client (compatible with OpenAI SDK)
  - Used for: Natural language parsing of prerequisites and transcripts
  - Location: `src/api/parser.py`, `src/api/transcript_parser.py`

**Utilities:**
- python-dotenv 1.0.0+ - Environment variable loading from `.env` files
  - Used by: LLM parser modules for `OPENROUTER_API_KEY` access

## Key Dependencies

**Critical:**
- `openai>=1.0.0` - OpenRouter API client for LLM-powered parsing
  - Why it matters: Core feature for parsing natural language prerequisites and transcripts
  - Provider: OpenRouter (via `https://openrouter.ai/api/v1`)

**Infrastructure:**
- `python-dotenv>=1.0.0` - Loads environment variables from `.env` file
  - Purpose: Secure credential management for `OPENROUTER_API_KEY`

**Testing:**
- `pytest>=7.0.0` - Test framework for shared test suite
  - Purpose: Both OOP and FP implementations must pass identical tests

## Configuration

**Environment:**
- Configured via `.env` file (not committed; `.env.example` provided)
- Key variable: `OPENROUTER_API_KEY` - Required for LLM parsing functionality

**Build:**
- No explicit build system (pure Python)
- No `setup.py`, `pyproject.toml`, or build configuration files present

## Data Format

**Input/Output:**
- JSON for course catalogs and student records
- Data files: `data/sample_catalog.json`, `data/sjsu_cs_catalog.json`, `data/sample_student.json`
- JSON schema defined in `src/shared/schemas.py` for rule validation

## Platform Requirements

**Development:**
- Python 3.14.3 or compatible version
- Terminal with bash/zsh for venv activation
- Text editor (no IDE required)

**Production:**
- Python 3.14.3 or compatible
- `OPENROUTER_API_KEY` environment variable must be set
- Network access to `https://openrouter.ai/api/v1` for LLM calls

---

*Stack analysis: 2026-04-24*
