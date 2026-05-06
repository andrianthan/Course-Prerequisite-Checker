# Codebase Concerns

**Analysis Date:** 2026-04-24

## Tech Debt

**Incomplete OOP and FP Core Implementations:**
- Issue: All core functions in `src/oop/checker.py` and `src/fp/checker.py` are stubs returning `pass`. Classes in `src/oop/models.py` and `src/fp/types.py` have no implementation (empty bodies).
- Files: `src/oop/models.py`, `src/oop/checker.py`, `src/fp/types.py`, `src/fp/checker.py`
- Impact: Neither implementation is functional. Tests will fail immediately. No eligibility checking works.
- Fix approach: Implement `Rule.evaluate()` and subclass methods in OOP; implement `evaluate_rule()`, `check_eligibility()`, `parse_rule()`, `parse_catalog()` in FP. Populate dataclass fields in `src/fp/types.py`.

**Stub LLM Integration Functions:**
- Issue: `parse_prerequisites_text()` in `src/api/parser.py` and `parse_transcript_text()` + `parse_transcript_pdf()` in `src/api/transcript_parser.py` are marked TODO and return `pass`.
- Files: `src/api/parser.py`, `src/api/transcript_parser.py`
- Impact: Cannot parse natural-language prerequisites or transcripts. Feature depends on these functions but they're unimplemented.
- Fix approach: Implement LLM calls to OpenRouter API. Design prompt templates for parsing prerequisites and transcripts into structured JSON rule objects and student records.

**Stub Recommendation Engine:**
- Issue: `get_eligible_courses()` and `get_near_eligible_courses()` in `src/shared/recommender.py` are marked TODO and return `pass`.
- Files: `src/shared/recommender.py`
- Impact: Cannot recommend courses to students. Feature is referenced in project plan but unimplemented.
- Fix approach: After `check_eligibility()` is implemented, filter catalog for eligible courses and identify "close" courses (one or two requirements away).

**Missing `MinGradeRule` Class:**
- Issue: README.md line 12 documents `MinGradeRule` as a required class, but it does not exist in `src/oop/models.py`. Instead, `min_grade` is a field on `CourseRule`.
- Files: `README.md`, `src/oop/models.py`, `src/shared/schemas.py`
- Impact: Documentation conflicts with implementation schema. Could confuse developers about rule structure.
- Fix approach: Either implement `MinGradeRule` as a separate rule subclass OR remove it from README and clarify that `min_grade` is a field on `CourseRule`.

## Known Bugs

**Test Fixtures Reference Nonexistent Functions:**
- Symptoms: Tests import `oop_check` and `fp_check` but these function names don't exist in their respective modules. Tests will fail at import time.
- Files: `tests/test_checker.py` line 5-6
- Trigger: Run pytest. Import error on first execution.
- Workaround: None until implementation is complete.

**LLM API Key Hardcoded to OpenRouter:**
- Symptoms: Both `src/api/parser.py` and `src/api/transcript_parser.py` hardcode `"https://openrouter.ai/api/v1"` as the OpenAI base_url. If OpenRouter is down or unavailable, these fail silently.
- Files: `src/api/parser.py` line 14, `src/api/transcript_parser.py` line 13
- Trigger: Call parser functions when OpenRouter service is unavailable.
- Workaround: Manually change base_url in source code.

## Security Considerations

**Environment Variable Dependency Without Validation:**
- Risk: Both `src/api/parser.py` and `src/api/transcript_parser.py` call `os.getenv("OPENROUTER_API_KEY")` without checking if the key exists. If missing, API calls will fail with a generic error or send `None` as the key.
- Files: `src/api/parser.py` line 15, `src/api/transcript_parser.py` line 14
- Current mitigation: `.env.example` file exists, but no validation at runtime.
- Recommendations: Add explicit checks: `if not os.getenv("OPENROUTER_API_KEY"): raise ValueError("OPENROUTER_API_KEY not set")`. Document required environment variables in setup section.

