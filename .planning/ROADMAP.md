# Roadmap: Course Prerequisite Checker

## Overview

Starting from a scaffolded repo with stubs and a shared test suite, this roadmap drives the project from non-functional skeleton to a graded demo artifact. Phase 1 makes the core logic real (OOP + FP, passing all tests). Phase 2 wires in LLM parsing and the recommender so the app can accept real transcripts. Phase 3 builds the FastAPI backend and React frontend that tie everything together into the demo. Phase 4 produces the paper, slides, and README for class submission.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Core Logic** - Implement OOP and FP checkers so both pass the shared pytest suite with behavioral parity
- [ ] **Phase 2: LLM + Recommender** - Wire in transcript/prereq parsing via OpenRouter and implement course recommender
- [ ] **Phase 3: Web App** - FastAPI backend + React frontend delivering the full demo flow
- [ ] **Phase 4: Deliverables** - Paper, slide deck, and polished README for class submission

## Phase Details

### Phase 1: Core Logic
**Goal**: Both OOP and FP eligibility checkers are fully implemented and produce identical results on all shared tests
**Depends on**: Nothing (first phase)
**Requirements**: OOP-01, OOP-02, OOP-03, OOP-04, OOP-05, FP-01, FP-02, FP-03, FP-04, FP-05, PAR-01, PAR-02, PAR-03
**Success Criteria** (what must be TRUE):
  1. `pytest tests/test_checker.py` passes with zero failures for both OOP and FP fixtures
  2. `check_eligibility` in both backends returns `(True, explanation)` for a student who meets all prereqs and `(False, explanation)` for one who does not
  3. A catalog with a prerequisite cycle is rejected at parse time (not at check time)
  4. A CourseRule with `min_grade` correctly rejects a student whose recorded grade is below the threshold
  5. New parity tests for min-grade and cycle-detection cases pass on both backends
**Plans:** 4 plans
Plans:
- [x] 01-01-PLAN.md — Shared foundation: grades.py, errors.py (CycleError), graph.py (DFS cycle detection)
- [ ] 01-02-PLAN.md — OOP backend: Rule class hierarchy + build_rule/build_catalog/check_eligibility (depends on 01-01)
- [x] 01-03-PLAN.md — FP backend: frozen dataclasses + parse_rule/parse_catalog/evaluate_rule/check_eligibility (depends on 01-01)
- [ ] 01-04-PLAN.md — PAR-03 tests: TestMinGrade and TestCycleDetection added to tests/test_checker.py (depends on 01-02 and 01-03)

### Phase 2: LLM + Recommender
**Goal**: The app can parse a real SJSU transcript PDF and natural-language prereq text into structured data, and can recommend what courses a student should take next
**Depends on**: Phase 1
**Requirements**: LLM-01, LLM-02, LLM-03, LLM-04, REC-01, REC-02
**Success Criteria** (what must be TRUE):
  1. Calling `parse_transcript_pdf(path)` with a real SJSU transcript PDF returns a valid student record (completed courses + grades) without crashing
  2. Calling `parse_prerequisites_text("CS46A with C- or better")` returns a JSON rule object that validates against `RULE_SCHEMA`
  3. Running the app without `OPENROUTER_API_KEY` set produces a clear error message instead of a crash or silent `None`
  4. `get_eligible_courses` returns only courses the student has not yet taken and whose prereqs are fully met
  5. `get_near_eligible_courses` identifies courses exactly one missing prereq away and names what is missing
**Plans**: TBD

### Phase 3: Web App
**Goal**: A student can open the app in a browser, upload a transcript, pick a target course, and see a correct verdict — with the demo toggle showing OOP and FP returning identical results
**Depends on**: Phase 2
**Requirements**: API-01, API-02, API-03, API-04, API-05, API-06, API-07, UI-01, UI-02, UI-03, UI-04, UI-05, UI-06
**Success Criteria** (what must be TRUE):
  1. Uploading a transcript PDF in the browser produces a displayed list of completed courses and grades within a few seconds
  2. Selecting a target course shows a clear eligible or not-eligible verdict with a human-readable explanation
  3. The recommended-courses view shows eligible courses and near-eligible courses with missing prereqs named
  4. Toggling the OOP/FP switch in the UI and re-checking a course shows identical verdict and explanation for both backends
  5. The UI has clean layout, readable typography, loading spinners during API calls, and visible error messages on failure
**Plans**: TBD
**UI hint**: yes

### Phase 4: Deliverables
**Goal**: Paper, slide deck, and README exist and are demo-ready for class submission
**Depends on**: Phase 3
**Requirements**: DOC-01, DOC-02, DOC-03
**Success Criteria** (what must be TRUE):
  1. The paper compares OOP vs FP on readability, modularity, ease of extension, and maintainability using the shared test suite as concrete evidence
  2. The slide deck walks through the demo flow and summarizes the paradigm comparison findings
  3. A new developer can boot the full app (backend + frontend) by following README instructions without prior context
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Logic | 0/TBD | Not started | - |
| 2. LLM + Recommender | 0/TBD | Not started | - |
| 3. Web App | 0/TBD | Not started | - |
| 4. Deliverables | 0/TBD | Not started | - |
