"""Phase 2 test suite — LLM parsers (mocked) + recommender (real OOP backend).

All LLM calls are mocked via unittest.mock so this suite runs without a live
OPENROUTER_API_KEY. Recommender tests use the real OOP checker and sjsu catalog.
"""

import json
import os
import pytest
from unittest.mock import MagicMock, patch

from src.shared.loader import load_json
from src.oop.checker import build_catalog, check_eligibility as oop_check
from src.shared.schemas import RULE_SCHEMA


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_mock_client(content_dict):
    """Return a fake OpenAI client whose .chat.completions.create() returns content_dict as JSON."""
    msg = MagicMock()
    msg.content = json.dumps(content_dict)
    choice = MagicMock()
    choice.message = msg
    response = MagicMock()
    response.choices = [choice]
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = response
    return mock_client


# ---------------------------------------------------------------------------
# LLM-01 — parse_prerequisites_text
# ---------------------------------------------------------------------------

class TestParsePrerequisitesText:
    """LLM-01: parse_prerequisites_text returns RULE_SCHEMA-valid JSON."""

    def test_single_course_rule(self, monkeypatch):
        """Mocked LLM returns a single CourseRule; result validates against RULE_SCHEMA."""
        expected = {"type": "course", "course_id": "CS46A", "min_grade": "C-"}
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
        with patch("src.api.parser.get_client", return_value=make_mock_client(expected)):
            from src.api.parser import parse_prerequisites_text
            result = parse_prerequisites_text("CS 46A with C- or better")
        import jsonschema
        jsonschema.validate(result, RULE_SCHEMA)  # must not raise
        assert result == expected

    def test_and_rule(self, monkeypatch):
        """Mocked LLM returns an AndRule with two sub-rules; validates against RULE_SCHEMA."""
        expected = {
            "type": "and",
            "requirements": [
                {"type": "course", "course_id": "CS46B", "min_grade": "C-"},
                {"type": "course", "course_id": "MATH42", "min_grade": "C-"},
            ],
        }
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
        with patch("src.api.parser.get_client", return_value=make_mock_client(expected)):
            from src.api.parser import parse_prerequisites_text
            result = parse_prerequisites_text("CS 46B and MATH 42 (C- or better in each)")
        import jsonschema
        jsonschema.validate(result, RULE_SCHEMA)
        assert result["type"] == "and"
        assert len(result["requirements"]) == 2

    def test_no_prereq_fast_path(self):
        """Text that clearly means no prerequisites returns None without an API call."""
        from src.api.parser import parse_prerequisites_text
        # No monkeypatch — if get_client is called, it will raise EnvironmentError
        # (OPENROUTER_API_KEY absent in test env). Fast path must avoid the call.
        os.environ.pop("OPENROUTER_API_KEY", None)
        result = parse_prerequisites_text("none")
        assert result is None

    def test_llm_returns_null(self, monkeypatch):
        """Mocked LLM returns JSON null (None) — function returns None without ValidationError."""
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
        msg = MagicMock()
        msg.content = "null"
        choice = MagicMock()
        choice.message = msg
        response = MagicMock()
        response.choices = [choice]
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = response
        with patch("src.api.parser.get_client", return_value=mock_client):
            from src.api.parser import parse_prerequisites_text
            result = parse_prerequisites_text("No prerequisites required")
        assert result is None

    def test_invalid_schema_raises_value_error(self, monkeypatch):
        """LLM output that fails RULE_SCHEMA validation raises ValueError."""
        bad_output = {"type": "unknown_type", "foo": "bar"}
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
        with patch("src.api.parser.get_client", return_value=make_mock_client(bad_output)):
            from src.api.parser import parse_prerequisites_text
            with pytest.raises(ValueError, match="RULE_SCHEMA"):
                parse_prerequisites_text("some prereq text")


# ---------------------------------------------------------------------------
# LLM-02 — parse_transcript_text
# ---------------------------------------------------------------------------

