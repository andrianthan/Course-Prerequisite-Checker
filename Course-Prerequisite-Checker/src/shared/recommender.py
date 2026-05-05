"""Course recommendation engine — determines what a student can take next."""

from typing import Callable, Optional

_NOT_ELIGIBLE_PREFIX = "Not eligible: "


def _default_check_eligibility():
    """Lazy import of OOP check_eligibility to avoid circular deps at module load."""
    from src.oop.checker import check_eligibility
    return check_eligibility


def get_eligible_courses(
    catalog: dict,
    completed: dict,
    in_progress,
    check_eligibility: Optional[Callable] = None,
) -> list:
    """Return list of (course_id, course) the student is eligible for but hasn't taken.

    catalog: {course_id: Course or CourseInfo} from build_catalog / parse_catalog
    completed: {course_id: grade_str}
    in_progress: list or tuple of course_ids currently enrolled
    check_eligibility: callable matching (course, completed, in_progress) -> (bool, str).
        Defaults to OOP backend. Pass fp_check for FP backend.

    Returns list of (course_id, course) pairs sorted by course_id.
    """
    if check_eligibility is None:
        check_eligibility = _default_check_eligibility()

    already_done = set(completed.keys()) | set(in_progress)
    result = []
    for course_id, course in catalog.items():
        if course_id in already_done:
            continue
        eligible, _ = check_eligibility(course, completed, in_progress)
        if eligible:
            result.append((course_id, course))
    result.sort(key=lambda pair: pair[0])
    return result


def get_near_eligible_courses(
    catalog: dict,
    completed: dict,
    in_progress,
    check_eligibility: Optional[Callable] = None,
) -> list:
    """Return list of (course_id, course, missing_str) for courses one prereq away.

    A course is "near-eligible" if the student is not yet eligible and the
    check_eligibility explanation describes exactly one unmet top-level condition
    (i.e., the "Not eligible: X" suffix has exactly one comma-separated item).

    missing_str: the single unmet condition as described by check_eligibility
    (e.g., "missing CS46A" or "needs CS42 with C- or better (earned D+)").

    Known limitation: nested OrRule conditions may collapse to one item even when
    multiple alternatives exist. This is acceptable for demo scope.

    Returns list of (course_id, course, missing_str) sorted by course_id.
    """
    if check_eligibility is None:
        check_eligibility = _default_check_eligibility()

    already_done = set(completed.keys()) | set(in_progress)
    result = []
    for course_id, course in catalog.items():
        if course_id in already_done:
            continue
        eligible, explanation = check_eligibility(course, completed, in_progress)
        if eligible:
            continue
        if not explanation.startswith(_NOT_ELIGIBLE_PREFIX):
            continue
        missing_part = explanation[len(_NOT_ELIGIBLE_PREFIX):]
        unmet_items = [item.strip() for item in missing_part.split(",") if item.strip()]
        if len(unmet_items) == 1:
            result.append((course_id, course, unmet_items[0]))
    result.sort(key=lambda triple: triple[0])
    return result
