# Phase 2: LLM + Recommender - Research

**Researched:** 2026-04-24
**Domain:** OpenRouter/OpenAI SDK JSON output, PDF text extraction, jsonschema validation, recommender algorithm
**Confidence:** HIGH (stack verified against live pypi + OpenRouter docs; patterns verified against existing codebase)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- OpenRouter via `openai` SDK (already in requirements.txt) — pattern already in `src/api/parser.py`
- API key from `OPENROUTER_API_KEY` env var via `dotenv`
- JSON rules must validate against `src/shared/schemas.py` `RULE_SCHEMA`
- Student record shape: `{"completed": {course_id: grade}, "in_progress": [course_id, ...]}` matches `data/sample_student.json`
- Recommender consumes either OOP or FP backend via uniform `check_eligibility(course, completed, in_progress) -> (bool, str)` interface
- No new heavy deps; pypdf or pdfplumber acceptable for PDF text extraction
- Letter-grade strings only (Phase 1 lock)

### Claude's Discretion
All other implementation choices (model name, prompt wording, validation pattern, test mocking strategy, exact exception class for missing API key) are at Claude's discretion.

### Deferred Ideas (OUT OF SCOPE)
- Concurrency / batch eligibility check (CON-01..03)
- Co-requisite full semantics (CORQ-01..02)
- Caching LLM responses across runs
- Multi-school catalog support
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LLM-01 | `parse_prerequisites_text(text)` calls OpenRouter and returns structured rule JSON matching `RULE_SCHEMA` | OpenRouter response_format json_object pattern; jsonschema validate() pattern; few-shot prompt examples from catalog |
| LLM-02 | `parse_transcript_text(text)` calls OpenRouter and returns student record JSON | Same OpenRouter SDK pattern; student record schema from sample_student.json |
| LLM-03 | `parse_transcript_pdf(pdf_path)` extracts text from PDF then delegates to `parse_transcript_text` | pypdf vs pdfplumber selection; pypdf is lighter, sufficient for text-extractable transcripts |
| LLM-04 | LLM functions handle missing API key gracefully (clear error, no crash) | `EnvironmentError` or custom `ConfigurationError`; guard before creating OpenAI client |
| REC-01 | `get_eligible_courses(catalog, completed, in_progress)` returns list of courses student is eligible for but hasn't taken | Iterate catalog, call check_eligibility callable, filter where eligible and not already in completed/in_progress |
| REC-02 | `get_near_eligible_courses(catalog, completed, in_progress)` returns courses one prereq away from eligibility, with what's missing | Parse "Not eligible: X" explanation string, count unmet prereqs; return those with exactly 1 unmet |
</phase_requirements>

---

## Summary

Phase 2 adds three new modules to a working Phase 1 base: `src/api/parser.py` (prereq LLM parsing), `src/api/transcript_parser.py` (transcript LLM parsing + PDF text extraction), and `src/shared/recommender.py` (course recommendation). The OpenRouter client pattern is already in both stub files — the work is filling in the LLM call, prompt, and validation logic.

The key technical decisions are: (1) use `response_format={"type": "json_object"}` for OpenRouter calls — it is the lower-common-denominator JSON mode widely supported across free models and requires only a prompt-level instruction to return JSON; (2) use `pypdf` for PDF extraction — it is lighter than pdfplumber, already widely used, and sufficient for text-extractable SJSU transcripts (no table-coordinate extraction needed since the LLM cleans up the text); (3) use `jsonschema.validate()` for RULE_SCHEMA validation — `jsonschema` is not yet in requirements.txt and must be added; (4) mock OpenRouter with `pytest.monkeypatch` or `unittest.mock.patch` targeting `openai.resources.chat.completions.Completions.create` — no extra test libraries needed.

The recommender algorithm for `get_near_eligible_courses` parses the explanation string returned by `check_eligibility` rather than re-evaluating rules — this is fragile but simple and sufficient for demo scope. A more robust approach would count unmet leaves in the rule tree, but that requires modifying the checker interface which is locked.

