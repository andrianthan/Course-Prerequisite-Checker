# Testing Patterns

**Analysis Date:** 2026-04-24

## Test Framework

**Runner:**
- pytest >= 7.0.0
- Config: No explicit pytest.ini or pyproject.toml with pytest config detected

**Assertion Library:**
- pytest built-in assertions: `assert eligible is True`, `assert eligible is False`

**Run Commands:**
```bash
pytest tests/test_checker.py                # Run all tests
pytest tests/test_checker.py -v             # Verbose output
pytest tests/test_checker.py --tb=short     # Custom traceback (inferred)
```

## Test File Organization

**Location:**
- Tests co-located with source in separate `tests/` directory (not co-located with source files)
- Single shared test file: `tests/test_checker.py` runs against both implementations

**Naming:**
- File: `test_checker.py` (test_ prefix)
- Test classes: `TestNoPrerequisites`, `TestSimpleCourseRule`, `TestAndRule`, `TestOrRule` (Test prefix + descriptive suffix)
- Test methods: `test_oop()`, `test_fp()`, `test_oop_eligible()`, `test_oop_not_eligible()` (test_ prefix + scenario descriptor)

**Structure:**
```
tests/
├── __init__.py         # Empty
└── test_checker.py     # Shared test suite for OOP and FP implementations
```

## Test Structure

**Suite Organization:**
```python
class TestNoPrerequisites:
    """Course with no prerequisites — always eligible."""
    
    def test_oop(self, oop_catalog):
        eligible, _ = oop_check(oop_catalog["CS46A"], {}, [])
        assert eligible is True
    
    def test_fp(self, fp_catalog):
        eligible, _ = fp_check(fp_catalog["CS46A"], {}, ())
        assert eligible is True
```

**Patterns:**
- Test classes group related scenarios: `TestNoPrerequisites`, `TestSimpleCourseRule`, `TestAndRule`, `TestOrRule`
- Parallel test methods for each paradigm within same class: `test_oop()` and `test_fp()` test identical scenarios
- Class-level docstrings explain test purpose: `"""Course with no prerequisites — always eligible."""`
- Setup: Fixture-based (see Fixtures section below)
- Teardown: Not required (stateless tests, no cleanup)
- Assertion pattern: Direct boolean assertions: `assert eligible is True`, `assert eligible is False`

## Mocking

**Framework:** Not required — tests use real fixture data (loaded JSON)

**Patterns:**
- No mocking detected; tests directly invoke implementation functions with fixture data
- Fixtures provide test data instead of mocks: `@pytest.fixture def oop_catalog(catalog_data):`

**What to Mock:**
- File I/O: Use fixtures with pre-loaded data (current approach)
- External APIs: Not tested yet; `parser.py` calls are stubs (TODO)

**What NOT to Mock:**
- Core eligibility logic: Tests exercise real implementations
- Data structures: Use actual dataclass/class instances
- Helper functions: `load_json()` invoked directly within fixtures

## Fixtures and Factories

**Test Data:**
```python
@pytest.fixture
def catalog_data():
    return load_json(CATALOG_PATH)

@pytest.fixture
def oop_catalog(catalog_data):
    return oop_build_catalog(catalog_data)

@pytest.fixture
def fp_catalog(catalog_data):
    return fp_parse_catalog(catalog_data)
```

**Location:**
- Defined in `tests/test_checker.py` alongside test classes
- Load shared JSON data from `data/sample_catalog.json`
- Three-level fixture hierarchy: raw data → paradigm-specific processed form

**Fixture Dependencies:**
- `oop_catalog` and `fp_catalog` depend on `catalog_data`
- Allows parameterized testing across both implementations
- File loading (`load_json()`) wrapped in fixture for reuse

## Coverage

**Requirements:** Not enforced (no coverage config detected)

**View Coverage:**
```bash
pytest tests/test_checker.py --cov=src --cov-report=html  # Generate HTML coverage report
```

## Test Types

**Unit Tests:**
- Scope: Core eligibility logic (`check_eligibility()` function)
- Approach: Function-level testing with minimal dependencies
- Paradigm coverage: Both OOP and FP implementations tested identically
- Example: `TestSimpleCourseRule.test_oop_eligible()` tests single prerequisite satisfaction

**Integration Tests:**
- Not separated from unit tests (all in `test_checker.py`)
- Implicit: Tests integrate fixture setup (`load_json()` + `build_catalog()`/`parse_catalog()`) with eligibility checking
- Scope: Catalog loading + eligibility logic together

**E2E Tests:**
- Not implemented
- Would require: Full user input flow, LLM integration (currently stubbed)

## Common Patterns

**Async Testing:**
- Not applicable (no async code in project)

**Error Testing:**
```python
def test_oop_not_eligible(self, oop_catalog):
    eligible, _ = oop_check(oop_catalog["CS46B"], {}, [])
    assert eligible is False
```
Pattern: Negative cases tested alongside positive cases (`eligible is False`)
- Second return value (`_`) ignored (reserved for error reason/message)
- No exception assertions (eligibility returns boolean, not throws)

## Test Data

**Sample Catalog:** `data/sample_catalog.json`
- Contains course definitions: `CS46A`, `CS46B`, `CS146`, `CS160`
- Rule hierarchy represented in JSON (AND/OR/course requirements)
- Shared across both OOP and FP fixture implementations

**Student Transcript:**
- Simple dict format: `{"CS46A": "B+", "MATH42": "A"}`
- In-progress courses: empty list `[]` (OOP) or tuple `()` (FP)
- No student JSON files found in `data/` yet (recommender functions are stubs)

## Test Organization by Paradigm

**Shared Test Suite:**
- Single `test_checker.py` contains all tests
- Parallel methods for OOP and FP: both must pass identical assertions
- Forces feature parity between implementations
- Eliminates test duplication while maintaining separate code paths

**Paradigm-Specific Details:**
- OOP tests: `oop_catalog` fixture, `oop_check()` function, list for in-progress `[]`
- FP tests: `fp_catalog` fixture, `fp_check()` function, tuple for in-progress `()`
- Immutability enforced in FP test data (tuples vs lists)

---

*Testing analysis: 2026-04-24*
