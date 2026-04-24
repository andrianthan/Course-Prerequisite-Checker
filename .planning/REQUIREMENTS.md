# Requirements: Course Prerequisite Checker

**Defined:** 2026-04-24
**Core Value:** Demo must show transcript upload → course pick → eligible/not verdict with explanation, backed by both OOP and FP implementations producing identical results.

## v1 Requirements

### Core Logic — OOP

- [ ] **OOP-01**: OOP rule classes implemented (Course, Rule, CourseRule, AndRule, OrRule) with polymorphic `evaluate(completed, in_progress)` method
- [ ] **OOP-02**: OOP `build_catalog(catalog_data)` parses JSON catalog into Course objects with attached rules
- [ ] **OOP-03**: OOP `check_eligibility(course, completed, in_progress)` returns `(bool, explanation_str)` matching shared test expectations
- [ ] **OOP-04**: OOP CourseRule supports min-grade constraint (e.g., "C- or better")
- [ ] **OOP-05**: OOP cycle detection rejects catalogs where prereqs form a cycle

### Core Logic — FP

- [ ] **FP-01**: FP rule types implemented as frozen dataclasses (CourseRule, AndRule, OrRule, StudentRecord, CourseInfo) with no mutable state
- [ ] **FP-02**: FP `parse_catalog(catalog_data)` returns immutable catalog mapping
- [ ] **FP-03**: FP `check_eligibility(course, completed, in_progress)` returns `(bool, explanation_str)` matching shared test expectations
- [ ] **FP-04**: FP rule evaluation supports min-grade constraint via pure function
- [ ] **FP-05**: FP cycle detection on catalog parse

### Behavioral Parity

- [ ] **PAR-01**: All shared pytest tests in `tests/test_checker.py` pass for both OOP and FP backends with identical results
- [ ] **PAR-02**: Both backends produce identical explanation strings for the same input (or close-enough — explanation parity is target, exact-string parity not required)
- [ ] **PAR-03**: New parity tests added for min-grade and cycle detection cases

### LLM Integration

- [ ] **LLM-01**: `parse_prerequisites_text(text)` calls OpenRouter and returns structured rule JSON matching `RULE_SCHEMA`
- [ ] **LLM-02**: `parse_transcript_text(text)` calls OpenRouter and returns student record JSON (completed courses + grades)
- [ ] **LLM-03**: `parse_transcript_pdf(pdf_path)` extracts text from PDF (pypdf or pdfplumber), then delegates to `parse_transcript_text`
- [ ] **LLM-04**: LLM functions handle missing API key gracefully (clear error, no crash)

### Recommender

- [ ] **REC-01**: `get_eligible_courses(catalog, completed, in_progress)` returns list of courses student is eligible for but hasn't taken
- [ ] **REC-02**: `get_near_eligible_courses(catalog, completed, in_progress)` returns courses one prereq away from eligibility, with what's missing per course

### Web Backend (FastAPI)

- [ ] **API-01**: FastAPI app exposes endpoint to upload transcript PDF and receive parsed student record
- [ ] **API-02**: Endpoint to check eligibility for a target course given a student record, returning `(eligible, explanation)`
- [ ] **API-03**: Endpoint to list eligible courses for a student record
- [ ] **API-04**: Endpoint to list near-eligible courses with missing-prereq explanations
- [ ] **API-05**: Backend toggle (query param or header) to switch eligibility engine between OOP and FP at request time
- [ ] **API-06**: CORS configured for local React dev server
- [ ] **API-07**: Error responses follow consistent JSON shape

### Web Frontend (React)

- [ ] **UI-01**: User can upload transcript PDF on a landing page
- [ ] **UI-02**: After upload, parsed student record displayed (completed courses + grades) for confirmation
- [ ] **UI-03**: User can pick a target course from a dropdown/search of SJSU CS catalog and see verdict + explanation
- [ ] **UI-04**: User can view recommended courses (eligible + near-eligible with what's missing)
- [ ] **UI-05**: User can toggle OOP vs FP backend in UI to confirm identical results live (demo feature)
- [ ] **UI-06**: Visual polish — clean layout, readable typography, loading states, error states (graded demo)

### Deliverables (Non-Code)

- [ ] **DOC-01**: Final paper / report comparing OOP vs FP on readability, modularity, ease of extension, maintainability — references shared test suite as evidence of behavioral parity
- [ ] **DOC-02**: Slide deck for in-class presentation
- [ ] **DOC-03**: README updated with run instructions (backend + frontend, env setup, demo walkthrough)

## v2 Requirements

Deferred — not in current roadmap.

### Concurrency

- **CON-01**: `batch_check_eligibility(courses, student)` runs checks in parallel
- **CON-02**: Performance benchmark: sequential vs parallel timing for 100-course batch
- **CON-03**: Paper extended with quantitative perf section

### Co-requisites (full semantics)

- **CORQ-01**: Rule type that allows in-progress courses to satisfy prereq
- **CORQ-02**: Test cases for co-requisite eligibility

## Out of Scope

| Feature | Reason |
|---------|--------|
| Public deployment (Render/Vercel) | Localhost demo only — saves a phase, no infra risk on demo day |
| Authentication / multi-user | Single-user local demo |
| Persistent database | JSON files sufficient for demo scope |
| Catalogs beyond SJSU CS | Sample catalog covers demo needs |
| OCR for image-only PDFs | Assume text-extractable transcripts |
| Mobile app | Web demo only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| OOP-01 | TBD | Pending |
| OOP-02 | TBD | Pending |
| OOP-03 | TBD | Pending |
| OOP-04 | TBD | Pending |
| OOP-05 | TBD | Pending |
| FP-01 | TBD | Pending |
| FP-02 | TBD | Pending |
| FP-03 | TBD | Pending |
| FP-04 | TBD | Pending |
| FP-05 | TBD | Pending |
| PAR-01 | TBD | Pending |
| PAR-02 | TBD | Pending |
| PAR-03 | TBD | Pending |
| LLM-01 | TBD | Pending |
| LLM-02 | TBD | Pending |
| LLM-03 | TBD | Pending |
| LLM-04 | TBD | Pending |
| REC-01 | TBD | Pending |
| REC-02 | TBD | Pending |
| API-01 | TBD | Pending |
| API-02 | TBD | Pending |
| API-03 | TBD | Pending |
| API-04 | TBD | Pending |
| API-05 | TBD | Pending |
| API-06 | TBD | Pending |
| API-07 | TBD | Pending |
| UI-01 | TBD | Pending |
| UI-02 | TBD | Pending |
| UI-03 | TBD | Pending |
| UI-04 | TBD | Pending |
| UI-05 | TBD | Pending |
| UI-06 | TBD | Pending |
| DOC-01 | TBD | Pending |
| DOC-02 | TBD | Pending |
| DOC-03 | TBD | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 0 (filled by roadmapper)
- Unmapped: 35 ⚠️ (will be resolved when roadmap is created)

---
*Requirements defined: 2026-04-24*
*Last updated: 2026-04-24 after initial definition*
