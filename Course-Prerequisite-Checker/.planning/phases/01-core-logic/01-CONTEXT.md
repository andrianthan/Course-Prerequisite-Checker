# Phase 1: Core Logic - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Both OOP and FP eligibility checkers are fully implemented and produce identical results on all shared tests. Includes min-grade constraints, cycle detection at parse time, and natural-language explanations. No web layer, no LLM, no recommender — pure backend logic only.

</domain>

<decisions>
## Implementation Decisions

### Output Format + Grade Scale
- Explanation strings use natural phrases. Eligible example: `"Eligible: CS46A (B+), MATH42 (A)"`. Not-eligible example: `"Not eligible: missing CS46A"` or `"missing CS146 OR CS151"`. Grade only shown when min-grade rule fires (e.g., `"needs CS46A with C or better"`).
- Grade input format = letter strings: `"A"`, `"A-"`, `"B+"`, …, `"F"`. Matches existing `data/sample_student.json` format.
- Grade comparison logic lives in a single canonical module: `src/shared/grades.py`. Both OOP and FP import from it — no duplication.
- Default passing threshold (when no `min_grade` rule specified): `"C-"` or better counts as completed. `"D"`, `"D+"`, `"F"`, `"W"`, `"I"` count as not-completed.

### Cycle Detection + Code Strategy
- Cycle detection runs at catalog parse time (`build_catalog` / `parse_catalog`) — fail fast. Raise a custom `CycleError` exception with the cycle path in the message. Do not detect at check time.
- Algorithm: DFS with visited + recursion-stack sets. O(V+E).
- OOP evaluation style: each `Rule` subclass implements `evaluate(completed, in_progress, catalog)` polymorphically. Returns `(bool, list_of_unmet_descriptions)` — the list helps build explanations.
- FP evaluation style: single top-level `evaluate_rule(rule, completed, in_progress, catalog)` dispatches via `isinstance` checks (Python 3.14, but `match/case` is also fine — implementer's choice if cleaner).
- Test fixture name fix: keep `tests/test_checker.py` untouched. Add aliases (`oop_check = check_eligibility`, `fp_check = check_eligibility`) in the respective `checker.py` modules so existing imports succeed.

### Behavioral Parity (PAR requirements)
- Both backends must return identical `(bool, str)` for every shared test case for the boolean. Explanation strings should be logically identical (same missing courses listed) but exact wording can differ — PAR-02 explicitly allows close-enough.
- New parity tests for min-grade and cycle detection cases must run on both backends (PAR-03).

### Claude's Discretion
- Internal data shapes within each rule type beyond what's mandated (e.g., whether `AndRule` stores `requirements: List[Rule]` vs `Tuple[Rule, ...]` — FP must use immutable, OOP can use either).
- Specific exception classes and their hierarchy (other than `CycleError` being public).
- Whether to add typing.Protocol or stick with duck typing.
- Whether to extend `data/sample_catalog.json` with min-grade test data, or add a new fixture file. Implementer picks.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/shared/loader.py` — `load_json`, `load_catalog`, `load_student` already implemented. Use as-is.
- `src/shared/schemas.py` — `RULE_SCHEMA` defines valid rule JSON shapes (`course` / `and` / `or`). Treat as the source of truth.
- `data/sample_catalog.json`, `data/sample_student.json`, `data/sjsu_cs_catalog.json` — existing fixtures.
- `tests/test_checker.py` — shared test suite already wired with classes for NoPrerequisites, SimpleCourseRule, AndRule, OrRule. Tests import `oop_check`, `fp_check`, `oop_build_catalog`, `fp_parse_catalog`.

### Established Patterns
- Module docstrings: every `.py` starts with a triple-quoted description.
- 4-space indent, snake_case for functions/vars, PascalCase for classes.
- Stub functions use `pass` and a one-line docstring — replace with implementations.
- Tuple returns for multi-value functions.
- `__init__.py` files exist but empty — keep that way unless re-exports needed.

### Integration Points
- Phase 2 (LLM) will produce JSON matching `RULE_SCHEMA` and call `build_catalog` / `parse_catalog`. Don't break that contract.
- Phase 3 (Web) will import `check_eligibility` from both backends. Keep signatures stable.
- `src/shared/recommender.py` (Phase 2) will call into eligibility checking — needs both backends importable as a uniform interface.

</code_context>

<specifics>
## Specific Ideas

- Schema-driven impl: `build_rule` / `parse_rule` should walk the JSON shape defined in `RULE_SCHEMA`, not invent their own. Tests use `oop_catalog["CS146"]` etc. so the catalog dict must be keyed by course_id strings.
- `CourseRule` (OOP) and `CourseRule` (FP) both must support an optional `min_grade` field per `RULE_SCHEMA`.
- Explanation building can share helpers across paradigms via `src/shared/explain.py` if it doesn't violate FP purity (FP only consumes pure functions — fine).

</specifics>

<deferred>
## Deferred Ideas

- Co-requisite full semantics (CORQ-01, CORQ-02 in v2). The `in_progress` parameter is part of the signature but Phase 1 only uses it for explanation context, not as a way to satisfy a prereq.
- Concurrency / batch checking (CON-01, CON-02). Out of scope.
- Quantitative perf benchmarks (CON-03). Out of scope.

</deferred>
