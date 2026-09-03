"""OpenAI-style tool schemas for the DARS tools, plus a name -> function
dispatch table for the chat tool loop (built in a later phase)."""

from app.dars import service

TOOL_DEFS = [
    {
        "type": "function",
        "function": {
            "name": "get_dars_summary",
            "description": (
                "Get the student's degree audit header: program, credits earned/"
                "required/needed, GPA, and overall verdict. Use for any question "
                "about overall degree progress or credit totals."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_unmet_requirements",
            "description": (
                "List every degree requirement the student has not yet satisfied, "
                "each flagged at_risk if its prerequisite chain can't fit in the "
                "terms remaining before their expected graduation term."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_graduation_projection",
            "description": (
                "Answer 'am I on track to graduate?'. Walks prerequisite chains "
                "for unsatisfied requirements against the terms remaining until "
                "expected graduation. Use this, not credit totals, for on-track "
                "questions — a student can have enough credits left and still miss "
                "their catalog year because of course sequencing."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_requirement_detail",
            "description": (
                "Get one requirement subtree (its status, credits, notes, courses "
                "applied, and any nested sub-requirements) by its code or title."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "Requirement code (e.g. 'CS-UD') or title, e.g. 'Computer Science Upper Division'.",
                    }
                },
                "required": ["category"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_courses_in_progress",
            "description": "List the courses the student is currently taking this term.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
]

_DISPATCH = {
    "get_dars_summary": service.get_dars_summary,
    "list_unmet_requirements": service.list_unmet_requirements,
    "get_graduation_projection": service.get_graduation_projection,
    "get_requirement_detail": service.get_requirement_detail,
    "get_courses_in_progress": service.get_courses_in_progress,
}


def call_dars_tool(name: str, student_id: str, arguments: dict) -> dict | list:
    fn = _DISPATCH.get(name)
    if fn is None:
        raise ValueError(f"Unknown DARS tool: {name}")
    return fn(student_id, **arguments)
