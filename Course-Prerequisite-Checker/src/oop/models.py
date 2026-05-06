"""OOP implementation — class hierarchy for prerequisite rules."""

from src.shared.grades import grade_meets_minimum


class Course:
    """Represents a course with its prerequisite rule."""

    def __init__(self, course_id, name, rule=None):
        self.course_id = course_id
        self.name = name
        self.rule = rule  # Rule instance or None

    def __repr__(self):
        return f"Course({self.course_id!r}, {self.name!r})"


class Rule:
    """Base class for prerequisite rules. Subclasses implement evaluate()."""

    def evaluate(self, completed, in_progress, catalog):
        """Return (eligible: bool, unmet: list[str]).

        unmet is a list of human-readable descriptions of unmet requirements
        (e.g., 'missing CS46A', 'needs CS46A with C- or better (earned D)').
        Empty list when eligible is True.
        """
        raise NotImplementedError("Rule subclasses must implement evaluate()")


class CourseRule(Rule):
    """Requires a specific course, optionally with a minimum grade."""

    def __init__(self, course_id, min_grade=None):
        self.course_id = course_id
        self.min_grade = min_grade  # None means default C- threshold

    def evaluate(self, completed, in_progress, catalog):
        earned = completed.get(self.course_id)
        if earned is None:
            return False, [f"missing {self.course_id}"]
        threshold = self.min_grade if self.min_grade is not None else "C-"
        if not grade_meets_minimum(earned, threshold):
            return False, [
                f"needs {self.course_id} with {threshold} or better (earned {earned})"
            ]
        return True, []


class AndRule(Rule):
    """All sub-rules must be satisfied."""

    def __init__(self, requirements):
        self.requirements = list(requirements)  # list[Rule]

    def evaluate(self, completed, in_progress, catalog):
        unmet = []
        for req in self.requirements:
            ok, msgs = req.evaluate(completed, in_progress, catalog)
            if not ok:
                unmet.extend(msgs)
        return len(unmet) == 0, unmet


class OrRule(Rule):
    """At least one sub-rule must be satisfied."""

    def __init__(self, requirements):
        self.requirements = list(requirements)  # list[Rule]

    def evaluate(self, completed, in_progress, catalog):
        all_unmet = []
        for req in self.requirements:
            ok, msgs = req.evaluate(completed, in_progress, catalog)
            if ok:
                return True, []
            all_unmet.extend(msgs)
        # All branches failed — combine into a single OR message
        return False, [" OR ".join(all_unmet)]
