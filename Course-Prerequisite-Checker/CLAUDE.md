<!-- GSD:project-start source:PROJECT.md -->
## Project

**Course Prerequisite Checker**

A web-based Course Prerequisite Checker for SJSU CS courses, built as a CS152 class project by Andrian Than and Lisa Yu. Students upload their unofficial transcript, pick a target course, and the app says whether they're eligible plus what's missing. Backend implements the same prerequisite-evaluation logic in two paradigms (OOP and FP) so we can compare design tradeoffs in the accompanying paper.

**Core Value:** The demo must show a student uploading a transcript, picking a course, and seeing a correct eligible/not-eligible verdict with explanation — backed by both OOP and FP implementations producing identical results.

### Constraints

- **Timeline:** ~2-3 weeks to demo + paper + slides. Phase granularity must stay coarse.
- **Tech stack (backend):** Python 3, OpenAI SDK pointed at OpenRouter, pytest. Existing code commits to this.
- **Tech stack (web):** FastAPI + React (user choice). Prefer minimal React tooling (Vite) to keep setup time low.
- **Tech stack (PDF parse):** `pypdf` or `pdfplumber` for text extraction before LLM cleanup. Avoid OCR — assume student transcript is text-extractable.
- **Behavior parity:** OOP and FP backends MUST return identical `(eligible, explanation)` for every shared test case. Non-negotiable for paper validity.
- **API key safety:** `.env` is gitignored; never commit keys. `.env.example` already in repo.
- **Demo runs locally:** No deploy. Andrian's laptop must boot the app via two commands (backend + frontend) on demo day.
- **Class grade:** Production polish not required, but visual polish on UI matters because it's a graded demo.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- Python 3.14.3 - All core logic, API clients, tests, data processing
## Runtime
- Python 3.14.3 (available via `python3`)
- Virtual environment (`venv/`) recommended for dependency isolation
- pip
- Lockfile: Not present (requirements.txt only, no `requirements-lock.txt` or `Pipfile.lock`)
## Frameworks
- None - Pure Python with dataclasses and manual implementations
- pytest 7.0.0+ - Unit and integration test framework
- Run via: `pytest`
- openai 1.0.0+ - OpenRouter API client (compatible with OpenAI SDK)
- python-dotenv 1.0.0+ - Environment variable loading from `.env` files
## Key Dependencies
- `openai>=1.0.0` - OpenRouter API client for LLM-powered parsing
- `python-dotenv>=1.0.0` - Loads environment variables from `.env` file
- `pytest>=7.0.0` - Test framework for shared test suite
## Configuration
- Configured via `.env` file (not committed; `.env.example` provided)
- Key variable: `OPENROUTER_API_KEY` - Required for LLM parsing functionality
- No explicit build system (pure Python)
- No `setup.py`, `pyproject.toml`, or build configuration files present
## Data Format
- JSON for course catalogs and student records
- Data files: `data/sample_catalog.json`, `data/sjsu_cs_catalog.json`, `data/sample_student.json`
- JSON schema defined in `src/shared/schemas.py` for rule validation
## Platform Requirements
- Python 3.14.3 or compatible version
- Terminal with bash/zsh for venv activation
- Text editor (no IDE required)
- Python 3.14.3 or compatible
- `OPENROUTER_API_KEY` environment variable must be set
- Network access to `https://openrouter.ai/api/v1` for LLM calls
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Lowercase with underscores: `loader.py`, `checker.py`, `models.py`
- Domain-grouped: `src/oop/`, `src/fp/`, `src/api/`, `src/shared/`
- Descriptive module names tied to responsibility: `checker.py` (eligibility logic), `models.py` (class definitions), `parser.py` (LLM integration), `schemas.py` (data validation)
- Snake_case throughout: `load_json()`, `build_catalog()`, `check_eligibility()`, `parse_catalog()`, `get_eligible_courses()`
- Verb-first naming: `build_*`, `check_*`, `parse_*`, `load_*`, `get_*`
- Descriptive: names clearly indicate purpose (`build_rule()`, `check_eligibility()`, `parse_prerequisites_text()`)
- Snake_case: `catalog_data`, `completed`, `in_progress`, `oop_catalog`, `fp_catalog`
- Prefixes for type distinction: `oop_` and `fp_` prefix when differentiating paradigm implementations
- Clear abbreviations: `_data` suffix for raw input data, `_catalog` for processed collections
- PascalCase: `Course`, `Rule`, `CourseRule`, `AndRule`, `OrRule`, `StudentRecord`, `CourseInfo`
- Descriptive class names reflecting responsibility in class hierarchy
## Code Style
- No explicit linter/formatter config detected (no `.pylintrc`, `.flake8`, `pyproject.toml`)
- Inferred style from existing code: 4-space indentation (Python standard)
- Module docstrings present and descriptive: `"""OOP eligibility checker — uses the Rule class hierarchy."""`
- Single-line function docstrings in stubs: `"""Recursively build a Rule object from JSON data."""`
- Not detected in repository
## Import Organization
- Absolute imports from project root: `from src.shared.loader import load_json`
- No local alias configuration detected (no `@` paths or `PYTHONPATH` config)
## Error Handling
- Not extensively demonstrated in stubs, but `load_json()` uses direct file opening without explicit error handling
- Functions return tuples for error/success indication: `check_eligibility()` returns `(eligible, reason)` where second value implies error context
- TODO comments indicate incomplete error handling: `# TODO: Implement LLM call` in `parser.py`
## Logging
- No logging imports or calls in existing code
- Docstrings serve as primary documentation
## Comments
- Module-level docstrings required: every `.py` file starts with triple-quote description
- Inline comments minimal — code clarity preferred
- TODO comments used for unimplemented features: `# TODO: Implement` in `parser.py` and `recommender.py`
- Not applicable (Python project)
- Function docstrings present: `"""[Description]."""` format
## Function Design
- Explicit naming: `course`, `completed`, `in_progress` clearly indicate data types and intent
- Tuple vs list distinction: OOP uses `[]` (list) for `in_progress`, FP uses `()` (tuple) for immutability
- Positional parameters preferred (no `**kwargs` detected)
- Tuple returns for multiple values: `check_eligibility()` returns `(eligible, reason)` tuple
- Consistent across paradigm implementations
## Module Design
- Public functions prefixed with simple names: `load_json()`, `check_eligibility()`
- Private/utility functions not marked with `_` prefix (all functions public)
- `__init__.py` files present but empty (no re-exports observed)
- `src/__init__.py`, `tests/__init__.py`, `src/oop/__init__.py`, `src/fp/__init__.py` exist but contain no imports
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Two independent implementations (OOP and FP) behind identical interfaces
- Shared data layer for catalog and student record persistence
- Composable prerequisite rules supporting nested AND/OR logic
- LLM-powered natural language parsing for prerequisites and transcripts
- Common test suite validating both paradigm implementations against same specifications
## Layers
- Purpose: Parse natural-language prerequisite descriptions and student transcripts into structured data
- Location: `src/api/`
- Contains: OpenRouter client setup, LLM prompting logic
- Depends on: OpenAI Python client, dotenv for configuration
- Used by: Manual workflows, future frontend/CLI integrations
- Components:
- Purpose: Object-oriented approach with mutable state and method dispatch
- Location: `src/oop/`
- Contains: Class hierarchies for courses and rules, stateful checker logic
- Depends on: `src/shared/` for data loading and schemas
- Used by: Test suite validating OOP paradigm
- Components:
- Purpose: Functional programming approach with immutable data and pure functions
- Location: `src/fp/`
- Contains: Immutable dataclass definitions, pure functions for rule evaluation
- Depends on: `src/shared/` for data loading and schemas
- Used by: Test suite validating FP paradigm
- Components:
- Purpose: Common data handling, schemas, and business logic shared by both implementations
- Location: `src/shared/`
- Contains: JSON schema validation, file I/O, recommendation engine logic
- Depends on: Python standard library (json, typing)
- Used by: OOP and FP checkers, API parsers
- Components:
- Purpose: Validate both implementations against identical scenarios
- Location: `tests/test_checker.py`
- Contains: Pytest fixtures and test classes for prerequisite checking logic
- Depends on: Both `src/oop/` and `src/fp/` implementations, shared loader
- Components: TestNoPrerequisites, TestSimpleCourseRule, TestAndRule, TestOrRule classes
## Data Flow
- OOP: Rule objects hold state (sub-rules, course references) - evaluated via recursive method calls
- FP: Dataclasses represent rules immutably - evaluated via pure recursive functions
- Student record: Immutable in both approaches (dict/tuple for completed/in_progress)
- No global state in either implementation - all state is local to function/method calls
## Key Abstractions
- Purpose: Represent prerequisite requirements (single course, AND combinations, OR combinations)
- Examples: 
- Pattern: Composite pattern (OOP) / algebraic data types (FP) enabling nested rule structures
- Purpose: Represent a course with its metadata and prerequisite rule
- Examples:
- Pattern: Value object in OOP, immutable record in FP
- Purpose: Represent a student's academic history (completed and in-progress courses)
- Examples: FP uses `src/fp/types.py` StudentRecord dataclass; OOP uses dict/list directly
- Pattern: Formal value object in FP, informal dictionary representation in OOP
- Purpose: Container for all courses with prerequisites
- Format: Dict[course_id: str, Course/CourseInfo] after parsing
- Pattern: Dictionary lookup for O(1) course retrieval
## Entry Points
- Location: `src/oop/checker.py`
- Triggers: Direct function calls from tests or future UI/API
- Responsibilities:
- Location: `src/fp/checker.py`
- Triggers: Direct function calls from tests or future UI/API
- Responsibilities:
- Location: `src/api/parser.py`
- Triggers: Manual workflow to convert raw catalog text to structured rules
- Responsibilities: `parse_prerequisites_text(text)` → JSON rule object validated against RULE_SCHEMA
- Location: `src/api/transcript_parser.py`
- Triggers: Manual workflow to extract student data from transcripts
- Responsibilities:
- Location: `src/shared/loader.py`
- Triggers: Test setup, checker initialization
- Responsibilities: `load_json()`, `load_catalog()`, `load_student()`
## Error Handling
- FileNotFoundError: Raised by loader if catalog/student JSON missing
- JSONDecodeError: Raised by loader if JSON malformed
- Schema validation: JSON schema RULE_SCHEMA used to validate prerequisite structures (external tool - not yet integrated)
- OpenAI API errors: Caught and logged in api/ modules (stub implementation)
- Grade comparison: Caller responsible for passing valid grade strings; no validation in checker yet
## Cross-Cutting Concerns
- Input validation: None enforced at checker boundary (stubs)
- JSON validation: RULE_SCHEMA defines valid prerequisite rule structures
- Grade validation: No validation that grade strings are comparable (assumes "C-", "B", "A" format)
- None required for local eligibility checking
- OpenRouter API key required for LLM parsers: loaded from `.env` OPENROUTER_API_KEY
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
