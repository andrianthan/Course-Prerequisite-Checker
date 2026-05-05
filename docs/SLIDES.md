---
marp: true
theme: default
paginate: true
size: 16:9
---

# Course Prerequisite Checker
### CS152 — Programming Paradigms · Spring 2026
### Andrian Than · Lisa Yu · SJSU

---

## The Problem

- SJSU CS catalog has **41 courses** with nested AND/OR prerequisites
- Many require minimum grades ("C- or better")
- Students have to mentally compute eligibility every term
- Departments must keep rules consistent as catalogs evolve

**Goal:** an app that tells you what you can take, what you can't, and *why*.

---

## Project Goals

1. **Functional product** — upload transcript, pick course, see verdict
2. **Two paradigm implementations** — same logic in OOP and FP
3. **Behavioral parity** — both backends must produce identical results
4. **Comparative analysis** — for the paper, on four dimensions:
   - Readability · Modularity · Ease of extension · Maintainability

---

## Architecture

```
                    ┌──────────────┐
                    │  React UI    │  (Vite + Tailwind)
                    └──────┬───────┘
                           │  fetch
                    ┌──────▼───────┐
                    │  FastAPI     │  /api/check?backend=oop|fp
                    │   backend    │  /api/recommendations?...
                    └─┬───────┬────┘
                      │       │
              ┌───────▼─┐   ┌─▼──────┐
              │   OOP   │   │   FP   │
              │ checker │   │checker │
              └───────┬─┘   └─┬──────┘
                      │       │
                ┌─────▼───────▼────┐
                │  Shared Layer    │
                │  grades · errors │
                │  graph · schema  │
                └──────────────────┘
```

---

## OOP Implementation

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

**Pattern:** classic composite + polymorphic dispatch.
**Behavior colocated with data.** Adding a rule = new class.

---

## FP Implementation

```python
@dataclass(frozen=True)
class AndRule:
    requirements: tuple  # tuple, not list (frozen + hashable)

def evaluate_rule(rule, completed, in_progress, catalog):
    match rule:
        case None: return (True, [])
        case CourseRule(): ...
        case AndRule(requirements=rs):
            unmet = []
            for r in rs:
                ok, m = evaluate_rule(r, completed, in_progress, catalog)
                if not ok: unmet.extend(m)
            return (len(unmet) == 0, unmet)
        case OrRule(...): ...
```

**Pattern:** algebraic data types + single dispatch function.

---

## Shared Layer (the real win)

| Module | Purpose |
|---|---|
| `grades.py` | One canonical `GRADE_ORDER` + `grade_meets_minimum()` |
| `errors.py` | One public exception: `CycleError` |
| `graph.py` | DFS cycle detection on raw catalog JSON |

Both backends import these. **Kills parity drift** — grade comparison, error types, and cycle detection are tested and fixed in *one* place.

---

## Demo Flow

1. **Upload** SJSU transcript PDF (or skip + manual entry)
2. **Confirm** parsed courses + grades
3. **Pick** a target course
4. **See** verdict + explanation
5. **Toggle** OOP ↔ FP — watch results stay identical

> Live: `uvicorn app.main:app --reload` + `npm run dev`
> Backend on :8000, frontend on :5173

---

## Behavioral Parity — Tested

```bash
$ pytest tests/test_checker.py -v
✓ TestNoPrerequisites    (OOP + FP)
✓ TestSimpleCourseRule   (OOP + FP)
✓ TestAndRule            (OOP + FP)
✓ TestOrRule             (OOP + FP)
✓ TestMinGrade           (OOP + FP)
✓ TestCycleDetection     (OOP + FP)

32 passed in 0.01s
```

Every test runs through *both* backends. Any divergence fails CI.

---

## Behavioral Parity — Live

```
Student: {CS46A: B+, CS46B: A-, MATH42: B}, in_progress: [CS146]

OOP backend:  11 eligible, 23 near-eligible
FP  backend:  11 eligible, 23 near-eligible
              ↑ byte-identical
```

The web demo flips between backends in <100ms — students literally watch the toggle and see no change in results.

---

## Comparison: Lines of Code

| Component | OOP | FP |
|---|---|---|
| Type / class definitions | 79 | 37 |
| Eligibility logic + parser | 73 | 114 |
| **Total paradigm-specific** | **152** | **151** |

OOP spends lines on per-class boilerplate.
FP spends lines on a single big dispatch function.

**Net: within one line.**

---

## Comparison: Qualitative

| Dimension | Winner | Why |
|---|---|---|
| Readability | tie / OOP slight | OOP colocates data + behavior; FP centralizes dispatch |
| Modularity (within file) | OOP | Each class independent |
| Modularity (across files) | tie | Both split types from logic |
| Adding a rule type | OOP slight | Encapsulated; FP needs `case` edit |
| Adding stateful behavior | OOP | `self` is natural state |
| Defect surface | FP | `frozen=True` + exhaustive `match` catch errors fast |

---

## What We Built

- ✅ FastAPI backend (4 endpoints, lifespan catalog cache, CORS)
- ✅ React frontend (Vite + Tailwind, single-page demo)
- ✅ OOP eligibility checker (5 classes, polymorphic evaluate)
- ✅ FP eligibility checker (5 frozen dataclasses, match/case dispatch)
- ✅ LLM-powered transcript PDF parser (pypdf + OpenRouter)
- ✅ Recommender (eligible + near-eligible)
- ✅ 54 passing tests (32 parity + 22 LLM/recommender)
- ✅ Comparative paper

---

## What We Cut (and Why)

- ❌ **Concurrency / batch parallel checks** — Python GIL makes the speedup small for pure-CPU work. Demo focus.
- ❌ **Public deployment** — localhost demo enough for class
- ❌ **Persistent DB** — JSON files cover the demo
- ❌ **Multi-school catalogs** — SJSU CS only

---

## Lessons Learned

1. **Choose the layer underneath, not the paradigm above.**
   The shared layer (`grades.py`, `errors.py`, `graph.py`) had more impact than the OOP/FP choice.

2. **Test parity from day one.**
   Two implementations + one shared test suite caught 6 bugs we wouldn't have noticed otherwise.

3. **Frozen dataclasses are a quiet superpower.**
   Free hashing, free equality, structural pattern-matching, and cheap immutability checks.

4. **`match/case` reads like a spec.**
   The whole rule grammar fits in one screen.

---

## Thank You

**Try it:** [http://localhost:5173](http://localhost:5173)

**Repo:** github.com/sjsu/.../course-prerequisite-checker
**Paper:** `docs/PAPER.md`
**Tests:** `pytest tests/` → `54 passed`

Andrian Than · andrian.than@sjsu.edu
Lisa Yu · elizabeth.yu@sjsu.edu
