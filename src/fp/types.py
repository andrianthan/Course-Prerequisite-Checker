"""FP implementation — rules as immutable data types."""

from dataclasses import dataclass


@dataclass(frozen=True)
class CourseRule:
    pass


@dataclass(frozen=True)
class AndRule:
    pass


@dataclass(frozen=True)
class OrRule:
    pass


@dataclass(frozen=True)
class StudentRecord:
    pass


@dataclass(frozen=True)
class CourseInfo:
    pass
