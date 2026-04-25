"""LLM-powered transcript parser — extracts courses and grades from SJSU transcripts."""

import json
import pypdf
import jsonschema
from src.api._client import get_client, MODEL

STUDENT_RECORD_SCHEMA = {
    "type": "object",
    "properties": {
        "completed": {
            "type": "object",
            "additionalProperties": {"type": "string"},
        },
        "in_progress": {
            "type": "array",
            "items": {"type": "string"},
        },
    },
    "required": ["completed", "in_progress"],
}

TRANSCRIPT_SYSTEM_PROMPT = """You are a parser that extracts course history from an SJSU unofficial transcript.

Output ONLY valid JSON with this exact structure:
{
  "completed": {"COURSE_ID": "GRADE", ...},
  "in_progress": ["COURSE_ID", ...]
}

Rules:
- "completed" maps course IDs to final letter grades (e.g., "A", "B+", "C-", "F").
- "in_progress" lists courses currently enrolled (no final grade yet).
- Normalize course IDs by removing spaces: "CS 46A" -> "CS46A", "MATH 31" -> "MATH31".
- Include withdrawn courses in "completed" with grade "W".
- Include incomplete courses in "completed" with grade "I".
- If a course appears multiple times, use the most recent final grade.
- Ignore audit courses (grade "AU") and courses taken at other institutions.
- Output only JSON — no explanation, no markdown, no preamble.
"""


def parse_transcript_text(text: str) -> dict:
    """Parse raw transcript text into a student record dict.

    Returns {"completed": {course_id: grade}, "in_progress": [course_id, ...]}.
    Raises EnvironmentError if OPENROUTER_API_KEY is not set.
    Raises ValueError if LLM output fails schema validation.
    """
    client = get_client()
    response = client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": TRANSCRIPT_SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
    )
    raw = response.choices[0].message.content

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"LLM returned non-JSON content for transcript: {raw!r}"
        ) from exc

    try:
        jsonschema.validate(data, STUDENT_RECORD_SCHEMA)
    except jsonschema.ValidationError as exc:
        raise ValueError(
            f"LLM transcript output does not match expected schema: {exc.message}\nGot: {data!r}"
        ) from exc

    return data


def parse_transcript_pdf(pdf_path: str) -> dict:
    """Extract text from a transcript PDF and parse it into a student record.

    Filters empty pages (image-only cover pages, decorative footers) before
    passing text to parse_transcript_text. Raises EnvironmentError if
    OPENROUTER_API_KEY is not set.
    """
    reader = pypdf.PdfReader(pdf_path)
    page_texts = [page.extract_text() or "" for page in reader.pages]
    # Filter pages that are blank or whitespace-only (image-only pages)
    non_empty_texts = [t for t in page_texts if t.strip()]
    full_text = "\n".join(non_empty_texts)
    return parse_transcript_text(full_text)
