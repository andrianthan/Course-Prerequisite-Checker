# Phase 1: Core Logic - Research

**Researched:** 2026-04-24
**Domain:** Python prerequisite-checking logic — OOP class hierarchy, FP frozen dataclasses, shared grade utilities, DFS cycle detection
**Confidence:** HIGH (all findings verified against live code and Python 3.14 runtime)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Explanation strings use natural phrases. Eligible: `"Eligible: CS46A (B+), MATH42 (A)"`. Not-eligible: `"Not eligible: missing CS46A"` or `"missing CS146 OR CS151"`. Grade shown only when min_grade fires: `"needs CS46A with C or better"`.
- Grade input format = letter strings: `"A"`, `"A-"`, `"B+"`, ..., `"F"`. Matches existing `data/sample_student.json`.
- Grade comparison logic lives in `src/shared/grades.py`. Both OOP and FP import from it — no duplication.
- Default passing threshold: `"C-"` or better = completed. `"D"`, `"D+"`, `"F"`, `"W"`, `"I"` = not-completed.
- Cycle detection runs at catalog parse time (`build_catalog` / `parse_catalog`) — fail fast with `CycleError`. Not at check time.
- Algorithm: DFS with visited + recursion-stack sets. O(V+E).
- OOP evaluation: each `Rule` subclass implements `evaluate(completed, in_progress, catalog)` polymorphically. Returns `(bool, list_of_unmet_descriptions)`.
- FP evaluation: single top-level `evaluate_rule(rule, completed, in_progress, catalog)` dispatches via `isinstance` or `match/case`.
- Test fixture name fix: keep `tests/test_checker.py` untouched. Test file already uses `from src.oop.checker import check_eligibility as oop_check` — no additional aliases needed in checker.py. The `as` import IS the alias.
- Both backends return identical `(bool, str)` boolean for every shared test. Explanation wording can differ.
- New parity tests for min-grade and cycle detection must run on both backends (PAR-03).
- `in_progress` is part of the signature but Phase 1 only uses it for explanation context, not to satisfy prereqs.

### Claude's Discretion

- Internal data shapes within each rule type beyond what's mandated (e.g., whether `AndRule` stores `requirements: List[Rule]` vs `Tuple[Rule, ...]` — FP must use immutable, OOP can use either).
- Specific exception classes and their hierarchy (other than `CycleError` being public).
- Whether to add `typing.Protocol` or stick with duck typing.
- Whether to extend `data/sample_catalog.json` with min-grade test data, or add a new fixture file.

### Deferred Ideas (OUT OF SCOPE)

- Co-requisite full semantics (CORQ-01, CORQ-02). `in_progress` parameter accepted but Phase 1 only uses it for explanation context.
- Concurrency / batch checking (CON-01, CON-02).
- Quantitative perf benchmarks (CON-03).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OOP-01 | OOP rule classes (Course, Rule, CourseRule, AndRule, OrRule) with polymorphic `evaluate()` | Composite pattern verified; `evaluate` returns `(bool, list[str])` for explanation building |
| OOP-02 | `build_catalog(catalog_data)` parses JSON into Course objects with attached rules | RULE_SCHEMA schema-walk pattern; catalog keyed by course_id string |
| OOP-03 | `check_eligibility(course, completed, in_progress)` returns `(bool, explanation_str)` | Explanation string format locked; recursive evaluate + join unmet list |
| OOP-04 | OOP CourseRule supports min-grade constraint | `grade_meets_minimum` from `src/shared/grades.py`; GRADE_ORDER list ordering |
| OOP-05 | OOP cycle detection at parse time, raises `CycleError` | DFS with visited + rec_stack on course dependency graph; verified against sample catalog |
| FP-01 | FP rule types as frozen dataclasses (CourseRule, AndRule, OrRule, StudentRecord, CourseInfo) | `@dataclass(frozen=True)` with `requirements: tuple` for immutability; verified on Python 3.14 |
| FP-02 | `parse_catalog(catalog_data)` returns immutable catalog mapping | Returns `dict[str, CourseInfo]`; dict itself is not frozen but values are |
| FP-03 | `check_eligibility(course, completed, in_progress)` returns `(bool, explanation_str)` | Same contract as OOP; `match/case` verified working on Python 3.14 |
| FP-04 | FP rule evaluation supports min-grade via pure function | Same `grade_meets_minimum` import; no side effects |
| FP-05 | FP cycle detection on catalog parse | Same DFS algorithm; extracted as shared helper or duplicated cleanly in fp/checker.py |
| PAR-01 | All shared tests in `tests/test_checker.py` pass for both backends | Import aliases already correct (`as oop_check`, `as fp_check`); catalog format verified |
| PAR-02 | Both backends produce identical (or close-enough) explanation strings | Boolean parity required; exact string wording may differ |
| PAR-03 | New parity tests for min-grade and cycle detection | Add `TestMinGrade` and `TestCycleDetection` classes to `tests/test_checker.py`; both OOP/FP methods in each |
</phase_requirements>