**Primary recommendation:** Use `google/gemma-3-12b-it:free` as the LLM model — it is free, explicitly supports structured outputs and function calling, and has a 128K context window. Fall back to `meta-llama/llama-3.1-8b-instruct:free` if Gemma quota is exhausted. Use `response_format={"type": "json_object"}` with a system prompt instructing JSON output, then validate with `jsonschema.validate()`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| openai | 2.31.0 (installed) | OpenRouter API client | Already in requirements.txt; project locked on this |
| python-dotenv | 1.0.0+ | Load OPENROUTER_API_KEY from .env | Already in requirements.txt |
| pypdf | 6.10.2 (latest) | PDF text extraction | Lighter than pdfplumber; sufficient for text-PDFs; no heavy deps |
| jsonschema | 4.26.0 (latest) | Validate LLM output against RULE_SCHEMA | Industry standard; already available on PyPI; not yet in requirements.txt |

**Note on openai SDK version:** The installed version is 2.31.0. The package was renumbered — 2.x is the current series (formerly 1.x). The `openai.OpenAI(base_url=..., api_key=...)` constructor and `client.chat.completions.create(...)` API are stable across both.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pytest | 7.0.0+ | Test framework | All tests; already in requirements.txt |
| unittest.mock | stdlib | Mock OpenAI client in tests | No extra install needed; use `patch` on the client's create method |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pypdf | pdfplumber | pdfplumber is better for coordinate-based table extraction but adds pdfminer.six as a heavy dep; overkill since LLM handles cleanup |
| jsonschema | manual dict validation | Manual validation misses nested cases and is more code; jsonschema handles recursive $ref schemas |
| monkeypatch / unittest.mock | `openai-responses` pytest plugin | Plugin is cleaner but adds a dependency; stdlib mock is sufficient for a class project |
| google/gemma-3-12b-it:free | meta-llama/llama-3.1-8b-instruct:free | Both free; Gemma explicitly advertises structured outputs support |

**Installation (additions to requirements.txt):**
```bash
pip install pypdf>=6.0.0 jsonschema>=4.0.0
```

**Version verification (confirmed 2026-04-24):**
- `pypdf`: 6.10.2 on PyPI
- `jsonschema`: 4.26.0 on PyPI
- `openai`: 2.31.0 installed (2.32.0 latest on PyPI — compatible)

---

## Architecture Patterns

### Existing Module Structure (Phase 1)
```
src/
├── api/
│   ├── parser.py            # STUB — fill in parse_prerequisites_text()
│   └── transcript_parser.py # STUB — fill in parse_transcript_text(), parse_transcript_pdf()
├── shared/
│   ├── recommender.py       # STUB — fill in get_eligible_courses(), get_near_eligible_courses()
│   ├── schemas.py           # RULE_SCHEMA — already defined, use as-is
│   ├── grades.py            # grade_meets_minimum(), GRADE_ORDER — usable
│   ├── errors.py            # CycleError — existing pattern for custom exceptions
│   ├── graph.py             # _detect_cycles() — not relevant to Phase 2
│   └── loader.py            # load_json() — usable for loading catalog/student files
├── oop/checker.py           # check_eligibility(course, completed, in_progress) -> (bool, str)
└── fp/checker.py            # check_eligibility(course_info, completed, in_progress) -> (bool, str)
```

### Pattern 1: OpenRouter JSON Call with Validation
**What:** Call OpenRouter via openai SDK, request JSON output, parse with json.loads, validate with jsonschema.
**When to use:** Both `parse_prerequisites_text` and `parse_transcript_text`.

```python
# Source: OpenRouter docs (https://openrouter.ai/docs/api/reference/parameters)
# + openai SDK pattern already in src/api/parser.py stub

import json
import os
from openai import OpenAI
from dotenv import load_dotenv
import jsonschema

load_dotenv()

MODEL = "google/gemma-3-12b-it:free"

def get_client():
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "OPENROUTER_API_KEY is not set. "
            "Copy .env.example to .env and add your key."
        )
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )

def parse_prerequisites_text(text):
    client = get_client()
    response = client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
    )
    raw = response.choices[0].message.content
    data = json.loads(raw)
    jsonschema.validate(data, RULE_SCHEMA)  # raises ValidationError on bad output
    return data
```

**Critical detail:** The `get_client()` guard on `api_key` must happen before `OpenAI(...)` is called — otherwise the SDK will attempt to use `None` as the key and raise an `AuthenticationError` instead of a clear `EnvironmentError`.

### Pattern 2: PDF Text Extraction with pypdf
**What:** Extract all page text from a PDF path, return as a single string.
**When to use:** `parse_transcript_pdf` — extract text, then pass to `parse_transcript_text`.

