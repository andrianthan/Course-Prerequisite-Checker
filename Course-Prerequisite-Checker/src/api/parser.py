"""LLM-powered prerequisite parser — converts natural language to structured rules."""

import json
import jsonschema
from src.api._client import get_client, MODEL
from src.shared.schemas import RULE_SCHEMA

# Phrases that unambiguously mean "no prerequisites"
_NO_PREREQ_PHRASES = {"none", "no prerequisites", "no prereqs", "n/a", ""}

PREREQ_SYSTEM_PROMPT = """You are a parser that converts SJSU course prerequisite text into structured JSON.

Output ONLY valid JSON matching one of these structures:
1. Single course: {"type": "course", "course_id": "CS46A", "min_grade": "C-"}
2. AND rule: {"type": "and", "requirements": [...]}
3. OR rule: {"type": "or", "requirements": [...]}

Rules:
- Output null if there are no prerequisites.
- course_id must match the SJSU catalog ID (e.g., "CS46A", "MATH31"). Remove spaces.
- min_grade is optional; include it only when explicitly stated (e.g., "C- or better").
- Do not include explanatory text — output only JSON.

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

Input: "none"
Output: null
"""


def parse_prerequisites_text(text: str):
    """Parse natural-language prerequisite text into a RULE_SCHEMA-validated dict.

    Returns None when the text clearly indicates no prerequisites.
    Raises EnvironmentError if OPENROUTER_API_KEY is not set.
    Raises ValueError if LLM output fails RULE_SCHEMA validation.
    """
    # Fast-path: obvious no-prereq cases avoid an unnecessary LLM call
    if text.strip().lower() in _NO_PREREQ_PHRASES:
        return None

    client = get_client()
    response = client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": PREREQ_SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
    )
    raw = response.choices[0].message.content

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"LLM returned non-JSON content for prereq text {text!r}: {raw!r}"
        ) from exc

    # LLM may return JSON null for no-prereq courses
    if data is None:
        return None

    try:
        jsonschema.validate(data, RULE_SCHEMA)
    except jsonschema.ValidationError as exc:
        raise ValueError(
            f"LLM output does not match RULE_SCHEMA: {exc.message}\nGot: {data!r}"
        ) from exc

    return data