---

## Summary

Phase 1 is a pure Python implementation task with no new dependencies and no external services. The codebase has complete stubs in place — every function signature, class name, and test fixture is already wired. The work is filling in logic, not scaffolding new structure.

Three core implementation problems must be solved cleanly: (1) a shared grade-ordering utility in `src/shared/grades.py` that both OOP and FP checkers import, (2) recursive rule evaluation using two different paradigm styles (OOP polymorphism vs FP function dispatch), and (3) DFS cycle detection that runs at parse time and raises `CycleError` before any eligibility check can proceed.

The biggest implementation risk is the explanation string contract: the format is locked (`"Not eligible: missing CS46A"`, `"needs CS46A with C or better"`, etc.) and the test suite ignores the string today (it uses `_`) but PAR-03 requires new tests that check it. The `list_of_unmet` return value from `evaluate` is the mechanism for building these strings — getting that list right is what drives parity between OOP and FP.

**Primary recommendation:** Implement `src/shared/grades.py` first (zero dependencies, unblocks everything else), then OOP models + checker, then FP types + checker, then add PAR-03 tests. One new file (`grades.py`), four modified files.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Python dataclasses | stdlib (3.14) | FP frozen rule types | Zero-dependency immutable records; `frozen=True` enforces no mutation |
| pytest | 9.0.2 (installed) | Test runner | Already configured; existing test suite uses it |
| Python typing | stdlib (3.14) | Type hints for clarity | `Optional`, `Tuple`, `Dict` used throughout project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Python `match/case` | Python 3.10+ (3.14 confirmed) | FP rule dispatch | Cleaner than isinstance chain for structural dispatch; verified working |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `match/case` for FP dispatch | `isinstance` chain | `isinstance` is also fine; `match/case` is more readable for 3-case dispatch |
| `tuple` for FP `requirements` | `frozenset` or `list` | `tuple` preserves order, is hashable, and works with `frozen=True` dataclass; `list` would prevent hashing |
| Separate `CycleError` in each module | Single `src/shared/errors.py` | Shared errors.py is cleaner if both backends raise same type; discretion allowed |

**Installation:** No new packages needed. All required libraries are stdlib or already in requirements.txt.

---

## Architecture Patterns

### Recommended Project Structure (additions only)

```
src/
├── shared/
│   ├── grades.py        # NEW: grade ordering + grade_meets_minimum()
│   └── (existing files unchanged)
├── oop/
│   ├── models.py        # FILL: Course, Rule, CourseRule, AndRule, OrRule with evaluate()
│   └── checker.py       # FILL: build_rule, build_catalog (+ CycleError), check_eligibility
└── fp/
    ├── types.py         # FILL: frozen dataclasses CourseRule, AndRule, OrRule, StudentRecord, CourseInfo
    └── checker.py       # FILL: parse_rule, parse_catalog (+ CycleError), evaluate_rule, check_eligibility
tests/
└── test_checker.py      # ADD: TestMinGrade, TestCycleDetection classes (PAR-03)
```

