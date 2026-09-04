"""Detects an explicit request to reach the student's advisor.

Prompt guidance alone doesn't hold: verified against the real ASU gateway,
the model would rather ask another clarifying question than call
`escalate_to_advisor` — even for "email my advisor" and "set up a meeting"
(docs/PROJECT_PLAN.md §11). This is a narrow, keyword-based backstop for the
unambiguous case — the student directly asking to reach a person — not a
general escalation classifier. Everything else stays the model's judgment
call; see `app/llm/tool_loop.py`'s `force_escalation` handling.
"""

import re

_PATTERNS = [
    r"\bescalate\b",
    r"\b(talk|speak|chat|meet|connect)\w*\b[^.?!]{0,25}\badvisor\b",
    r"\badvisor\b[^.?!]{0,25}\b(talk|speak|chat|meet|connect)\w*\b",
    r"\b(email|contact|reach|message|forward)\w*\b[^.?!]{0,20}\b(my |the )?advisor\b",
    r"\b(set up|schedule|book)\b[^.?!]{0,20}\bmeeting\b",
    r"\b(open|file|start)\b[^.?!]{0,10}\bticket\b",
]
_COMPILED = [re.compile(p, re.IGNORECASE) for p in _PATTERNS]


def wants_advisor_escalation(text: str) -> bool:
    return any(p.search(text) for p in _COMPILED)
