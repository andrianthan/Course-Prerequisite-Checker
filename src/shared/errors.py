"""Shared exception types for the prerequisite checker."""


class CycleError(Exception):
    """Raised when a course catalog contains a prerequisite cycle.

    The exception message includes the cycle path in the format:
    'Prerequisite cycle detected: A -> B -> A'.
    """
