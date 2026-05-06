"""FP eligibility checker — pure functions, no mutable state."""
from src.fp.types import CourseRule, AndRule, OrRule, CourseInfo
from src.shared.grades import grade_meets_minimum
from src.shared.graph import _detect_cycles
from src.shared.errors import CycleError  # re-exported; raised by _detect_cycles


def evaluate_rule(rule, completed, in_progress, catalog):
    """Pure recursive evaluator.

    Returns (eligible: bool, unmet: list[str]).

    rule: CourseRule | AndRule | OrRule | None
    completed: dict[str, str]   -- course_id -> earned grade
    in_progress: tuple[str, ...] -- accepted but not used to satisfy prereqs (Phase 1)
    catalog: dict               -- accepted for signature parity; not consulted in Phase 1
    """
    match rule:
        case None:
            return True, []
        case CourseRule(course_id=cid, min_grade=mg):
            earned = completed.get(cid)
            if earned is None:
                return False, [f"missing {cid}"]
            threshold = mg if mg is not None else "C-"
            if not grade_meets_minimum(earned, threshold):
                return False, [
                    f"needs {cid} with {threshold} or better (earned {earned})"
                ]
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
        case _:
            raise ValueError(f"Unknown rule shape: {rule!r}")


def parse_rule(rule_data):
    """Recursively parse a rule dict into an immutable rule dataclass.

    Returns None when rule_data is None. Raises ValueError on unknown types.
    Always uses tuple (not list) for AndRule/OrRule requirements — frozen
    dataclasses require hashable fields.
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
            requirements=tuple(parse_rule(r) for r in rule_data["requirements"])
        )
    elif rule_type == "or":
        return OrRule(
            requirements=tuple(parse_rule(r) for r in rule_data["requirements"])
        )
    else:
        raise ValueError(f"Unknown rule type: {rule_type!r}")


def parse_catalog(catalog_data):
    """Build a {course_id: CourseInfo} dict from catalog JSON.

    Raises CycleError at parse time if any prerequisite cycle exists.
    Reads only 'name' and 'prerequisites' per course — extras like
    'corequisites' and 'raw_text' are silently ignored.
    """
    _detect_cycles(catalog_data)
    return {
        course_id: CourseInfo(
            course_id=course_id,
            name=course_dict["name"],
            prerequisite=parse_rule(course_dict.get("prerequisites")),
        )
        for course_id, course_dict in catalog_data["courses"].items()
    }


def check_eligibility(course_info, completed, in_progress):
    """Return (eligible: bool, explanation: str) for a CourseInfo.

    First arg is a CourseInfo dataclass (the value from the catalog dict),
    NOT a string. Explanation format mirrors OOP for parity:
      - No prereqs:      'Eligible: no prerequisites' or 'Eligible: <list>'
      - Met:             'Eligible'
      - Not met:         'Not eligible: <comma-joined unmet>'
    """
    rule = course_info.prerequisite
    if rule is None:
        if completed:
            parts = [f"{cid} ({grade})" for cid, grade in completed.items()]
            return True, "Eligible: " + ", ".join(parts)
        return True, "Eligible: no prerequisites"

    ok, unmet = evaluate_rule(rule, completed, in_progress, {})
    if ok:
        return True, "Eligible"
    return False, "Not eligible: " + ", ".join(unmet)