```python
# Source: pypdf docs (https://pypdf.readthedocs.io/en/stable/)
import pypdf

def parse_transcript_pdf(pdf_path):
    reader = pypdf.PdfReader(pdf_path)
    pages_text = [page.extract_text() or "" for page in reader.pages]
    full_text = "\n".join(pages_text)
    return parse_transcript_text(full_text)
```

**Note:** `page.extract_text()` can return `None` for pages with no extractable text (e.g., image-only pages). The `or ""` guard prevents `None` concatenation. REQUIREMENTS.md explicitly out-of-scopes OCR, so this is acceptable behavior.

### Pattern 3: Recommender Using check_eligibility Callable
**What:** Accept catalog and a `check_eligibility` callable; iterate all courses.
**When to use:** Both `get_eligible_courses` and `get_near_eligible_courses`.

```python
# Source: Phase 1 checker interface (src/oop/checker.py, src/fp/checker.py)

def get_eligible_courses(catalog, completed, in_progress, check_eligibility=None):
    """Return list of (course_id, course) pairs the student can take but hasn't."""
    if check_eligibility is None:
        from src.oop.checker import check_eligibility as _check
        check_eligibility = _check

    already_done = set(completed.keys()) | set(in_progress)
    result = []
    for course_id, course in catalog.items():
        if course_id in already_done:
            continue
        eligible, _ = check_eligibility(course, completed, in_progress)
        if eligible:
            result.append((course_id, course))
    return result
```

**Callable injection pattern:** Accept `check_eligibility` as an optional parameter with an OOP default. Tests can inject either backend. Phase 3 (FastAPI) can pass either based on a query param.

### Pattern 4: Near-Eligible Courses via Explanation Parsing
**What:** Determine "one prereq away" by counting missing items in the `check_eligibility` explanation.
**When to use:** `get_near_eligible_courses`.

The explanation format from both checkers is:
- `"Not eligible: missing CS46A"` — 1 unmet item
- `"Not eligible: missing CS46A, missing CS42"` — 2 unmet items

```python
def get_near_eligible_courses(catalog, completed, in_progress, check_eligibility=None):
    """Return list of (course_id, course, missing_explanation) for courses one prereq away."""
    if check_eligibility is None:
        from src.oop.checker import check_eligibility as _check
        check_eligibility = _check

    already_done = set(completed.keys()) | set(in_progress)
    result = []
    for course_id, course in catalog.items():
        if course_id in already_done:
            continue
        eligible, explanation = check_eligibility(course, completed, in_progress)
        if eligible:
            continue
        # Parse the "Not eligible: X, Y" format
        if explanation.startswith("Not eligible: "):
            missing_part = explanation[len("Not eligible: "):]
            # Count comma-separated items
            unmet_items = [x.strip() for x in missing_part.split(",") if x.strip()]
            if len(unmet_items) == 1:
                result.append((course_id, course, unmet_items[0]))
    return result
```

**Known limitation:** This parses the human-readable explanation string, not the rule tree directly. It works correctly for simple `CourseRule` and flat `AndRule` cases. For nested `OrRule` cases, the explanation may collapse multiple items into one comma entry (FP produces `"X OR Y"` as a single item). This is acceptable for the demo — the "1 missing prereq" definition is understood as 1 top-level unmet condition.

### Pattern 5: Prompt Design for Prereq Parsing
**What:** System prompt instructing the LLM to convert natural-language prereqs to RULE_SCHEMA JSON.

The key design: embed the RULE_SCHEMA structure and few-shot examples drawn directly from `data/sjsu_cs_catalog.json`.

```python
PREREQ_SYSTEM_PROMPT = """You are a parser that converts SJSU course prerequisite text into structured JSON.

Output ONLY valid JSON matching one of these structures:
1. Single course: {"type": "course", "course_id": "CS46A", "min_grade": "C-"}
2. AND rule: {"type": "and", "requirements": [...]}
3. OR rule: {"type": "or", "requirements": [...]}

Rules:
- Use null if there are no prerequisites.
- course_id must match the SJSU catalog ID (e.g., "CS46A", "MATH31").
- min_grade is optional; include it only when explicitly stated (e.g., "C- or better").
- Do not include explanatory text, only JSON.

Examples:
Input: "CS 46A with a grade of C- or better"
Output: {"type": "course", "course_id": "CS46A", "min_grade": "C-"}

Input: "CS 46B and MATH 42 (C- or better in each)"
Output: {"type": "and", "requirements": [
  {"type": "course", "course_id": "CS46B", "min_grade": "C-"},
  {"type": "course", "course_id": "MATH42", "min_grade": "C-"}
]}

Input: "CS 151 or CS 152"
Output: {"type": "or", "requirements": [
  {"type": "course", "course_id": "CS151"},
  {"type": "course", "course_id": "CS152"}
]}
"""
```

