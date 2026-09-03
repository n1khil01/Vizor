"""Phase 3 gate (docs/PROJECT_PLAN.md §10 phase 3, §6.4): each of the KB-
answerable §6.4 questions should retrieve a chunk from the expected source
document. Retrieval quality as a number to watch, not a vibe.

Requires `uv run scripts/ingest_kb.py all` to have been run first.

    uv run scripts/verify_kb_retrieval.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.kb.service import search_policy_kb

# (question, substring expected in the top result's source_url or title)
EVAL_SET = [
    ("I filled out a form and still had to book a meeting, what am I missing on withdrawal", "course-withdrawal"),
    ("how do I drop a class without it showing up as a W", "add-drop"),
    ("I want to switch my major, what do I need to do", "change-of-major"),
    ("how do I get an official transcript sent to a grad school", "transcript-request"),
    ("I'm on academic suspension, how do I appeal", "academic-standing-appeal"),
    ("what accelerated masters programs can I apply to", "acceleratedmasters"),
]


def main() -> None:
    passed = 0
    for question, expected in EVAL_SET:
        results = search_policy_kb(question)
        top = results[0] if results else None
        top_source = (top or {}).get("source_url", "") or ""
        top_title = (top or {}).get("title", "") or ""
        ok = expected in top_source or expected.replace("-", " ") in top_title.lower()

        status = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        print(f"[{status}] {question!r}")
        print(f"       expected~{expected!r}  got: {top_title!r} ({top_source})")

    print(f"\n{passed}/{len(EVAL_SET)} passed")
    sys.exit(0 if passed == len(EVAL_SET) else 1)


if __name__ == "__main__":
    main()