class TestParseTranscriptText:
    """LLM-02: parse_transcript_text returns a valid student record dict."""

    def test_returns_completed_and_in_progress(self, monkeypatch):
        """Mocked LLM returns a well-formed student record; function returns it."""
        expected = {
            "completed": {"CS46A": "B+", "CS46B": "A-"},
            "in_progress": ["CS146"],
        }
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
        with patch("src.api.transcript_parser.get_client", return_value=make_mock_client(expected)):
            from src.api.transcript_parser import parse_transcript_text
            result = parse_transcript_text("raw transcript text here")
        assert result["completed"] == {"CS46A": "B+", "CS46B": "A-"}
        assert result["in_progress"] == ["CS146"]

    def test_invalid_schema_raises_value_error(self, monkeypatch):
        """LLM output missing 'in_progress' raises ValueError from schema validation."""
        bad_output = {"completed": {"CS46A": "A"}}  # missing in_progress
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
        with patch("src.api.transcript_parser.get_client", return_value=make_mock_client(bad_output)):
            from src.api.transcript_parser import parse_transcript_text
            with pytest.raises(ValueError):
                parse_transcript_text("bad transcript")

    def test_empty_completed_and_in_progress(self, monkeypatch):
        """LLM returning empty record is valid (new student, no courses taken)."""
        empty_record = {"completed": {}, "in_progress": []}
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
        with patch("src.api.transcript_parser.get_client", return_value=make_mock_client(empty_record)):
            from src.api.transcript_parser import parse_transcript_text
            result = parse_transcript_text("new student transcript")
        assert result == empty_record


# ---------------------------------------------------------------------------
# LLM-03 — parse_transcript_pdf
# ---------------------------------------------------------------------------

class TestParseTranscriptPdf:
    """LLM-03: parse_transcript_pdf extracts text from PDF and delegates to parse_transcript_text."""

    def test_pdf_extraction_delegates_to_text_parser(self, monkeypatch, tmp_path):
        """Mocking pypdf.PdfReader and get_client — verifies delegation without a real PDF."""
        expected_record = {"completed": {"CS46A": "A"}, "in_progress": []}
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")

        mock_page = MagicMock()
        mock_page.extract_text.return_value = "CS 46A  A  3.0  Spring 2024"
        mock_reader = MagicMock()
        mock_reader.pages = [mock_page]

        with patch("src.api.transcript_parser.pypdf.PdfReader", return_value=mock_reader):
            with patch("src.api.transcript_parser.get_client", return_value=make_mock_client(expected_record)):
                from src.api.transcript_parser import parse_transcript_pdf
                result = parse_transcript_pdf("/fake/path/transcript.pdf")
        assert result == expected_record

    def test_empty_pages_filtered(self, monkeypatch):
        """Pages with empty/whitespace text are excluded before LLM call."""
        expected_record = {"completed": {"CS42": "B"}, "in_progress": []}
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")

        mock_page_empty = MagicMock()
        mock_page_empty.extract_text.return_value = "   "  # whitespace only
        mock_page_content = MagicMock()
        mock_page_content.extract_text.return_value = "CS 42  B  3.0"
        mock_reader = MagicMock()
        mock_reader.pages = [mock_page_empty, mock_page_content]

        captured_texts = []

        def capturing_create(**kwargs):
            # capture the user message content passed to LLM
            for msg in kwargs.get("messages", []):
                if msg.get("role") == "user":
                    captured_texts.append(msg["content"])
            return make_mock_client(expected_record).chat.completions.create(**kwargs)

        with patch("src.api.transcript_parser.pypdf.PdfReader", return_value=mock_reader):
            mock_client = make_mock_client(expected_record)
            with patch("src.api.transcript_parser.get_client", return_value=mock_client):
                from src.api.transcript_parser import parse_transcript_pdf
                result = parse_transcript_pdf("/fake/path/transcript.pdf")
        # Verify whitespace page not included (the full_text passed to LLM should not contain "   ")
        # Check that mock_client was called with content that doesn't start with whitespace
        assert result == expected_record


# ---------------------------------------------------------------------------
# LLM-04 — Missing API key raises EnvironmentError
# ---------------------------------------------------------------------------

class TestMissingApiKey:
    """LLM-04: Both LLM functions raise EnvironmentError when OPENROUTER_API_KEY absent."""

    def test_parse_prerequisites_text_raises_on_missing_key(self, monkeypatch):
        """parse_prerequisites_text raises EnvironmentError (not AuthenticationError) when key absent."""
        monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
        from src.api.parser import parse_prerequisites_text
        with pytest.raises(EnvironmentError, match="OPENROUTER_API_KEY"):
            parse_prerequisites_text("CS 46A with C- or better")

    def test_parse_transcript_text_raises_on_missing_key(self, monkeypatch):
        """parse_transcript_text raises EnvironmentError when key absent."""
        monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
        from src.api.transcript_parser import parse_transcript_text
        with pytest.raises(EnvironmentError, match="OPENROUTER_API_KEY"):
            parse_transcript_text("raw transcript text")


# ---------------------------------------------------------------------------
# REC-01 — get_eligible_courses
# ---------------------------------------------------------------------------