### Pattern 6: Prompt Design for Transcript Parsing
**What:** System prompt instructing the LLM to extract completed courses and in-progress courses from raw transcript text.

Student record shape (locked by CONTEXT.md):
```json
{
  "completed": {"CS46A": "B+", "CS46B": "A-"},
  "in_progress": ["CS146"]
}
```

```python
TRANSCRIPT_SYSTEM_PROMPT = """You are a parser that extracts course history from an SJSU unofficial transcript.

Output ONLY valid JSON with this structure:
{
  "completed": {"COURSE_ID": "GRADE", ...},
  "in_progress": ["COURSE_ID", ...]
}

Rules:
- "completed" maps course IDs to final letter grades (e.g., "A", "B+", "C-").
- "in_progress" lists courses currently enrolled but not yet graded.
- Use "W" as the grade for withdrawn courses — include them in "completed".
- Ignore audit courses (grade "AU") and transfer credit labels.
- Normalize course IDs: remove spaces ("CS 46A" -> "CS46A").
- If a course appears multiple times (repeat), use the most recent final grade.
- Output only JSON, no explanation.
"""
```

**Edge cases documented:**
- Withdrawals: put in `completed` with grade `"W"`. The `grades.py` `NON_PASSING` set already contains `"W"` — so the checker will correctly reject W as meeting any min_grade.
- In-progress (current semester): put in `in_progress` list.
- Incompletes (grade `"I"`): put in `completed` with grade `"I"`. `NON_PASSING` contains `"I"`.
- Repeated courses: use latest grade.

### Anti-Patterns to Avoid
- **Calling `OpenAI(api_key=None)` then catching AuthenticationError:** The SDK accepts `None` without raising immediately; the error comes at call time with a confusing message. Always validate the env var before instantiating the client.
- **Returning LLM output without jsonschema validation:** LLMs occasionally hallucinate extra fields or wrong types. `jsonschema.validate()` catches this before callers downstream crash.
- **Building `check_eligibility` into the recommender by hardcoding one backend import:** This blocks Phase 3's backend-toggle feature. Always accept the callable as a parameter with a default.
- **Splitting `get_client()` into two identical copies in parser.py and transcript_parser.py:** Consider a shared `src/api/_client.py` or keep as-is (both stubs already have it). Either is fine — do not add a third copy.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF text extraction | Custom PDF byte parser | `pypdf.PdfReader` | PDF format is complex; pypdf handles encryption, encoding, cross-references |
| JSON schema validation | Manual dict key checking | `jsonschema.validate()` | `RULE_SCHEMA` uses recursive `$ref` (the `"$ref": "#"` in `requirements.items`) — manual checking would need to replicate full recursive descent |
| OpenRouter API client | `requests`/`httpx` calls | `openai.OpenAI(base_url=...)` | SDK handles retries, auth headers, error parsing, streaming |
| Grade comparison | `"B+" > "A-"` string compare | `grades.grade_meets_minimum()` from `src/shared/grades.py` | Already implemented in Phase 1; handles the non-obvious `GRADE_ORDER` list |

**Key insight:** The LLM cleans up messy PDF text — there is no need for pdfplumber's coordinate-based table parsing. `pypdf` provides "good enough" raw text for the LLM to consume.

---

## Runtime State Inventory

Step 2.5: SKIPPED — this is a greenfield implementation phase (not a rename/refactor/migration). No stored data, live service config, OS-registered state, secrets, or build artifacts need updating.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3 | All code | ✓ | 3.14.3 | — |
| pip | Package install | ✓ | 26.0 | — |
| openai SDK | LLM calls | ✓ | 2.31.0 installed | — |
| python-dotenv | API key loading | ✓ | In requirements.txt | — |
| pypdf | PDF extraction | ✗ (not yet installed) | 6.10.2 on PyPI | — (must add to requirements.txt) |
| jsonschema | RULE_SCHEMA validation | ✗ (not yet installed) | 4.26.0 on PyPI | — (must add to requirements.txt) |
| OPENROUTER_API_KEY | LLM API calls | Unknown | — | Graceful EnvironmentError per LLM-04 |

