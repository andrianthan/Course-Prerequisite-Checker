"""Shared grade ordering and comparison utilities."""

GRADE_ORDER = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"]

NON_PASSING = {"D+", "D", "D-", "F", "W", "I"}


def grade_meets_minimum(earned: str, minimum: str) -> bool:
    """Return True if earned grade is at least as good as minimum required."""
    if earned not in GRADE_ORDER or minimum not in GRADE_ORDER:
        return False
    return GRADE_ORDER.index(earned) <= GRADE_ORDER.index(minimum)


def is_passing(grade: str) -> bool:
    """Return True if grade meets default C- passing threshold."""
    return grade_meets_minimum(grade, "C-")
