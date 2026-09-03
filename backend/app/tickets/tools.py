"""The escalation tool the chat model can call (docs/PROJECT_PLAN.md §4.2).

Unlike the DARS/KB tools, this one doesn't hit the database — calling it
just validates the model's drafted escalation and hands it back untouched.
The tool loop special-cases this name to end the round early: the chat
router surfaces the draft to the student as an `escalation` SSE event, and
the ticket itself is only created once the student confirms via
`POST /tickets` (docs/PROJECT_PLAN.md §4.2 — "the student can edit it
before sending").
"""

NAME = "escalate_to_advisor"

TOOL_DEFS = [
    {
        "type": "function",
        "function": {
            "name": NAME,
            "description": (
                "Escalate to the student's advisor when you cannot resolve the "
                "question yourself — e.g. it needs a judgment call about the "
                "student's specific situation, or requires an action only an "
                "advisor can take. Produces a draft the student reviews and can "
                "edit before it's sent; this does not send anything on its own."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": "Why you couldn't resolve this yourself — what the advisor most wants to know.",
                    },
                    "summary": {
                        "type": "string",
                        "description": (
                            "Annotated report for the advisor: category of the issue, what the "
                            "student actually needs, and what you already tried or ruled out."
                        ),
                    },
                    "category": {
                        "type": "string",
                        "description": "Short category label, e.g. 'change of major', 'graduation timeline', 'course substitution'.",
                    },
                    "draft_subject": {
                        "type": "string",
                        "description": "Subject line for the email-style message to the advisor.",
                    },
                    "draft_body": {
                        "type": "string",
                        "description": "Body of the email-style message, written as if from the student, in their voice.",
                    },
                },
                "required": ["reason", "summary", "draft_subject", "draft_body"],
            },
        },
    },
]


def build_escalation_draft(
    reason: str,
    summary: str,
    draft_subject: str,
    draft_body: str,
    category: str | None = None,
) -> dict:
    """No-op validation pass — the arguments the model produced *are* the
    draft. Kept as a function (rather than inlining in the dispatch table)
    so the tool loop's dispatch pattern stays uniform with DARS/KB."""
    return {
        "reason": reason,
        "summary": summary,
        "category": category,
        "draft_subject": draft_subject,
        "draft_body": draft_body,
    }


def call_ticket_tool(name: str, arguments: dict) -> dict:
    if name != NAME:
        raise ValueError(f"Unknown ticket tool: {name}")
    return build_escalation_draft(**arguments)
