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

TRANSCRIPT_SYSTEM_PROMPT = """You are a parser that extracts course history from an SJSU MySJSU unofficial transcript.

Output ONLY valid JSON with this exact structure:
{
  "completed": {"COURSE_ID": "GRADE", ...},
  "in_progress": ["COURSE_ID", ...]
}

## Course ID normalization
- Concatenate department code + course number with NO space: "CS 46B" -> "CS46B", "MATH 42" -> "MATH42", "CS 100W" -> "CS100W", "CS 157A" -> "CS157A", "PHIL 134" -> "PHIL134".
- Preserve trailing letters (W, A, B, C, etc.) — they are part of the course id.

## What to INCLUDE in "completed"
- Any course taken at SJSU with a letter grade in the GR column: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F.
- Withdrawn courses: include with grade "W".
- Incomplete courses: include with grade "I".
- All departments — not just CS. Include MATH, PHIL, COMM, HIST, etc. (the catalog will filter what is relevant later).
- If a course appears multiple times (retakes), use the most RECENT letter grade.

## What to SKIP (do NOT include in "completed")
- "EXTERNAL CREDIT" rows (transfer credits from other colleges, e.g. "Mission College", "Chaffey College", "College of Alameda", "Cerro Coso Community College") — these have UE units but no SJSU letter grade.
- AP credit rows (e.g. "AP Calculus AB", "AP Computer Science A", "AP World History") — these show a numeric AP score (3, 4, 5), not a letter grade.
- Courses with grade "CR" (credit/no-grade), "NC", "AU" (audit), "RP" (in progress / report pending without final grade), or "RD".
- "EXTERNAL CREDIT TOTALS", "SEMESTER TOTAL", "SJSU CUM", "ALL COLLEGE" totals/aggregate rows.
- Header lines like "FALL SEMESTER 2024", "SPRING SEMESTER 2025", "WINTER SESSION 2025", "UGD - Undergraduate Degree", "MAJOR: BS Computer Science", "Dean's Scholar", "DEGREE OBJECTIVE:", "UNIVERSITY MEMORANDUM", "STUDENT NAME:", "STUDENT NUMBER:", "DATE PRINTED:", "BIRTH MO/DAY:", "Note:" annotations.
- "Course Topic:" sublines that appear under special-topics courses (e.g. CS 192). Keep the parent course line (e.g. CS192) but ignore the topic description.
- The column-header line containing "UA UG UE GR GP GPA".
- Page footers (URLs, page numbers).

## What goes in "in_progress"
- Courses listed under a semester header marked "IN PROGRESS" or under the current/upcoming term that has no final grades shown.
- If a future semester says "ENROLLED" or "IN PROGRESS" but lists no individual courses, leave "in_progress" empty unless courses are explicitly named.
- Use the same normalized course-id format ("CS46B" style).

## Output format
Output ONLY the JSON object. No explanation, no markdown fences, no preamble.
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