**Missing dependencies with no fallback (must install):**
- `pypdf>=6.0.0` — required by LLM-03; add to requirements.txt
- `jsonschema>=4.0.0` — required by LLM-01, LLM-02; add to requirements.txt

**Missing dependencies with fallback:**
- `OPENROUTER_API_KEY` — tests must mock the LLM client so tests pass without a live key

---

## Common Pitfalls

### Pitfall 1: RULE_SCHEMA `$ref: "#"` Does Not Work with `jsonschema.validate()` by Default
**What goes wrong:** The `RULE_SCHEMA` uses `"$ref": "#"` inside `requirements.items` to create a recursive schema. When passed directly to `jsonschema.validate(data, RULE_SCHEMA)`, the `#` anchor resolves to the root of the schema passed in — which is `RULE_SCHEMA` itself. This works correctly with `jsonschema` 4.x because `$ref: "#"` means "this same schema." **Verified: this is correct behavior and works as written.**
**Why it happens:** Misconception that `$ref` requires an explicit registry. In jsonschema 4.x, `"$ref": "#"` always means the root document being validated against.
**How to avoid:** Use `jsonschema.validate(data, RULE_SCHEMA)` directly — no extra configuration needed. If a `RefResolutionError` appears, it means the schema was mutated or wrapped incorrectly.
**Warning signs:** `jsonschema.exceptions.RefResolutionError` at import time.

### Pitfall 2: `response_format={"type": "json_object"}` Not Sufficient — Must Also Prompt for JSON
**What goes wrong:** The OpenRouter/OpenAI spec requires that when using `json_object` mode, the prompt must explicitly mention JSON. If the system prompt does not say "output JSON," some providers return a `400 Bad Request` and others return text.
**Why it happens:** The spec says: "When using JSON mode, you must also instruct the model to produce JSON yourself via a system or user message."
**How to avoid:** Every system prompt for LLM-01 and LLM-02 must include "Output ONLY valid JSON" or similar explicit instruction.
**Warning signs:** `openai.BadRequestError: 400 – ..json_object mode requires the word JSON...`

### Pitfall 3: Model Quota Exhaustion on Free Tier
**What goes wrong:** `google/gemma-3-12b-it:free` and `meta-llama/llama-3.1-8b-instruct:free` have free tier rate limits (typically 20 requests/minute, 200 requests/day on OpenRouter). During demo day rapid-fire usage, the limit may be hit.
**Why it happens:** Free models are rate-limited per user.
**How to avoid:** For demo, prime with a few test runs ahead of time. During testing, use mocked responses. The paid `meta-llama/llama-3.1-8b-instruct` at $0.02/M input + $0.05/M output is essentially free for a class project.
**Warning signs:** `openai.RateLimitError` from OpenRouter.

### Pitfall 4: pypdf Returns Empty String for Some SJSU Transcript Pages
**What goes wrong:** Some PDF pages (cover pages, logos, signature pages) may return empty or near-empty strings from `page.extract_text()`. If the full-text join is then sent to the LLM, the LLM receives partial data.
**Why it happens:** SJSU unofficial transcripts have a header page and sometimes footer decorations without extractable text glyphs.
**How to avoid:** Filter out empty pages before joining: `pages_text = [t for t in (p.extract_text() or "" for p in reader.pages) if t.strip()]`. The LLM handles the remaining variability.
**Warning signs:** LLM returns `{"completed": {}, "in_progress": []}` for a real transcript.

### Pitfall 5: `in_progress` Type Mismatch Between OOP and FP Checkers
**What goes wrong:** OOP `check_eligibility` accepts `in_progress` as a `list`; FP accepts it as a `tuple`. If the recommender passes a `list` to the FP checker, Python's `match` statement in `evaluate_rule` does not fail — but any caller that expects a frozen type will get a mutable object.
**Why it happens:** Phase 1 design decision: OOP uses `[]`, FP uses `()`.
**How to avoid:** In the recommender, normalize `in_progress` before passing:
```python
eligible, expl = check_eligibility(course, completed, list(in_progress))  # OOP default
# or
eligible, expl = check_eligibility(course, completed, tuple(in_progress))  # FP
```
The safest approach for the recommender: accept `in_progress` as either type and pass it through unchanged — let the caller be responsible for passing the right type for their chosen backend.
**Warning signs:** Subtle behavior differences between OOP and FP recommender results that are hard to trace.