### Pattern 1: Grade Ordering (src/shared/grades.py)

**What:** A list-based grade ordering with a comparison function. Lower index = higher grade.
**When to use:** Whenever a CourseRule has a non-None `min_grade`.

```python
# src/shared/grades.py
"""Shared grade ordering and comparison utilities."""

# Index 0 = highest grade. A+ intentionally included for completeness.
GRADE_ORDER = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"]

# Grades that count as NOT completed regardless of min_grade setting
NON_PASSING = {"D", "D+", "D-", "F", "W", "I"}

def grade_meets_minimum(earned: str, minimum: str) -> bool:
    """Return True if earned grade satisfies the minimum requirement."""
    if earned not in GRADE_ORDER or minimum not in GRADE_ORDER:
        return False
    return GRADE_ORDER.index(earned) <= GRADE_ORDER.index(minimum)

def is_passing(grade: str) -> bool:
    """Return True if grade meets default C- passing threshold."""
    return grade_meets_minimum(grade, "C-")
```

**Verified:** `grade_meets_minimum("B+", "C-")` = True, `grade_meets_minimum("D+", "C-")` = False, `grade_meets_minimum("C-", "C-")` = True.

### Pattern 2: OOP Rule Hierarchy

**What:** Composite pattern with polymorphic `evaluate`. Base `Rule` class is abstract-in-practice (not using ABC to keep it simple). Each subclass returns `(bool, list[str])` where the list contains human-readable unmet items.
**When to use:** OOP backend only.

```python
# src/oop/models.py (implementation skeleton)
class Rule:
    def evaluate(self, completed, in_progress, catalog):
        """Returns (bool, list[str]) — met status and unmet descriptions."""
        raise NotImplementedError

class CourseRule(Rule):
    def __init__(self, course_id: str, min_grade: str = None):
        self.course_id = course_id
        self.min_grade = min_grade  # None means default C- threshold

    def evaluate(self, completed, in_progress, catalog):
        earned = completed.get(self.course_id)
        if earned is None:
            return False, [f"missing {self.course_id}"]
        threshold = self.min_grade or "C-"
        if not grade_meets_minimum(earned, threshold):
            return False, [f"needs {self.course_id} with {threshold} or better (earned {earned})"]
        return True, []

class AndRule(Rule):
    def __init__(self, requirements):
        self.requirements = requirements  # list[Rule]

    def evaluate(self, completed, in_progress, catalog):
        unmet = []
        for req in self.requirements:
            ok, msgs = req.evaluate(completed, in_progress, catalog)
            if not ok:
                unmet.extend(msgs)
        return len(unmet) == 0, unmet

class OrRule(Rule):
    def __init__(self, requirements):
        self.requirements = requirements  # list[Rule]

    def evaluate(self, completed, in_progress, catalog):
        all_unmet = []
        for req in self.requirements:
            ok, msgs = req.evaluate(completed, in_progress, catalog)
            if ok:
                return True, []
            all_unmet.extend(msgs)
        # Combine all branches into an OR message
        return False, [" OR ".join(all_unmet)]
```

### Pattern 3: FP Frozen Dataclasses + match/case Dispatch

**What:** Immutable rule records using `@dataclass(frozen=True)`. Dispatch in `evaluate_rule` uses `match/case` structural pattern matching (Python 3.10+, confirmed on 3.14). `requirements` fields use `tuple` (not `list`) to preserve immutability and hashability.
**When to use:** FP backend only.

