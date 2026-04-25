"""FP implementation — rules as immutable data types."""
from dataclasses import dataclass
from typing import Optional, Tuple


@dataclass(frozen=True)
class CourseRule:
    """Requires a specific course, optionally with a minimum grade."""
    course_id: str
    min_grade: Optional[str] = None


@dataclass(frozen=True)
class AndRule:
    """All sub-rules must be satisfied."""
    requirements: tuple  # Tuple[Rule, ...]


@dataclass(frozen=True)
class OrRule:
    """At least one sub-rule must be satisfied."""
    requirements: tuple  # Tuple[Rule, ...]


@dataclass(frozen=True)
class CourseInfo:
    """Catalog entry: course metadata plus its prerequisite rule."""
    course_id: str
    name: str
    prerequisite: object = None  # CourseRule | AndRule | OrRule | None


@dataclass(frozen=True)
class StudentRecord:
    """A student's academic record (immutable)."""
    completed: tuple    # tuple[tuple[str, str], ...]  -- (course_id, grade) pairs
    in_progress: tuple  # tuple[str, ...]