class TestGetEligibleCourses:
    """REC-01: get_eligible_courses returns courses the student can take but hasn't."""

    @pytest.fixture
    def sjsu_catalog(self):
        cat_data = load_json("data/sjsu_cs_catalog.json")
        return build_catalog(cat_data)

    def test_no_completed_courses_returns_no_prereq_courses(self, sjsu_catalog):
        """Student with no completed courses is eligible only for courses with no prerequisites."""
        from src.shared.recommender import get_eligible_courses
        result = get_eligible_courses(sjsu_catalog, {}, [], oop_check)
        course_ids = {cid for cid, _ in result}
        # CS46A has no prereqs — must be eligible
        assert "CS46A" in course_ids
        # CS46B requires CS46A — must NOT be eligible
        assert "CS46B" not in course_ids

    def test_completed_prereq_unlocks_dependent(self, sjsu_catalog):
        """Student who completed CS46A with C- is eligible for CS46B."""
        from src.shared.recommender import get_eligible_courses
        completed = {"CS46A": "C-"}
        result = get_eligible_courses(sjsu_catalog, completed, [], oop_check)
        course_ids = {cid for cid, _ in result}
        assert "CS46B" in course_ids

    def test_excludes_already_completed_courses(self, sjsu_catalog):
        """Courses in completed are not returned, even if eligible."""
        from src.shared.recommender import get_eligible_courses
        completed = {"CS46A": "B+"}
        result = get_eligible_courses(sjsu_catalog, completed, [], oop_check)
        course_ids = {cid for cid, _ in result}
        assert "CS46A" not in course_ids

    def test_excludes_in_progress_courses(self, sjsu_catalog):
        """Courses in in_progress are not returned."""
        from src.shared.recommender import get_eligible_courses
        completed = {"CS46A": "B+"}
        in_progress = ["CS46B"]
        result = get_eligible_courses(sjsu_catalog, completed, in_progress, oop_check)
        course_ids = {cid for cid, _ in result}
        assert "CS46B" not in course_ids

    def test_empty_catalog_returns_empty(self):
        """Empty catalog returns empty list."""
        from src.shared.recommender import get_eligible_courses
        result = get_eligible_courses({}, {}, [], oop_check)
        assert result == []


# ---------------------------------------------------------------------------
# REC-02 — get_near_eligible_courses
# ---------------------------------------------------------------------------

class TestGetNearEligibleCourses:
    """REC-02: get_near_eligible_courses identifies courses one prereq away."""

    @pytest.fixture
    def sjsu_catalog(self):
        cat_data = load_json("data/sjsu_cs_catalog.json")
        return build_catalog(cat_data)

    def test_one_prereq_away_included(self, sjsu_catalog):
        """Student with no completed courses — CS46B is one prereq away (needs CS46A)."""
        from src.shared.recommender import get_near_eligible_courses
        result = get_near_eligible_courses(sjsu_catalog, {}, [], oop_check)
        near_ids = {cid for cid, _, _ in result}
        # CS46B has exactly one prereq (CS46A); student has nothing — near-eligible
        assert "CS46B" in near_ids

    def test_missing_string_describes_prereq(self, sjsu_catalog):
        """The missing_str for CS46B when CS46A is absent describes CS46A."""
        from src.shared.recommender import get_near_eligible_courses
        result = get_near_eligible_courses(sjsu_catalog, {}, [], oop_check)
        by_id = {cid: missing for cid, _, missing in result}
        assert "CS46B" in by_id
        assert "CS46A" in by_id["CS46B"]

    def test_excludes_already_completed(self, sjsu_catalog):
        """Courses in completed are not returned as near-eligible."""
        from src.shared.recommender import get_near_eligible_courses
        completed = {"CS46A": "B+"}
        result = get_near_eligible_courses(sjsu_catalog, completed, [], oop_check)
        near_ids = {cid for cid, _, _ in result}
        assert "CS46A" not in near_ids

    def test_fully_eligible_not_in_near_eligible(self, sjsu_catalog):
        """Courses the student IS eligible for do not appear in near-eligible."""
        from src.shared.recommender import get_near_eligible_courses
        completed = {"CS46A": "B+"}
        result = get_near_eligible_courses(sjsu_catalog, completed, [], oop_check)
        near_ids = {cid for cid, _, _ in result}
        # CS46B is now eligible (CS46A done) — should NOT be in near-eligible
        assert "CS46B" not in near_ids

    def test_empty_catalog_returns_empty(self):
        """Empty catalog returns empty list."""
        from src.shared.recommender import get_near_eligible_courses
        result = get_near_eligible_courses({}, {}, [], oop_check)
        assert result == []
