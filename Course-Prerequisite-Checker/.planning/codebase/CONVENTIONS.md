# Coding Conventions

**Analysis Date:** 2026-04-24

## Naming Patterns

**Files:**
- Lowercase with underscores: `loader.py`, `checker.py`, `models.py`
- Domain-grouped: `src/oop/`, `src/fp/`, `src/api/`, `src/shared/`
- Descriptive module names tied to responsibility: `checker.py` (eligibility logic), `models.py` (class definitions), `parser.py` (LLM integration), `schemas.py` (data validation)

**Functions:**
- Snake_case throughout: `load_json()`, `build_catalog()`, `check_eligibility()`, `parse_catalog()`, `get_eligible_courses()`
- Verb-first naming: `build_*`, `check_*`, `parse_*`, `load_*`, `get_*`
- Descriptive: names clearly indicate purpose (`build_rule()`, `check_eligibility()`, `parse_prerequisites_text()`)

**Variables:**
- Snake_case: `catalog_data`, `completed`, `in_progress`, `oop_catalog`, `fp_catalog`
- Prefixes for type distinction: `oop_` and `fp_` prefix when differentiating paradigm implementations
- Clear abbreviations: `_data` suffix for raw input data, `_catalog` for processed collections

**Types/Classes:**
- PascalCase: `Course`, `Rule`, `CourseRule`, `AndRule`, `OrRule`, `StudentRecord`, `CourseInfo`
- Descriptive class names reflecting responsibility in class hierarchy

## Code Style

**Formatting:**
- No explicit linter/formatter config detected (no `.pylintrc`, `.flake8`, `pyproject.toml`)
- Inferred style from existing code: 4-space indentation (Python standard)
- Module docstrings present and descriptive: `"""OOP eligibility checker — uses the Rule class hierarchy."""`
- Single-line function docstrings in stubs: `"""Recursively build a Rule object from JSON data."""`

**Linting:**
- Not detected in repository

## Import Organization

**Order:**
1. Standard library: `import json`, `import os`
2. Third-party: `from openai import OpenAI`, `from docx import Document`, `from dotenv import load_dotenv`
3. Local: `from src.shared.loader import load_json`, `from src.oop.checker import ...`

**Path Aliases:**
- Absolute imports from project root: `from src.shared.loader import load_json`
- No local alias configuration detected (no `@` paths or `PYTHONPATH` config)

## Error Handling

**Patterns:**
- Not extensively demonstrated in stubs, but `load_json()` uses direct file opening without explicit error handling
- Functions return tuples for error/success indication: `check_eligibility()` returns `(eligible, reason)` where second value implies error context
- TODO comments indicate incomplete error handling: `# TODO: Implement LLM call` in `parser.py`

## Logging

**Framework:** Not detected — likely relies on `print()` or standard output

**Patterns:**
- No logging imports or calls in existing code
- Docstrings serve as primary documentation

## Comments

**When to Comment:**
- Module-level docstrings required: every `.py` file starts with triple-quote description
- Inline comments minimal — code clarity preferred
- TODO comments used for unimplemented features: `# TODO: Implement` in `parser.py` and `recommender.py`

**JSDoc/TSDoc:**
- Not applicable (Python project)
- Function docstrings present: `"""[Description]."""` format

## Function Design

**Size:** Not restricted by config; stubs are intentionally minimal

**Parameters:** 
- Explicit naming: `course`, `completed`, `in_progress` clearly indicate data types and intent
- Tuple vs list distinction: OOP uses `[]` (list) for `in_progress`, FP uses `()` (tuple) for immutability
- Positional parameters preferred (no `**kwargs` detected)

**Return Values:**
- Tuple returns for multiple values: `check_eligibility()` returns `(eligible, reason)` tuple
- Consistent across paradigm implementations

## Module Design

**Exports:**
- Public functions prefixed with simple names: `load_json()`, `check_eligibility()`
- Private/utility functions not marked with `_` prefix (all functions public)

**Barrel Files:**
- `__init__.py` files present but empty (no re-exports observed)
- `src/__init__.py`, `tests/__init__.py`, `src/oop/__init__.py`, `src/fp/__init__.py` exist but contain no imports

---

*Convention analysis: 2026-04-24*