### Pitfall 6: Missing API Key Raises `AuthenticationError` Instead of Clear `EnvironmentError`
**What goes wrong:** If `OPENROUTER_API_KEY` is not set, `os.getenv("OPENROUTER_API_KEY")` returns `None`. The `OpenAI(api_key=None)` call does not raise immediately — the error surfaces at `.create(...)` time as `openai.AuthenticationError: 401 Unauthorized`. This is confusing because the error message mentions HTTP 401, not "missing env var."
**Why it happens:** openai SDK defers authentication until the first API call.
**How to avoid:** Guard in `get_client()` before creating the client:
```python
api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    raise EnvironmentError(
        "OPENROUTER_API_KEY is not set. Copy .env.example to .env and fill in your key."
    )
```
**Warning signs:** Test output shows `AuthenticationError: 401` when `OPENROUTER_API_KEY` was supposed to be tested as missing.

---

## Code Examples

Verified patterns from official sources and existing codebase:

### jsonschema.validate() usage
```python
# Source: jsonschema docs (https://python-jsonschema.readthedocs.io/en/stable/validate/)
import jsonschema
from src.shared.schemas import RULE_SCHEMA

def validate_rule(data):
    """Validate LLM output against RULE_SCHEMA. Raises ValidationError on failure."""
    try:
        jsonschema.validate(data, RULE_SCHEMA)
    except jsonschema.ValidationError as e:
        raise ValueError(f"LLM output does not match RULE_SCHEMA: {e.message}") from e
```

### pypdf text extraction
```python
# Source: pypdf docs (https://pypdf.readthedocs.io/en/stable/)
import pypdf

def extract_pdf_text(pdf_path):
    reader = pypdf.PdfReader(pdf_path)
    texts = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(t for t in texts if t.strip())
```

### Mocking OpenAI in tests (no extra deps)
```python
# Source: unittest.mock stdlib
from unittest.mock import MagicMock, patch
import json

def make_mock_response(content_dict):
    """Create a fake OpenAI ChatCompletion response."""
    msg = MagicMock()
    msg.content = json.dumps(content_dict)
    choice = MagicMock()
    choice.message = msg
    response = MagicMock()
    response.choices = [choice]
    return response

# In a test:
def test_parse_prerequisites_text(monkeypatch):
    expected = {"type": "course", "course_id": "CS46A", "min_grade": "C-"}
    mock_create = MagicMock(return_value=make_mock_response(expected))
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    with patch("openai.resources.chat.completions.Completions.create", mock_create):
        from src.api.parser import parse_prerequisites_text
        result = parse_prerequisites_text("CS 46A with C- or better")
    assert result == expected
```

**Alternative simpler mock target:** `patch("src.api.parser.get_client")` returning a mock client object — avoids patching the openai internals.

