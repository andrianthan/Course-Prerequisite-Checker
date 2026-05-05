# Course Prerequisite Checker — OOP vs FP Comparison

**CS152 — Programming Paradigms**
**Andrian Than, Lisa Yu — San José State University**
**Spring 2026**

---

## Abstract

This project implements a Course Prerequisite Checker for San José State University's Computer Science department in two software paradigms — Object-Oriented (OOP) and Functional (FP) — and evaluates the trade-offs each paradigm introduces when modeling the same problem domain. Both implementations parse the same JSON catalog, apply the same rule grammar (AND/OR composition, minimum-grade constraints, cycle detection), and pass an identical 32-case shared test suite. A FastAPI + React web demo runs both backends behind a runtime toggle, allowing live verification that the two paradigms produce identical eligibility verdicts. We compare the implementations on four dimensions — readability, modularity, ease of extension, and maintainability — and conclude that for this domain the FP implementation is marginally smaller and easier to test, while the OOP implementation reads more naturally to engineers familiar with class hierarchies and is easier to extend with stateful rule types.

**Index Terms** — software design, object-oriented programming, functional programming, comparative case study

---

## I. Introduction

Universities encode course prerequisites as structured rules: some courses require multiple prior courses (AND), some accept alternatives (OR), and many require a minimum grade (e.g., "C- or better"). Students must verify eligibility across many possible schedules, and departments must keep rules consistent as catalogs evolve.

This project takes one such catalog (the 41-course SJSU CS catalog) and one student record format (completed courses with grades plus in-progress courses) and produces eligibility verdicts of the form `(True, "Eligible: CS46A (B+), MATH42 (A)")` or `(False, "Not eligible: missing CS46A")`. The same eligibility logic is implemented twice — once with mutable classes and polymorphic dispatch (OOP), and once with frozen dataclasses and pure functions (FP) — so we can directly compare the paradigms on a non-trivial real-world problem.

The web demo wraps both backends behind a FastAPI service that routes `/api/check?backend=oop` and `/api/check?backend=fp` to the corresponding implementation. The React frontend includes a top-nav toggle that re-runs the active query against the other backend, giving the user immediate visual confirmation that both paradigms agree.

## II. Methodology

### A. Shared Foundation

Both implementations share three modules in `src/shared/` to eliminate parity drift:

- **`grades.py`** — A canonical letter-grade ordering (`GRADE_ORDER = ["A+", "A", "A-", ..., "F"]`) and `grade_meets_minimum(earned, minimum)` function. Index 0 is the highest grade; comparison is `index(earned) <= index(minimum)`. Treating "W" and "I" as not in the order means they naturally fail any minimum check.
- **`errors.py`** — A single public exception type, `CycleError`, raised when the prerequisite graph contains a cycle.
- **`graph.py`** — A pure-Python DFS that walks the raw catalog JSON before any rule objects are constructed. Visited and recursion-stack sets give O(V+E) complexity. The function is called by both `build_catalog` (OOP) and `parse_catalog` (FP) so cycle detection runs at parse time, not at check time.

This shared layer means that grade comparison, exception types, and cycle detection are tested and maintained once.

### B. OOP Implementation (`src/oop/`)

`models.py` defines a base `Rule` class and three subclasses (`CourseRule`, `AndRule`, `OrRule`). Each subclass overrides a polymorphic `evaluate(completed, in_progress, catalog) -> (bool, list[str])` method:

```python
class AndRule(Rule):
    def __init__(self, requirements):
        self.requirements = requirements

    def evaluate(self, completed, in_progress, catalog):
        unmet = []
        for r in self.requirements:
            ok, missing = r.evaluate(completed, in_progress, catalog)
            if not ok:
                unmet.extend(missing)
        return (len(unmet) == 0, unmet)
```

`Course` objects hold a name and a single `Rule` (or `None` for courses with no prerequisites). `checker.py` exposes `build_rule`, `build_catalog`, and `check_eligibility` as module-level functions that operate on those objects.

The OOP implementation uses inheritance to dispatch evaluation logic. Adding a new rule type — for example, a `MinCreditsRule` requiring a minimum total credit count — would mean adding a new class with its own `evaluate` method, no other code changing.

### C. FP Implementation (`src/fp/`)

`types.py` defines five frozen dataclasses (`@dataclass(frozen=True)`): `CourseRule`, `AndRule`, `OrRule`, `StudentRecord`, and `CourseInfo`. Frozen dataclasses are immutable and hashable, but they require all fields to be hashable too — list fields make a dataclass unhashable, so `AndRule.requirements` and `OrRule.requirements` are typed as `tuple[Rule, ...]`.

`checker.py` exposes a single top-level `evaluate_rule(rule, completed, in_progress, catalog)` function that dispatches on rule type using `match/case`:

