"""OOP implementation — class hierarchy for prerequisite rules."""


class Course:
    """Represents a course with its prerequisite rule."""
    pass


class Rule:
    """Base class for prerequisite rules."""
    pass


class CourseRule(Rule):
    """Requires a specific course, optionally with a minimum grade."""
    pass


class AndRule(Rule):
    """All sub-rules must be satisfied."""
    pass


class OrRule(Rule):
    """At least one sub-rule must be satisfied."""
    pass