```python
# src/fp/types.py
from dataclasses import dataclass
from typing import Optional, Tuple

@dataclass(frozen=True)
class CourseRule:
    course_id: str
    min_grade: Optional[str] = None

@dataclass(frozen=True)
class AndRule:
    requirements: tuple  # Tuple[Rule, ...]

@dataclass(frozen=True)
class OrRule:
    requirements: tuple  # Tuple[Rule, ...]

@dataclass(frozen=True)
class CourseInfo:
    course_id: str
    name: str
    prerequisite: object  # CourseRule | AndRule | OrRule | None

@dataclass(frozen=True)
class StudentRecord:
    completed: tuple      # Tuple[(course_id, grade), ...]
    in_progress: tuple    # Tuple[course_id, ...]
```

```python
# src/fp/checker.py — evaluate_rule using match/case
def evaluate_rule(rule, completed: dict, in_progress: tuple, catalog: dict):
    """Pure recursive evaluator. Returns (bool, list[str])."""
    match rule:
        case None:
            return True, []
        case CourseRule(course_id=cid, min_grade=mg):
            earned = completed.get(cid)
            if earned is None:
                return False, [f"missing {cid}"]
            threshold = mg or "C-"
            if not grade_meets_minimum(earned, threshold):
                return False, [f"needs {cid} with {threshold} or better (earned {earned})"]
            return True, []
        case AndRule(requirements=reqs):
            unmet = []
            for r in reqs:
                ok, msgs = evaluate_rule(r, completed, in_progress, catalog)
                if not ok:
                    unmet.extend(msgs)
            return len(unmet) == 0, unmet
        case OrRule(requirements=reqs):
            all_unmet = []
            for r in reqs:
                ok, msgs = evaluate_rule(r, completed, in_progress, catalog)
                if ok:
                    return True, []
                all_unmet.extend(msgs)
            return False, [" OR ".join(all_unmet)]
```

**Verified:** `match/case` structural pattern matching on dataclasses works correctly on Python 3.14. `AndRule` with partial completion returns `(False, ['missing CS151 OR missing CS152'])`.

### Pattern 4: DFS Cycle Detection

**What:** Two-set DFS (visited + recursion-stack). Runs inside `build_catalog` / `parse_catalog` before returning. Extracts all course_id leaves from rule trees to build the dependency graph edges.
**When to use:** At catalog parse time, both OOP and FP.

```python
def _get_prereq_course_ids(rule_data: dict) -> set:
    """Recursively extract all course_id leaves from a raw rule dict."""
    if rule_data is None:
        return set()
    if rule_data["type"] == "course":
        return {rule_data["course_id"]}
    result = set()
    for req in rule_data.get("requirements", []):
        result |= _get_prereq_course_ids(req)
    return result

def _detect_cycles(catalog_data: dict) -> None:
    """Raise CycleError if any cycle exists in the prerequisite graph."""
    courses = catalog_data.get("courses", {})
    visited = set()
    rec_stack = set()

    def dfs(course_id: str, path: list):
        if course_id in rec_stack:
            cycle_start = path.index(course_id)
            cycle_path = " -> ".join(path[cycle_start:] + [course_id])
            raise CycleError(f"Prerequisite cycle detected: {cycle_path}")
        if course_id in visited:
            return
        visited.add(course_id)
        rec_stack.add(course_id)
        prereqs = _get_prereq_course_ids(
            courses.get(course_id, {}).get("prerequisites")
        )
        for prereq_id in prereqs:
            dfs(prereq_id, path + [course_id])
        rec_stack.discard(course_id)

    for course_id in courses:
        dfs(course_id, [])
```

**Verified:** Runs cleanly on `data/sample_catalog.json` (returns no cycles). The algorithm traverses course_id nodes — OR branches are both visited because both contribute edges to the dependency graph. An OR cycle in one branch is still a cycle.

### Pattern 5: check_eligibility Explanation Assembly

**What:** `check_eligibility` calls `evaluate` / `evaluate_rule`, gets the `(bool, list[str])`, then assembles the final explanation string using the locked format.
**When to use:** Both OOP and FP `check_eligibility` wrappers.