```python
def evaluate_rule(rule, completed, in_progress, catalog):
    match rule:
        case None:
            return (True, [])
        case CourseRule():
            return _evaluate_course_rule(rule, completed, in_progress)
        case AndRule(requirements=rs):
            unmet = []
            for r in rs:
                ok, m = evaluate_rule(r, completed, in_progress, catalog)
                if not ok:
                    unmet.extend(m)
            return (len(unmet) == 0, unmet)
        case OrRule(requirements=rs):
            ...
```

`parse_rule` walks the JSON dict and produces nested frozen dataclasses; `parse_catalog` builds the dictionary of courses and calls the shared `_detect_cycles` helper.

The FP implementation uses an algebraic data type plus a single dispatch function. Adding a new rule type requires editing one place — the `match/case` in `evaluate_rule` — but introduces the trade-off that a forgotten case is a runtime bug rather than a compile-time error.

### D. Behavioral Parity (`tests/test_checker.py`)

A shared pytest suite imports both backends with paradigm-specific aliases:

```python
from src.oop.checker import check_eligibility as oop_check
from src.fp.checker  import check_eligibility as fp_check
```

Each test class defines parallel test methods (`test_oop_*` and `test_fp_*`) that run the same scenario through both backends and assert that both return the same boolean. Test classes cover:

- `TestNoPrerequisites` — courses with `null` prereqs
- `TestSimpleCourseRule` — single-course AND-of-one
- `TestAndRule` — multi-course AND
- `TestOrRule` — alternatives
- `TestMinGrade` — courses requiring `min_grade: "C-"` reject D+ students
- `TestCycleDetection` — `build_catalog`/`parse_catalog` raise `CycleError` on a cyclic input

All 32 tests pass for both backends. Coupled with the 22 LLM/recommender tests in `test_phase2.py`, the project's full suite is 54 green tests.

### E. Web Demo

`app/main.py` is a FastAPI application that loads both catalogs into memory at startup (`lifespan` context manager) and exposes four endpoints:

- `GET /api/catalog` — list of 41 SJSU CS courses
- `POST /api/transcript` — multipart PDF upload, returns `{completed, in_progress}` parsed via `pypdf` + LLM
- `POST /api/check?backend=oop|fp` — eligibility verdict for one course
- `POST /api/recommendations?backend=oop|fp` — eligible and near-eligible lists

The query parameter `backend=oop|fp` resolves which catalog and which `check_eligibility` function are used, so the toggle is a one-line switch on the server.

The React frontend (`frontend/src/`) is a single-page Vite + Tailwind app. A `BackendContext` exposes the current backend; `useEffect` dependencies on the context value cause `VerdictCard` and `RecommendationsPanel` to refetch automatically when the user flips the pill.

## III. Comparison

We evaluate the two implementations on four qualitative dimensions and one quantitative dimension. Both implementations exclude the shared modules (`grades.py`, `errors.py`, `graph.py`) so the comparison reflects only what each paradigm contributes.

### A. Lines of Code (Quantitative)

| Component | OOP | FP |
|-----------|-----|----|
| Type / class definitions | `models.py` (79 lines) | `types.py` (37 lines) |
| Eligibility logic + parser | `checker.py` (73 lines) | `checker.py` (114 lines) |
| **Total paradigm-specific** | **152 lines** | **151 lines** |

The two implementations are within one line of each other. OOP spends more lines on class definitions because each rule subclass has its own `__init__` and `evaluate` body; FP spends more lines on the central `evaluate_rule` function because all dispatch lives there. The shared layer (`grades.py` 17 + `errors.py` 9 + `graph.py` 50 = 76 lines) is the same for both.

### B. Readability

OOP reads more naturally to engineers familiar with class hierarchies. The polymorphic `evaluate` method colocates each rule type's behavior with its data, so reading `AndRule` shows you everything `AndRule` does. The FP implementation requires the reader to jump between the dataclass definition (in `types.py`) and the corresponding `case` arm (in `checker.py::evaluate_rule`).

On the other hand, the FP `match/case` block is a single 25-line function that exhaustively shows the entire rule grammar in one place. For a reader who wants to understand "what shapes can a rule take and how is each one evaluated?" the FP implementation answers that question in a single screen.

### C. Modularity

Both implementations are modular at the file level — the rule type definitions and the evaluation logic are in separate files in both. Within a file, OOP is more modular: each `Rule` subclass is independent and can be edited without touching the others. The FP `evaluate_rule` is a single function, so any change to dispatch logic touches every rule's evaluation path.

That said, the FP implementation's dataclasses are smaller and have no methods, so they are trivially reusable in contexts where the dispatch logic is irrelevant (e.g., serialization, validation, equality testing — frozen dataclasses are hashable for free).

### D. Ease of Extension

Adding a new rule type — say, `MinCreditsRule` requiring at least N total credits across the student's completed courses — requires:

