# Architecture

**Analysis Date:** 2026-04-24

## Pattern Overview

**Overall:** Dual-paradigm comparison architecture with pluggable implementations

**Key Characteristics:**
- Two independent implementations (OOP and FP) behind identical interfaces
- Shared data layer for catalog and student record persistence
- Composable prerequisite rules supporting nested AND/OR logic
- LLM-powered natural language parsing for prerequisites and transcripts
- Common test suite validating both paradigm implementations against same specifications

## Layers

**API Layer (LLM Integration):**
- Purpose: Parse natural-language prerequisite descriptions and student transcripts into structured data
- Location: `src/api/`
- Contains: OpenRouter client setup, LLM prompting logic
- Depends on: OpenAI Python client, dotenv for configuration
- Used by: Manual workflows, future frontend/CLI integrations
- Components:
  - `src/api/parser.py`: Converts free-text prerequisites (e.g., "CS46A with C- or better") to JSON rule objects
  - `src/api/transcript_parser.py`: Extracts student course history and grades from informal transcript text or PDF

**OOP Implementation Layer:**
- Purpose: Object-oriented approach with mutable state and method dispatch
- Location: `src/oop/`
- Contains: Class hierarchies for courses and rules, stateful checker logic
- Depends on: `src/shared/` for data loading and schemas
- Used by: Test suite validating OOP paradigm
- Components:
  - `src/oop/models.py`: Class definitions (Course, Rule base class, CourseRule, AndRule, OrRule)
  - `src/oop/checker.py`: Builder pattern for rules from JSON, eligibility evaluation using method overrides

**FP Implementation Layer:**
- Purpose: Functional programming approach with immutable data and pure functions
- Location: `src/fp/`
- Contains: Immutable dataclass definitions, pure functions for rule evaluation
- Depends on: `src/shared/` for data loading and schemas
- Used by: Test suite validating FP paradigm
- Components:
  - `src/fp/types.py`: Immutable dataclasses (CourseRule, AndRule, OrRule, StudentRecord, CourseInfo)
  - `src/fp/checker.py`: Pure functions (evaluate_rule, check_eligibility, parse_rule, parse_catalog)

**Shared Utilities Layer:**
- Purpose: Common data handling, schemas, and business logic shared by both implementations
- Location: `src/shared/`
- Contains: JSON schema validation, file I/O, recommendation engine logic
- Depends on: Python standard library (json, typing)
- Used by: OOP and FP checkers, API parsers
- Components:
  - `src/shared/schemas.py`: JSON schema definitions for prerequisite rules and course catalogs (oneOf pattern for rule types)
  - `src/shared/loader.py`: File I/O utilities for loading catalogs and student records
  - `src/shared/recommender.py`: Course recommendation engine (stub) - finds eligible and near-eligible courses

**Test Layer:**
- Purpose: Validate both implementations against identical scenarios
- Location: `tests/test_checker.py`
- Contains: Pytest fixtures and test classes for prerequisite checking logic
- Depends on: Both `src/oop/` and `src/fp/` implementations, shared loader
- Components: TestNoPrerequisites, TestSimpleCourseRule, TestAndRule, TestOrRule classes

## Data Flow

**Prerequisite Eligibility Check (Primary Flow):**

1. Student provides: completed_courses (dict: course_id → grade), in_progress_courses (list)
2. Check system loads: course_catalog (Course objects or CourseInfo dataclasses)
3. For target course, retrieve: prerequisite rule structure (nested Rule objects or Rule dataclass)
4. Evaluate rule recursively:
   - CourseRule: check if course_id in completed_courses AND grade >= min_grade (if specified)
   - AndRule: all sub-rules must evaluate to true
   - OrRule: at least one sub-rule must evaluate to true
5. Return: (eligible: bool, details: explanation of decision)

**Natural Language Parsing Flow (API Usage):**

1. Input: Raw prerequisite text from catalog (e.g., "CS46A with C- or better, or equivalent")
2. Send to OpenRouter LLM: "Convert this to a JSON rule object matching this schema"
3. Parse LLM response: Validate against RULE_SCHEMA in `src/shared/schemas.py`
4. Store: Structured rule object in catalog
5. Use: Pass rule to eligibility checker (OOP or FP)

**Transcript Parsing Flow (API Usage):**

