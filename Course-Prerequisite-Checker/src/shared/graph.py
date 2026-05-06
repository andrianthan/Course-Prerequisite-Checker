"""Prerequisite dependency graph utilities — cycle detection at parse time."""

from src.shared.errors import CycleError


def _get_prereq_course_ids(rule_data):
    """Recursively extract all course_id leaves from a raw rule dict.

    Returns an empty set when rule_data is None. Walks nested AND/OR
    requirement lists. Ignores fields outside RULE_SCHEMA (e.g., min_grade).
    """
    if rule_data is None:
        return set()
    if rule_data.get("type") == "course":
        return {rule_data["course_id"]}
    result = set()
    for req in rule_data.get("requirements", []):
        result |= _get_prereq_course_ids(req)
    return result


def _detect_cycles(catalog_data):
    """Raise CycleError if any cycle exists in the prerequisite graph.

    Reads only `catalog_data["courses"]`. For each course, only the
    `prerequisites` field is used to derive edges — `corequisites`,
    `raw_text`, and any other extra fields are silently ignored.

    Algorithm: DFS with `visited` and `rec_stack` sets. O(V+E).
    """
    courses = catalog_data.get("courses", {})
    visited = set()
    rec_stack = set()

    def dfs(course_id, path):
        if course_id in rec_stack:
            cycle_start = path.index(course_id) if course_id in path else 0
            cycle_path = " -> ".join(path[cycle_start:] + [course_id])
            raise CycleError(f"Prerequisite cycle detected: {cycle_path}")
        if course_id in visited:
            return
        visited.add(course_id)
        rec_stack.add(course_id)
        prereq_data = courses.get(course_id, {}).get("prerequisites")
        for prereq_id in _get_prereq_course_ids(prereq_data):
            dfs(prereq_id, path + [course_id])
        rec_stack.discard(course_id)

    for course_id in courses:
        dfs(course_id, [])
