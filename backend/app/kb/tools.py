"""The policy-KB tool the chat model can call (docs/PROJECT_PLAN.md §6.2)."""

from app.kb import service

TOOL_DEFS = [
    {
        "type": "function",
        "function": {
            "name": "search_policy_kb",
            "description": (
                "Semantic search over ASU policy, procedure, and directory content "
                "(clubs, internships, research/4+1 programs, how-to guides for forms "
                "like withdrawal, add/drop, change of major, transcripts, appeals). "
                "Never use this for degree-progress or 'am I on track' questions — "
                "those come from the DARS tools instead."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The student's question, in their own words."},
                    "doc_type": {
                        "type": "string",
                        "enum": ["directory", "procedural", "policy"],
                        "description": "Optional filter if the question is clearly one kind, e.g. 'procedural' for a how-do-I-submit-this-form question.",
                    },
                },
                "required": ["query"],
            },
        },
    },
]

_DISPATCH = {
    "search_policy_kb": service.search_policy_kb,
}


def call_kb_tool(name: str, arguments: dict) -> list[dict]:
    fn = _DISPATCH.get(name)
    if fn is None:
        raise ValueError(f"Unknown KB tool: {name}")
    return fn(**arguments)
