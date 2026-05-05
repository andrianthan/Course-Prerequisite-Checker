# Codebase Structure

**Analysis Date:** 2026-04-24

## Directory Layout

```
Course-Prerequisite-Checker/
├── src/                    # Main implementation
│   ├── oop/                # Object-oriented paradigm implementation
│   │   ├── __init__.py
│   │   ├── models.py       # Course, Rule, AndRule, OrRule class definitions
│   │   └── checker.py      # OOP eligibility checker functions
│   ├── fp/                 # Functional programming paradigm implementation
│   │   ├── __init__.py
│   │   ├── types.py        # Immutable dataclass definitions
│   │   └── checker.py      # Pure function eligibility checker
│   ├── api/                # LLM integration for parsing
│   │   ├── __init__.py
│   │   ├── parser.py       # Prerequisite text → JSON rule parser
│   │   └── transcript_parser.py  # Transcript → student record parser
│   └── shared/             # Shared utilities for both implementations
│       ├── __init__.py
│       ├── schemas.py      # JSON schema definitions (RULE_SCHEMA)
│       ├── loader.py       # File I/O for catalogs and student records
│       └── recommender.py  # Course recommendation engine
├── tests/                  # Test suite (both implementations must pass)
│   ├── __init__.py
│   └── test_checker.py     # Shared test cases for OOP and FP implementations
├── data/                   # Sample data files (JSON)
│   ├── sample_catalog.json          # Minimal catalog (CS46A, CS46B, CS146, CS152, CS160, MATH42)
│   ├── sample_student.json          # Example student record
│   └── sjsu_cs_catalog.json         # Full SJSU CS program catalog with prerequisites
├── .planning/              # GSD planning artifacts
│   └── codebase/
│       ├── ARCHITECTURE.md
│       └── STRUCTURE.md
├── .env.example            # Example environment config (OPENROUTER_API_KEY)
├── .gitignore              # Standard Python .gitignore
├── requirements.txt        # Python dependencies (pytest, openai, python-dotenv)
├── generate_plan_docx.py   # Utility to generate project plan DOCX file
├── README.md               # Project overview
└── PROJECT_PLAN.docx       # Generated project plan document
```

## Directory Purposes

**src/oop/:**
- Purpose: Object-oriented implementation comparing imperative design with mutable state
- Contains: Course class, Rule class hierarchy (AndRule, OrRule, CourseRule subclasses), OOP checker functions
- Key files: `models.py` (class definitions), `checker.py` (build_rule, build_catalog, check_eligibility)

**src/fp/:**
- Purpose: Functional programming implementation comparing declarative design with immutable data
- Contains: Immutable dataclass definitions for rules and student records, pure function implementations
- Key files: `types.py` (CourseRule, AndRule, OrRule, StudentRecord, CourseInfo dataclasses), `checker.py` (evaluate_rule, check_eligibility, parse_rule, parse_catalog)

**src/api/:**
- Purpose: LLM-powered natural language parsing for prerequisites and transcripts
- Contains: OpenRouter client initialization, LLM prompts and parsing logic
- Key files: `parser.py` (parse_prerequisites_text), `transcript_parser.py` (parse_transcript_text, parse_transcript_pdf)

**src/shared/:**
- Purpose: Common utilities and schemas shared by both paradigm implementations
- Contains: JSON schema definitions, file loaders, recommendation engine
- Key files: `schemas.py` (RULE_SCHEMA with oneOf validation), `loader.py` (load_json, load_catalog, load_student), `recommender.py` (get_eligible_courses, get_near_eligible_courses - stubs)

**tests/:**
- Purpose: Shared test suite validating both implementations
- Contains: Pytest fixtures, test classes organized by scenario (NoPrerequisites, SimpleRule, AndRule, OrRule)
- Key files: `test_checker.py` (40+ test methods covering both paradigms)

**data/:**
- Purpose: Sample data files for testing and demonstration
- Contains: JSON catalogs and student records in format matching RULE_SCHEMA
- Key files:
  - `sample_catalog.json`: Minimal 6-course catalog with simple and nested prerequisites
  - `sample_student.json`: Example student with completed and in-progress courses
  - `sjsu_cs_catalog.json`: Real SJSU CS program catalog with 50+ courses and natural language prerequisite text

**.planning/codebase/:**
- Purpose: GSD analysis documents
- Generated: Yes (created by GSD mapper)
- Committed: Yes (included in version control)

## Key File Locations

