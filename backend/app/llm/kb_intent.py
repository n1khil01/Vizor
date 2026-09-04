"""Detects a question that should be grounded in the policy KB rather than
answered from the model's own training data.

Same problem as app/llm/escalation_intent.py, different tool: verified
against the real ASU gateway, the model answered "how do I withdraw from a
course?" in generic prose without calling search_policy_kb at all, even
though the seeded KB entry — with the real deadline and steps — was a 0.79
cosine-similarity match away (docs/PROJECT_PLAN.md §11). Scoped to the
topics the curated KB actually covers (see backend/seeds.yaml); this is not
a general "is this a question" classifier.
"""

import re

_PATTERNS = [
    r"\bwithdraw",
    r"\badd\s*/?\s*drop\b",
    r"\bdrop (a |this |my )?(course|class)\b",
    r"\bchange (of |my )?major\b",
    r"\bswitch(ing)? (my )?major\b",
    r"\btranscript\b",
    r"\bsuspen(d|sion)\b",
    r"\bappeal\b",
    r"\bpetition\b",
    r"\blate (add|drop)\b",
    r"\bdeadline\b",
    r"\b(fill out|submit|file) (a |an |the )?form\b",
    r"\bclub(s)?\b",
    r"\bstudent org",
    r"\binternship",
    r"\bresearch opportunit",
    r"\b4\s*\+\s*1\b",
    r"\baccelerated master",
]
_COMPILED = [re.compile(p, re.IGNORECASE) for p in _PATTERNS]


def wants_policy_lookup(text: str) -> bool:
    return any(p.search(text) for p in _COMPILED)
