"""OOP eligibility checker — uses the Rule class hierarchy."""

from src.oop.models import Course, CourseRule, AndRule, OrRule
from src.shared.graph import _detect_cycles
from src.shared.errors import CycleError  # re-exported for callers; raised by _detect_cycles


def build_rule(rule_data):
    """Recursively build a Rule object from a JSON rule dict.

    Returns None when rule_data is None (no-prerequisite case).
    Raises ValueError on unknown rule types.
    """
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
            requirements=[build_rule(r) for r in rule_data["requirements"]]
        )
    elif rule_type == "or":
        return OrRule(
            requirements=[build_rule(r) for r in rule_data["requirements"]]
        )
    else:
        raise ValueError(f"Unknown rule type: {rule_type!r}")


def build_catalog(catalog_data):
    """Build a {course_id: Course} dict from catalog JSON.

    Raises CycleError (from src.shared.errors) at parse time if any
    prerequisite cycle exists. Ignores extra fields like 'corequisites'
    and 'raw_text' — only 'name' and 'prerequisites' are read per course.
    """
    _detect_cycles(catalog_data)  # Fail fast before constructing any Course objects
    catalog = {}
    for course_id, course_dict in catalog_data["courses"].items():
        rule = build_rule(course_dict.get("prerequisites"))
        catalog[course_id] = Course(
            course_id=course_id,
            name=course_dict["name"],
            rule=rule,
        )
    return catalog


def check_eligibility(course, completed, in_progress):
    """Return (eligible: bool, explanation: str) for a Course object.

    First arg is a Course (the value from the catalog dict), NOT a string.
    Explanation format is locked by CONTEXT.md:
      - No prereqs:      "Eligible: no prerequisites"
                         or "Eligible: <list of completed courses with grades>"
      - Met:             "Eligible"  (optionally enriched with completed prereqs)
      - Not met:         "Not eligible: <comma-joined unmet messages>"
    """
    rule = course.rule
    if rule is None:
        if completed:
            parts = [f"{cid} ({grade})" for cid, grade in completed.items()]
            return True, "Eligible: " + ", ".join(parts)
        return True, "Eligible: no prerequisites"

    ok, unmet = rule.evaluate(completed, in_progress, {})
    if ok:
        return True, "Eligible"
    return False, "Not eligible: " + ", ".join(unmet)