**Entry Points:**
- `src/oop/checker.py`: `check_eligibility(course, completed, in_progress)` - OOP paradigm entry
- `src/fp/checker.py`: `check_eligibility(course, completed, in_progress)` - FP paradigm entry
- `tests/test_checker.py`: Test fixtures and test classes (pytest entry point)

**Configuration:**
- `.env`: Environment variables (must set OPENROUTER_API_KEY for API parsers)
- `.env.example`: Example configuration template
- `requirements.txt`: Python package dependencies (pytest, openai, python-dotenv, typing_extensions)

**Core Logic:**
- `src/oop/models.py`: Rule class hierarchy, Course class definition
- `src/oop/checker.py`: build_rule() (recursive Rule builder), check_eligibility() (eligibility evaluation)
- `src/fp/types.py`: Immutable rule dataclasses, StudentRecord, CourseInfo
- `src/fp/checker.py`: evaluate_rule() (pure recursive evaluator), check_eligibility() (FP eligibility)
- `src/shared/schemas.py`: RULE_SCHEMA with JSON validation structure

**Testing:**
- `tests/test_checker.py`: All test cases (Pytest fixtures: catalog_data, oop_catalog, fp_catalog)
- `data/sample_catalog.json`: Catalog used in tests

**API Integration:**
- `src/api/parser.py`: parse_prerequisites_text() - LLM call to convert natural language to JSON rules
- `src/api/transcript_parser.py`: parse_transcript_text(), parse_transcript_pdf() - LLM parsing of student transcripts

## Naming Conventions

**Files:**
- Module naming: snake_case (models.py, checker.py, schemas.py, loader.py)
- Python files: .py extension
- Test files: test_*.py (test_checker.py)
- Data files: descriptive names with .json extension (sample_catalog.json, sjsu_cs_catalog.json)

**Directories:**
- Package directories: snake_case (oop, fp, api, shared, tests, data)
- Convention: Python packages are lowercase directories containing __init__.py

**Classes:**
- PascalCase (Course, Rule, AndRule, OrRule, CourseRule, StudentRecord, CourseInfo)
- Used in: `src/oop/models.py`, `src/fp/types.py`

**Functions:**
- snake_case (build_rule, check_eligibility, evaluate_rule, load_json, parse_prerequisites_text)
- Convention: descriptor verbs (build_, check_, parse_, load_)

**Variables:**
- snake_case (completed, in_progress, catalog_data, eligible, min_grade)
- Constants: UPPERCASE (RULE_SCHEMA, CATALOG_PATH)

**Data Structure Keys:**
- snake_case in JSON (course_id, min_grade, prerequisites, requirements, completed, in_progress, student_id)
- Matches JSON schema definitions in `src/shared/schemas.py`

## Where to Add New Code

**New Feature (e.g., grade comparison logic):**
- Primary code: Both `src/oop/checker.py` and `src/fp/checker.py` must implement same logic
- Tests: Add test class and test methods to `tests/test_checker.py`
- Shared utilities: If logic is common, implement once in `src/shared/` module

**New Check Type (e.g., GPA requirement rule):**
- OOP: Add GpaRule class to `src/oop/models.py`, update build_rule() in checker.py
- FP: Add @dataclass GpaRule to `src/fp/types.py`, update parse_rule() in checker.py
- Schema: Update RULE_SCHEMA in `src/shared/schemas.py` with new oneOf option
- Tests: Add TestGpaRule class to `tests/test_checker.py` with OOP and FP test methods

**New Parser (e.g., course outline PDF parser):**
- Implementation: Create `src/api/outline_parser.py` with parse_outline_pdf() function
- Dependencies: Use OpenRouter client pattern from existing api/ modules
- Testing: Add integration test importing and calling new parser

**Utilities for Both Implementations:**
- Location: `src/shared/` - Create module if needed (e.g., shared/grade_utils.py)
- Pattern: Pure functions with no paradigm-specific logic; used by both oop/ and fp/ checkers

**Testing Improvements:**
- Unit tests: Expand `tests/test_checker.py` with new test classes
- Fixtures: Add new fixtures to test_checker.py for additional scenarios
- Test data: Add new JSON files to `data/` for complex test cases

## Special Directories

**data/:**
- Purpose: Test fixtures and sample data
- Generated: No (manually created catalog files)
- Committed: Yes
- Format: JSON files following RULE_SCHEMA for prerequisites

**.planning/codebase/:**
- Purpose: GSD codebase analysis documents
- Generated: Yes (created by GSD mapper agent)
- Committed: Yes (tracks analysis over time)

**.git/:**
- Purpose: Version control metadata
- Generated: Yes (git repository)
- Committed: N/A

---

*Structure analysis: 2026-04-24*