### Student record validation (no jsonschema needed — shape is simple)
```python
STUDENT_RECORD_SCHEMA = {
    "type": "object",
    "properties": {
        "completed": {"type": "object", "additionalProperties": {"type": "string"}},
        "in_progress": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["completed", "in_progress"],
}
# Use jsonschema.validate(data, STUDENT_RECORD_SCHEMA) in parse_transcript_text
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PyPDF2 | pypdf (same project, renamed) | 2022 | Import is `import pypdf`, not `import PyPDF2` — do not use the old name |
| `openai.ChatCompletion.create()` (module-level) | `client.chat.completions.create()` (instance method) | openai SDK v1.0 (Nov 2023) | The stubs already use the new pattern — no migration needed |
| `RefResolver` for jsonschema $ref | Built-in resolver (no RefResolver) | jsonschema 4.18+ | `RefResolver` is deprecated; `validate()` handles `$ref: "#"` natively |

**Deprecated/outdated:**
- `PyPDF2`: Project renamed to `pypdf`; `PyPDF2` still works but redirects — use `pypdf` directly
- `openai.ChatCompletion.create()`: Old module-level API, replaced by client instance pattern in v1.0+

---

## Open Questions

1. **Will `google/gemma-3-12b-it:free` JSON mode work reliably for nested prereq structures?**
   - What we know: Gemma 3 12B explicitly advertises structured output support; OpenRouter docs recommend prompting for JSON even with `json_object` mode
   - What's unclear: Whether the free tier enforces `response_format` or silently ignores it
   - Recommendation: Add a retry/fallback: if `json.loads()` fails, try once more without `response_format` but with stronger prompt instruction. For a class project, one retry is sufficient.

2. **Exact patch target for mocking OpenAI in tests**
   - What we know: The client pattern is `client.chat.completions.create(...)` where client is created by `get_client()`
   - What's unclear: Whether to patch `openai.resources.chat.completions.Completions.create` (library internals) or mock `get_client()` (higher level)
   - Recommendation: Patch `get_client` in each module — simpler and more stable across openai SDK version changes:
     ```python
     with patch("src.api.parser.get_client") as mock_gc:
         mock_gc.return_value.chat.completions.create.return_value = make_mock_response(...)
     ```

3. **RULE_SCHEMA validation against LLM output that returns `null` for no-prereq courses**
   - What we know: `parse_prerequisites_text` is called with natural-language text; if the input is "none" or empty, the LLM may return `null`/`None`
   - What's unclear: Does `null` validate against `RULE_SCHEMA`? `RULE_SCHEMA` uses `oneOf` — `null` does not match either branch, so `jsonschema.validate(None, RULE_SCHEMA)` will raise `ValidationError`
   - Recommendation: Return `None` directly (before jsonschema validation) if the raw LLM output is `null` or the input text clearly indicates no prereqs. Document this as acceptable behavior — callers (the catalog builder) already handle `prerequisites: null`.

---

## Validation Architecture

> `workflow.nyquist_validation` is explicitly `false` in `.planning/config.json`. This section is SKIPPED.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase (`src/api/parser.py`, `src/api/transcript_parser.py`, `src/shared/schemas.py`, `src/shared/errors.py`, `src/shared/grades.py`, `src/oop/checker.py`, `src/fp/checker.py`) — read directly
- `data/sjsu_cs_catalog.json` — read directly; used for few-shot prompt examples
- `data/sample_student.json` — read directly; defines locked student record shape
- PyPI `pip index versions pypdf` — pypdf 6.10.2 confirmed 2026-04-24
- PyPI `pip index versions jsonschema` — jsonschema 4.26.0 confirmed 2026-04-24
- OpenRouter structured outputs docs: https://openrouter.ai/docs/guides/features/structured-outputs
- OpenRouter API parameters docs: https://openrouter.ai/docs/api/reference/parameters

### Secondary (MEDIUM confidence)
- OpenRouter Gemma 3 12B page: https://openrouter.ai/google/gemma-3-12b-it:free — "structured outputs and function calling" stated
- OpenRouter Llama 3.1 8B page: https://openrouter.ai/meta-llama/llama-3.1-8b-instruct — pricing confirmed ($0.02/$0.05 per M tokens)
- Response Healing announcement: https://openrouter.ai/announcements/response-healing-reduce-json-defects-by-80percent — JSON defect reduction stats
- pypdf vs pdfplumber comparison: https://onlyoneaman.medium.com/i-tested-7-python-pdf-extractors-so-you-dont-have-to-2025-edition-c88013922257
- jsonschema validate docs: https://python-jsonschema.readthedocs.io/en/stable/validate/

### Tertiary (LOW confidence — verify if critical)
- Exact mock patch target for openai SDK 2.x internals: https://tonyaldon.com/2026-02-12-mocking-the-openai-api-with-respx-in-python/ — suggests patching at `get_client()` level instead of library internals

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions verified against live PyPI; openai SDK pattern already in codebase
- Architecture: HIGH — checker interfaces read directly from Phase 1 source; recommender algorithm is straightforward set arithmetic
- LLM prompts: MEDIUM — content verified against catalog examples; exact model JSON reliability is LOW (untested against free tier Gemma quota)
- PDF extraction: HIGH — pypdf API verified; SJSU transcripts are text-extractable per REQUIREMENTS.md
- Test mocking: MEDIUM — pattern is standard Python; exact import path for openai 2.x internals not confirmed

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (openai SDK and OpenRouter model availability may change; verify model IDs before running)
