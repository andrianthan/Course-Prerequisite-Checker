"""JSON schema definitions for course catalogs and student records."""

RULE_SCHEMA = {
    "oneOf": [
        {
            "type": "object",
            "properties": {
                "type": {"const": "course"},
                "course_id": {"type": "string"},
                "min_grade": {"type": "string"},
            },
            "required": ["type", "course_id"],
        },
        {
            "type": "object",
            "properties": {
                "type": {"enum": ["and", "or"]},
                "requirements": {
                    "type": "array",
                    "items": {"$ref": "#"},
                },
            },
            "required": ["type", "requirements"],
        },
    ]
}