**No Input Validation on JSON Data:**
- Risk: `src/shared/loader.py` loads JSON without schema validation. Malformed or malicious catalog/student JSON could cause crashes or unexpected behavior downstream.
- Files: `src/shared/loader.py` line 8-9
- Current mitigation: `src/shared/schemas.py` defines RULE_SCHEMA but is never used (not referenced in loader or checker).
- Recommendations: Add jsonschema validation in `load_catalog()` and `load_student()`. Raise clear errors on schema violations.

**LLM Output Not Validated:**
- Risk: `parse_prerequisites_text()` and `parse_transcript_text()` (when implemented) will accept arbitrary LLM output. If LLM returns malformed JSON, code will crash.
- Files: `src/api/parser.py`, `src/api/transcript_parser.py`
- Current mitigation: None planned.
- Recommendations: Validate LLM responses against RULE_SCHEMA before returning. Implement fallback or re-prompt on validation failure.

## Performance Bottlenecks

**No Caching for Catalog Parsing:**
- Problem: Each call to `check_eligibility()` may reconstruct the entire rule tree from JSON (depending on implementation).
- Files: `src/oop/checker.py`, `src/fp/checker.py`
- Cause: No memoization of parsed rules or catalog.
- Improvement path: Cache parsed catalog after first load. Use functools.lru_cache for rule evaluation if deeply nested.

**LLM API Calls Not Cached:**
- Problem: Parsing the same prerequisite text twice will make two API calls (latency + cost).
- Files: `src/api/parser.py`, `src/api/transcript_parser.py`
- Cause: No caching layer implemented.
- Improvement path: Implement optional redis/memcache layer or simple dict cache keyed by input hash.

## Fragile Areas

**Test Suite Depends on JSON Schema Structure:**
- Files: `tests/test_checker.py`, `data/sample_catalog.json`
- Why fragile: Tests hardcode course IDs and grade expectations (e.g., line 31: `oop_catalog["CS46A"]`). If catalog schema changes, tests must be rewritten. If sample_catalog.json is renamed or moved, tests fail.
- Safe modification: Keep `data/sample_catalog.json` structure stable. Use fixtures or factory functions to generate test data rather than hardcoding IDs.
- Test coverage: No test coverage for invalid catalog structures, missing courses, or malformed rules.

**Manual OpenRouter API Configuration:**
- Files: `src/api/parser.py`, `src/api/transcript_parser.py`
- Why fragile: If OpenRouter API changes (endpoint, auth scheme), both files must be updated simultaneously. No abstraction layer.
- Safe modification: Centralize API client creation in a single factory function in `src/api/__init__.py` or `src/shared/`. Import and reuse.
- Test coverage: No mock tests for API calls. Parser functions cannot be tested without a real API key.

**Grade Comparison Logic Not Yet Implemented:**
- Files: `src/oop/checker.py`, `src/fp/checker.py`, `src/oop/models.py`
- Why fragile: `min_grade` field exists in schema, but grade comparison logic (e.g., is "B+" >= "C-"?) will require careful implementation. Grade ordering (A+ > A > A- > B+ > ... > F) is context-dependent by institution.
- Safe modification: Define a grade scale constant and create a helper function `grade_meets_minimum(earned_grade, min_grade) -> bool` in `src/shared/`. Reuse across OOP and FP.
- Test coverage: No tests exist for grade thresholds yet.

## Scaling Limits

**No Limit on Nested Rule Depth:**
- Current capacity: Sample catalog has 2-3 levels of nesting (AND containing OR). SJSU catalog (`data/sjsu_cs_catalog.json`) may have deeper trees.
- Limit: Python recursion limit (~1000 calls). If rules are deeply nested, `build_rule()` (OOP) or `parse_rule()` (FP) will hit stack overflow.
- Scaling path: Add iterative rule parsing using a stack instead of recursion. Test with deep catalogs.

