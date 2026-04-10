# Course Prerequisite Checker

A Course Prerequisite Checker that determines whether a student is eligible to enroll in a course based on completed coursework, in-progress coursework, and structured prerequisite rules.

Built with two paradigm implementations (OOP and FP) to compare design trade-offs.

## Project Structure

```
src/
├── oop/              # Object-Oriented implementation
│   ├── models.py     # Course, Rule, AndRule, OrRule, MinGradeRule classes
│   └── checker.py    # OOP eligibility checker
├── fp/               # Functional Programming implementation
│   ├── types.py      # Data types (dataclasses/namedtuples)
│   └── checker.py    # Pure function eligibility checker
├── api/              # LLM integration
│   └── parser.py     # Parse natural-language prerequisites via LLM
├── shared/           # Shared utilities
│   ├── schemas.py    # JSON schema definitions
│   └── loader.py     # Load catalog/student data from JSON
tests/                # Shared test suite (both implementations must pass)
data/                 # Sample catalogs and student records (JSON)
```

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Team

- Andrian Than
- Lisa Yu