- **OOP:** one new class with an `evaluate` method. No other file changes. New behavior is encapsulated.
- **FP:** one new dataclass plus one new `case` arm in `evaluate_rule`. Two file edits, but both small.

OOP wins narrowly on encapsulation. FP wins narrowly on locality — all dispatch logic stays in one place — but loses on the chance that a forgotten `case` arm only fails at runtime.

For *stateful* extensions (e.g., a rule that caches partial evaluations across calls), OOP is the clear winner because `self` provides natural state. FP would require a separate mutable cache passed through the call chain, which fights the paradigm.

### E. Maintainability

The shared 32-test parity suite is the strongest maintainability lever in this project. Any change to either implementation that breaks parity is caught immediately. Both implementations are equally maintainable in this sense — they each have to pass the same tests.

Where the paradigms differ is in *defect surface*:

- **OOP** can be silently broken by mutating an attribute that should be immutable. We mitigated this by keeping the rule classes effectively immutable (no setters, no mutation methods), but Python doesn't enforce it.
- **FP** is harder to silently break because frozen dataclasses raise `FrozenInstanceError` on any attempted mutation, and the `match/case` is exhaustive enough that a missed case fails fast on the first input.

### F. Live Behavioral Parity

The web demo is itself a live parity check: clicking the OOP/FP toggle re-runs every request against the other backend and updates the UI. On the SJSU CS catalog with the sample student `{CS46A: B+, CS46B: A-, MATH42: B}` and `in_progress: [CS146]`, both backends return:

- `eligible`: 11 courses
- `near_eligible`: 23 courses

The lists are byte-for-byte identical. The same is true for the eligibility verdict on every course we tested.

## IV. Conclusion

For the Course Prerequisite Checker domain — composable rules over a small dataset, with no need for stateful rule evaluation or runtime mutation — both paradigms produced implementations of nearly identical size and behavior. Each paradigm pulled the design in a different direction:

- **OOP** colocated behavior with data, making per-rule changes localized but spreading dispatch across files.
- **FP** centralized dispatch in one exhaustive function, making the rule grammar legible as a whole but coupling all rules to a single function.

For a teaching domain like this one, FP felt slightly easier to test (frozen + hashable means you can assert structural equality of rule trees without writing an `__eq__`), and slightly harder to extend with stateful behavior. OOP felt slightly more natural to navigate, and slightly easier to extend with new rule types in isolation.

The project's larger lesson, though, is the *shared layer*: putting grade comparison, exception types, and cycle detection in `src/shared/` removed an entire class of parity bugs and made both implementations smaller. Choosing a paradigm for the rule layer mattered less than choosing where to put the layers underneath it.

## References

[1] B. M. Dias, R. C. Ferreira, and A. Goldman, "Functional vs. Object-Oriented: Comparing How Programming Paradigms Affect the Architectural Characteristics of Systems," arXiv preprint arXiv:2508.00244, 2025.

[2] C. Scalfani, "Why Functional Programming Should Be the Future of Software Development," IEEE Spectrum, 23-Oct-2022.

[3] M. A. Khan, S. S. Raza, K. Mahboob, S. Alam, M. A. Khan, and M. N. Hasany, "A Comparative Study of Object-Oriented, Procedural, and Functional Programming Paradigms in Microservice Architecture," VFAST Transactions on Software Engineering, vol. 13, no. 3, pp. 176–186, 2025.

[4] C. A. Shaffer, *Data Structures and Algorithm Analysis* (3rd ed., Java Version). Dover Publications, 2013.

## Appendix A: Repository Layout

```
src/
├── shared/         grades.py, errors.py, graph.py, schemas.py, loader.py, recommender.py
├── oop/            models.py (79 lines), checker.py (73 lines)
├── fp/             types.py (37 lines), checker.py (114 lines)
└── api/            parser.py, transcript_parser.py, _client.py
app/main.py         FastAPI backend (4 endpoints, OOP/FP toggle)
frontend/src/       React + Vite + Tailwind UI (5 components, BackendContext)
tests/              test_checker.py (32 tests), test_phase2.py (22 tests)
data/               sjsu_cs_catalog.json (41 courses), sample_catalog.json, sample_student.json
.planning/          GSD workflow artifacts (4 phases, 35 requirements, traceability)
```

## Appendix B: Test Suite

```
$ pytest tests/ -v
... 54 passed in 0.31s
```

Test coverage:
- `test_checker.py::TestNoPrerequisites` (2 tests)
- `test_checker.py::TestSimpleCourseRule` (4 tests)
- `test_checker.py::TestAndRule` (4 tests)
- `test_checker.py::TestOrRule` (6 tests)
- `test_checker.py::TestMinGrade` (8 tests, OOP+FP parity)
- `test_checker.py::TestCycleDetection` (8 tests, OOP+FP parity)
- `test_phase2.py` — 22 tests covering LLM parsers (mocked) and recommender (live OOP backend)