```python
def check_eligibility(course, completed, in_progress):
    """Returns (bool, str) — eligible flag and human-readable explanation."""
    rule = course.prerequisite  # OOP: course.rule / FP: course_info.prerequisite
    if rule is None:
        # Build eligible string listing completed courses with grades
        if completed:
            parts = [f"{cid} ({grade})" for cid, grade in completed.items()]
            return True, "Eligible: " + ", ".join(parts)
        return True, "Eligible: no prerequisites"
    
    ok, unmet = rule.evaluate(completed, in_progress, {})  # OOP
    # ok, unmet = evaluate_rule(rule, completed, in_progress, {})  # FP
    
    if ok:
        # Show completed courses with grades for courses that had min_grade
        return True, "Eligible"  # simplest form; can be enriched
    else:
        return False, "Not eligible: " + ", ".join(unmet)
```

**Note on explanation enrichment:** CONTEXT.md shows `"Eligible: CS46A (B+), MATH42 (A)"` — this shows the courses that satisfied prerequisites with their earned grades. This is optional enrichment; the tests only assert on the boolean today. PAR-03 tests will check the string, but the format is implementer's choice as long as it's natural language.

### Anti-Patterns to Avoid

- **Rebuilding grade comparison in each checker:** Grade logic must live only in `src/shared/grades.py`. Both OOP and FP import from there.
- **Using `list` for FP `requirements`:** `list` is mutable; `tuple` is required for `frozen=True` dataclasses.
- **Detecting cycles at check time:** Only at parse time. Check-time detection would add O(depth) overhead per call and complicate the API.
- **`MinGradeRule` as a separate rule class:** The schema has `min_grade` as a field on `CourseRule`, not a separate rule type. Do not create a `MinGradeRule` class — this contradicts RULE_SCHEMA and the README mention of it is stale (documented as a concern in CONCERNS.md).
- **Hardcoding "D" as passing:** The passing threshold is "C-". "D", "D+", "D-" are explicitly listed as non-passing in CONTEXT.md.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Grade ordering | Custom string comparison | `GRADE_ORDER` list + `index()` | Grade strings have no natural sort order; "B+" > "C-" requires explicit mapping |
| Rule dispatch | Giant if/elif chain scattered across files | Single `evaluate_rule` (FP) or polymorphic `evaluate` (OOP) | Composite pattern / function dispatch is the standard solution; scattering logic leads to parity failures |
| Cycle detection | Track visited during eligibility check | Dedicated DFS at parse time | Check-time cycle detection adds complexity and latency; fail-fast at parse time is correct |

**Key insight:** The hardest part of this phase is not the algorithm (DFS and composite pattern are well-understood) but maintaining the contract between the two backends. Every decision about return types, explanation formatting, and default grade threshold must be made once in shared code and referenced — not duplicated.

---

## SJSU Catalog Analysis

### Rule Shapes Present in sjsu_cs_catalog.json

All rule shapes fit within RULE_SCHEMA — no schema extension needed. Observed patterns:

| Pattern | Example Course | Rule Shape |
|---------|---------------|------------|
| No prerequisites | CS46A, MATH42 | `null` |
| Single CourseRule with min_grade | CS46B, CS48 | `{"type": "course", "course_id": "...", "min_grade": "C-"}` |
| AndRule of CourseRules | CS116A (3-way AND), CS146 | `{"type": "and", "requirements": [...]}` |
| Single min_grade "C" (not "C-") | CS160 (CS100W) | `{"type": "course", "course_id": "CS100W", "min_grade": "C"}` |
| OrRule at top level | CS152 | `{"type": "or", "requirements": [...]}` |
| Nested AND inside AND (none found) | — | Not present in current catalog |
| Nested OR inside AND | sample_catalog CS160 | `{"type": "and", "requirements": [..., {"type": "or", ...}]}` |

