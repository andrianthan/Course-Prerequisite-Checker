"""Load catalog and student record data from JSON files."""

import json


def load_json(file_path):
    """Load and return parsed JSON from a file."""
    with open(file_path, "r") as f:
        return json.load(f)


def load_catalog(file_path):
    """Load a course catalog from a JSON file."""
    return load_json(file_path)


def load_student(file_path):
    """Load a student record from a JSON file."""
    return load_json(file_path)