**Linear Search for Course Eligibility:**
- Current capacity: Sample catalog has ~6 courses. SJSU catalog has ~100+ courses (file size 10.6 KB).
- Limit: Checking eligibility for all courses is O(n) where n = course count. Checking each course rule is O(depth). Total: O(n * depth). With 1000 courses and depth 10, this becomes slow.
- Scaling path: Use course dependency graphs or memoization to avoid re-evaluating the same rule multiple times.

## Dependencies at Risk

**OpenAI SDK with Fragile Configuration:**
- Risk: Code uses `openai>=1.0.0` with custom `base_url` override. OpenAI SDK is actively maintained but breaking changes could occur.
- Impact: If OpenAI SDK major version changes, the base_url parameter syntax may change.
- Migration plan: Pin to stable version (e.g., `openai==1.3.0`) in requirements.txt. Document any SDK assumptions in code. Monitor release notes.

**Missing Dependency for PDF Parsing:**
- Risk: `parse_transcript_pdf()` in `src/api/transcript_parser.py` is documented but `pypdf` (or similar) is not in `requirements.txt`.
- Impact: When implemented, code will crash with ImportError.
- Migration plan: Add `pypdf>=3.0.0` or `pdfplumber>=0.9.0` to requirements.txt and implement PDF text extraction.

## Missing Critical Features

**No Cycle Detection in Prerequisites:**
- Problem: If course A requires B, B requires C, and C requires A, the circular dependency is not detected. This could cause infinite recursion or infinite loops in eligibility checking.
- Blocks: Cannot safely handle recursive prerequisite definitions.
- Implementation: Track visited rules during evaluation. Raise error on re-entry.

**No Support for Course Equivalencies:**
- Problem: Some institutions allow "CS46A OR CS148" as equivalent. Current schema only supports AND/OR of individual courses.
- Blocks: Cannot express "complete any of these three courses" elegantly.
- Implementation: Extend `CourseRule` to accept multiple equivalent course_ids, or create `EquivalenceRule` subclass.

**No Support for Concurrent Enrollment:**
- Problem: `in_progress` parameter is accepted but never used in the implementation. Some prerequisites allow concurrent enrollment (e.g., "take CS146 and CS146L together").
- Blocks: Cannot model concurrent requirements.
- Implementation: Extend rule evaluation to accept `in_progress` and apply special logic for concurrent rules.

## Test Coverage Gaps

**No Tests for Error Cases:**
- What's not tested: Invalid rule structures, missing courses, malformed JSON, missing environment variables, empty catalogs.
- Files: `tests/test_checker.py`
- Risk: Edge cases could crash in production without warning.
- Priority: High

**No Tests for Grade Validation:**
- What's not tested: Grade comparison logic (when implemented). Invalid grades (e.g., "Z"), grade case sensitivity, missing grades.
- Files: `tests/test_checker.py`
- Risk: Grade checks could be incorrect (e.g., "B" treated as < "C-").
- Priority: High

**No Tests for LLM Parsing:**
- What's not tested: Parser functions are stubs; no mock tests exist for `parse_prerequisites_text()` or `parse_transcript_text()`.
- Files: `src/api/parser.py`, `src/api/transcript_parser.py`
- Risk: Parsing could silently fail or return garbage when implemented.
- Priority: Medium (depends on parser implementation)

**No Tests for Recommender Logic:**
- What's not tested: `get_eligible_courses()` and `get_near_eligible_courses()` have no tests.
- Files: `src/shared/recommender.py`
- Risk: Recommendations could be incorrect or missing courses.
- Priority: Medium (depends on recommender implementation)

**No Tests for Deep Nesting:**
- What's not tested: Complex AND/OR combinations. Stress test with deep rule trees.
- Files: `tests/test_checker.py`
- Risk: Performance regression or stack overflow not caught.
- Priority: Low (minor edge case)

---

*Concerns audit: 2026-04-24*