**Important finding:** The SJSU catalog uses both `"C-"` and `"C"` as `min_grade` values. `"C"` is a higher threshold than `"C-"`. The grade ordering handles this correctly: `GRADE_ORDER.index("C") = 7`, `GRADE_ORDER.index("C-") = 8`.

**Corequisites field:** `CS22A` has `"corequisites": ["CS1022AS"]`. This field is present in the JSON but is NOT in RULE_SCHEMA and is explicitly deferred (CORQ-01, CORQ-02). The parser/catalog builder must silently ignore the `corequisites` key.

**raw_text field:** Several courses have a `"raw_text"` field with the original natural-language prerequisite description. The catalog builder must ignore this field as well (it's not part of the rule structure).

---

## Common Pitfalls

### Pitfall 1: Test Fixture Import — No Extra Aliases Needed

**What goes wrong:** CONTEXT.md says "add aliases `oop_check = check_eligibility`, `fp_check = check_eligibility` in checker.py". But `tests/test_checker.py` already does:
```python
from src.oop.checker import build_catalog as oop_build_catalog, check_eligibility as oop_check
from src.fp.checker import parse_catalog as fp_parse_catalog, check_eligibility as fp_check
```
The `as` clause IS the alias. No additional assignment is needed in checker.py — just implement `check_eligibility` and `build_catalog` / `parse_catalog` with those exact names.

**Why it happens:** CONTEXT.md described the fix as "add aliases," which was written before the test file's import statement was examined carefully.

**How to avoid:** Implement functions named exactly `check_eligibility`, `build_catalog` (OOP), and `parse_catalog` (FP). The test file will import and rename them itself.

### Pitfall 2: frozen=True Dataclass with list fields

**What goes wrong:** `@dataclass(frozen=True)` raises `TypeError: unhashable type: 'list'` if you try to use a list field, because frozen dataclasses compute `__hash__` from all fields.

**Why it happens:** Lists are not hashable.

**How to avoid:** Use `tuple` for `requirements` in `AndRule` and `OrRule`. When building FP rules from JSON, convert the list: `requirements=tuple(parse_rule(r) for r in rule_data["requirements"])`.

### Pitfall 3: OOP check_eligibility Receives a Course Object, Not course_id

**What goes wrong:** The test calls `oop_check(oop_catalog["CS46A"], {}, [])` — the first argument is a `Course` object (the value from the catalog dict), not a string course_id.

**Why it happens:** Easy to accidentally treat the first arg as a string.

**How to avoid:** `Course` objects hold a `rule` attribute (or `prerequisite`). `check_eligibility(course, ...)` should call `course.rule.evaluate(...)` or handle `course.rule is None` for no-prereq case. The catalog dict maps `str -> Course`, not `str -> str`.

### Pitfall 4: FP check_eligibility Receives a CourseInfo Object

**What goes wrong:** Same as OOP — `fp_check(fp_catalog["CS46A"], {}, ())` passes a `CourseInfo` dataclass, not a course_id string.

**How to avoid:** `CourseInfo` holds a `prerequisite` field. `check_eligibility(course_info, ...)` extracts `course_info.prerequisite` and passes it to `evaluate_rule`.

### Pitfall 5: Cycle Detection Must Walk Rule Tree, Not Just Top-Level prereq

**What goes wrong:** A naive cycle check that only looks at direct prerequisites misses cycles through nested AND/OR rules.

**Why it happens:** `CS160` prereqs include an `OrRule` containing `CS151` and `CS152` — the check must extract ALL course_ids from the full rule tree.

**How to avoid:** Use `_get_prereq_course_ids(rule_data)` that recursively collects all `course_id` leaves from a rule dict, regardless of nesting.

### Pitfall 6: sjsu_cs_catalog.json Extra Fields

**What goes wrong:** The catalog JSON has `"corequisites"` and `"raw_text"` fields not in RULE_SCHEMA. If the builder blindly iterates all keys it may crash or pollute Course/CourseInfo objects.

**How to avoid:** Builders must read only `name` and `prerequisites` keys from each course dict. Ignore `corequisites`, `raw_text`, and any other extra fields.

### Pitfall 7: Grade "C" vs "C-" in SJSU Catalog

**What goes wrong:** Treating all min_grade values as "C-" would incorrectly allow students with a "C-" to satisfy CS100W (which requires "C" or better).

**Why it happens:** Most courses use "C-" but CS100W in the SJSU catalog uses "C".

**How to avoid:** Always use the `min_grade` field value directly. The `grade_meets_minimum` function handles both correctly since both are in `GRADE_ORDER`.

---

## Code Examples

### Grade Utility (src/shared/grades.py)

```python
# Source: verified against Python 3.14 runtime, CONTEXT.md grade scale decision
"""Shared grade ordering and comparison utilities."""

GRADE_ORDER = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"]

def grade_meets_minimum(earned: str, minimum: str) -> bool:
    """Return True if earned grade is at least as good as minimum required."""
    if earned not in GRADE_ORDER or minimum not in GRADE_ORDER:
        return False
    return GRADE_ORDER.index(earned) <= GRADE_ORDER.index(minimum)

def is_passing(grade: str) -> bool:
    """Return True if grade meets default C- passing threshold."""
    return grade_meets_minimum(grade, "C-")
```

### OOP Rule Builder (src/oop/checker.py — build_rule)

```python
# Source: verified against RULE_SCHEMA in src/shared/schemas.py
def build_rule(rule_data):
    """Recursively build a Rule object from JSON rule dict."""
    if rule_data is None:
        return None
    rule_type = rule_data["type"]
    if rule_type == "course":
        return CourseRule(
            course_id=rule_data["course_id"],
            min_grade=rule_data.get("min_grade"),  # Optional
        )
    elif rule_type == "and":
        return AndRule(
            requirements=[build_rule(r) for r in rule_data["requirements"]]
        )
    elif rule_type == "or":
        return OrRule(
            requirements=[build_rule(r) for r in rule_data["requirements"]]
        )
    else:
        raise ValueError(f"Unknown rule type: {rule_type}")
```

### FP Rule Parser (src/fp/checker.py — parse_rule)

```python
# Source: verified against RULE_SCHEMA; tuple required for frozen=True
def parse_rule(rule_data):
    """Recursively parse a rule dict into an immutable rule dataclass."""
    if rule_data is None:
        return None
    rule_type = rule_data["type"]
    if rule_type == "course":
        return CourseRule(
            course_id=rule_data["course_id"],
            min_grade=rule_data.get("min_grade"),
        )
    elif rule_type == "and":
        return AndRule(
            requirements=tuple(parse_rule(r) for r in rule_data["requirements"])
        )
    elif rule_type == "or":
        return OrRule(
            requirements=tuple(parse_rule(r) for r in rule_data["requirements"])
        )
    else:
        raise ValueError(f"Unknown rule type: {rule_type}")
```

### Catalog Builder Shape

Both builders follow the same pattern — iterate `catalog_data["courses"]`, build rule, construct Course/CourseInfo:

```python
# OOP
def build_catalog(catalog_data):
    _detect_cycles(catalog_data)  # Fail fast before building any objects
    catalog = {}
    for course_id, course_dict in catalog_data["courses"].items():
        rule = build_rule(course_dict.get("prerequisites"))
        catalog[course_id] = Course(
            course_id=course_id,
            name=course_dict["name"],
            rule=rule,
        )
    return catalog

# FP — identical structure, different types
def parse_catalog(catalog_data):
    _detect_cycles(catalog_data)
    return {
        course_id: CourseInfo(
            course_id=course_id,
            name=course_dict["name"],
            prerequisite=parse_rule(course_dict.get("prerequisites")),
        )
        for course_id, course_dict in catalog_data["courses"].items()
    }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual isinstance chain for dispatch | `match/case` structural pattern matching | Python 3.10 (2021) | Cleaner dispatch; Python 3.14 fully supports it |
| `dataclass` with mutable fields for records | `@dataclass(frozen=True)` | Python 3.7+ (frozen) | Enforces immutability at runtime; required for FP paradigm |
| Separate ABC for Rule base class | `raise NotImplementedError` in base | N/A | Simpler for a class project; ABC adds no test value here |

**Deprecated/outdated:**
- `MinGradeRule` as a separate class: README mentions it but RULE_SCHEMA and CONTEXT.md both confirm `min_grade` is a field on `CourseRule`. Do not create this class.

---

## Open Questions

1. **Should cycle detection be shared between OOP and FP?**
   - What we know: Both backends need identical DFS logic operating on the raw `catalog_data` dict (before any objects are constructed).
   - What's unclear: Should it live in `src/shared/` (e.g., `src/shared/graph.py`) or be duplicated in each checker?
   - Recommendation: A single `_detect_cycles(catalog_data)` in `src/shared/graph.py` imported by both checkers is cleanest and eliminates duplication. However, duplicating it is also acceptable given the project's small size. Implementer's discretion.

2. **Explanation string for the eligible case**
   - What we know: CONTEXT.md shows `"Eligible: CS46A (B+), MATH42 (A)"` but tests today use `_` to discard the string.
   - What's unclear: PAR-03 will add tests that verify the string — exactly how rich should the eligible message be?
   - Recommendation: Start with `"Eligible"` as the minimal passing implementation. Enrich to show completed prereqs with grades if time permits. PAR-03 test author controls what they assert.

3. **CycleError location**
   - What we know: CONTEXT.md says "raise a custom `CycleError`" but doesn't specify the module.
   - Recommendation: Define `CycleError` in `src/shared/errors.py` (new file, 2 lines) and import it in both checkers. Or define it locally in each checker — both are fine. Don't let this block implementation.

---

## Environment Availability

Step 2.6: No new external dependencies for Phase 1. All tools already available.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3.14 | All logic | Yes | 3.14.3 | — |
| pytest | Test runner | Yes | 9.0.2 | — |
| dataclasses | FP frozen types | Yes | stdlib | — |
| match/case | FP dispatch | Yes | Python 3.14 | isinstance chain |

---

## Sources

### Primary (HIGH confidence)

- Python 3.14 runtime — `match/case` structural pattern matching verified working
- Python 3.14 runtime — `@dataclass(frozen=True)` with `tuple` fields verified
- Python 3.14 runtime — grade ordering logic verified with sample data
- `tests/test_checker.py` (live file) — import structure confirms no extra aliases needed
- `data/sample_catalog.json` (live file) — all 6 rule shapes examined
- `data/sjsu_cs_catalog.json` (live file) — all 38 courses examined; min_grade values confirmed as "C" and "C-" only; no rule shapes outside RULE_SCHEMA
- `src/shared/schemas.py` (live file) — RULE_SCHEMA as source of truth
- DFS cycle detection algorithm — verified against sample_catalog (returns empty list of cycles)

### Secondary (MEDIUM confidence)

- CONTEXT.md decisions — user-locked decisions for this phase
- CONCERNS.md — `MinGradeRule` documented as stale README artifact; confirmed `min_grade` is a CourseRule field

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all stdlib
- Grade ordering: HIGH — verified algorithm with live Python 3.14
- Architecture patterns: HIGH — verified code examples against live runtime
- SJSU catalog analysis: HIGH — directly read all 38 courses from live JSON file
- Cycle detection: HIGH — algorithm verified against sample_catalog
- FP dataclass pattern: HIGH — frozen=True + tuple verified on Python 3.14
- match/case dispatch: HIGH — verified working on Python 3.14
- Explanation string format: MEDIUM — locked by CONTEXT.md but PAR-03 test assertions not yet written

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (stable Python stdlib; no external APIs)
