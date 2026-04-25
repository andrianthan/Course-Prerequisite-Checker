---
plan: 02-02
status: complete
---

# 02-02 Summary — prereq text parser via LLM

## Files Modified
- `src/api/parser.py` — stub replaced with full LLM-powered implementation

## Public Exports
- `parse_prerequisites_text(text: str)` — converts natural-language prereq text to a RULE_SCHEMA-validated dict (or None)
- `PREREQ_SYSTEM_PROMPT` — system prompt constant (importable for testing/inspection)

## Behavior
- **Fast path:** inputs in `_NO_PREREQ_PHRASES` (none, no prerequisites, no prereqs, n/a, empty string) return `None` immediately without calling the LLM.
- **LLM path:** calls `get_client()` from `src.api._client`, uses `MODEL`, sends JSON mode request.
- **Validation:** `jsonschema.validate(data, RULE_SCHEMA)` runs on all non-null LLM output; raises `ValueError` with message containing "RULE_SCHEMA" on failure.
- **Error propagation:** `EnvironmentError` from `get_client()` propagates unmodified when API key is absent.
- **Null LLM response:** JSON `null` from LLM is accepted as `None` return (no schema validation needed).

## Fast-Path Verified
- `parse_prerequisites_text("none")` → `None` (no API call)
- `parse_prerequisites_text("No prerequisites")` → `None` (no API call, case-insensitive)
- `parse_prerequisites_text("")` → `None` (no API call)

## Deviations
- None. Implementation matches plan code block exactly.