1. Input: Transcript image (PDF) or text (unofficial transcript)
2. Extract text: OCR/PDF parsing → raw transcript text
3. Send to OpenRouter LLM: "Extract student ID, courses, grades from this transcript"
4. Parse LLM response: Validate structure (student_id, completed dict, in_progress list)
5. Use: Input to eligibility checker

**State Management:**

- OOP: Rule objects hold state (sub-rules, course references) - evaluated via recursive method calls
- FP: Dataclasses represent rules immutably - evaluated via pure recursive functions
- Student record: Immutable in both approaches (dict/tuple for completed/in_progress)
- No global state in either implementation - all state is local to function/method calls

## Key Abstractions

**Rule Abstraction:**
- Purpose: Represent prerequisite requirements (single course, AND combinations, OR combinations)
- Examples: 
  - OOP: `src/oop/models.py` - Rule (base class), CourseRule, AndRule, OrRule
  - FP: `src/fp/types.py` - @dataclass CourseRule, AndRule, OrRule
- Pattern: Composite pattern (OOP) / algebraic data types (FP) enabling nested rule structures

**Course Abstraction:**
- Purpose: Represent a course with its metadata and prerequisite rule
- Examples:
  - OOP: `src/oop/models.py` - Course class
  - FP: `src/fp/types.py` - CourseInfo dataclass
- Pattern: Value object in OOP, immutable record in FP

**StudentRecord Abstraction:**
- Purpose: Represent a student's academic history (completed and in-progress courses)
- Examples: FP uses `src/fp/types.py` StudentRecord dataclass; OOP uses dict/list directly
- Pattern: Formal value object in FP, informal dictionary representation in OOP

**Catalog Abstraction:**
- Purpose: Container for all courses with prerequisites
- Format: Dict[course_id: str, Course/CourseInfo] after parsing
- Pattern: Dictionary lookup for O(1) course retrieval

## Entry Points

**OOP Eligibility Checker:**
- Location: `src/oop/checker.py`
- Triggers: Direct function calls from tests or future UI/API
- Responsibilities:
  - `build_rule(rule_data)`: Recursively construct Rule object hierarchy from JSON
  - `build_catalog(catalog_data)`: Build dict of Course objects from JSON catalog
  - `check_eligibility(course, completed, in_progress)`: Return (bool, explanation) tuple

**FP Eligibility Checker:**
- Location: `src/fp/checker.py`
- Triggers: Direct function calls from tests or future UI/API
- Responsibilities:
  - `parse_rule()`: Recursively construct Rule dataclass hierarchy from JSON
  - `parse_catalog()`: Build dict of CourseInfo dataclasses from JSON catalog
  - `check_eligibility()`: Return (bool, explanation) tuple

**LLM Parser (Prerequisite):**
- Location: `src/api/parser.py`
- Triggers: Manual workflow to convert raw catalog text to structured rules
- Responsibilities: `parse_prerequisites_text(text)` → JSON rule object validated against RULE_SCHEMA

**LLM Parser (Transcript):**
- Location: `src/api/transcript_parser.py`
- Triggers: Manual workflow to extract student data from transcripts
- Responsibilities:
  - `parse_transcript_text(text)` → StudentRecord JSON
  - `parse_transcript_pdf(pdf_path)` → StudentRecord JSON (includes PDF text extraction)

**Data Loader:**
- Location: `src/shared/loader.py`
- Triggers: Test setup, checker initialization
- Responsibilities: `load_json()`, `load_catalog()`, `load_student()`

## Error Handling

**Strategy:** Exceptions propagated to caller; validation delegated to JSON schema

**Patterns:**
- FileNotFoundError: Raised by loader if catalog/student JSON missing
- JSONDecodeError: Raised by loader if JSON malformed
- Schema validation: JSON schema RULE_SCHEMA used to validate prerequisite structures (external tool - not yet integrated)
- OpenAI API errors: Caught and logged in api/ modules (stub implementation)
- Grade comparison: Caller responsible for passing valid grade strings; no validation in checker yet

## Cross-Cutting Concerns

**Logging:** None currently implemented; all state implicit in return values

**Validation:** 
- Input validation: None enforced at checker boundary (stubs)
- JSON validation: RULE_SCHEMA defines valid prerequisite rule structures
- Grade validation: No validation that grade strings are comparable (assumes "C-", "B", "A" format)

**Authentication:** 
- None required for local eligibility checking
- OpenRouter API key required for LLM parsers: loaded from `.env` OPENROUTER_API_KEY

---

*Architecture analysis: 2026-04-24*
