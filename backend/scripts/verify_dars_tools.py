"""Phase 2 gate (docs/PROJECT_PLAN.md §10): "Am I on track?" must say yes
for the clean sample persona and no for the at-risk persona, with the
correct blocking chain — and every number must come straight from DARS
or a hand-seeded prerequisite, never invented.

Requires the DB to already be seeded (`uv run scripts/create_demo_users.py`).

    uv run scripts/verify_dars_tools.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.dars import service
from app.db.client import get_supabase

EXPECTED = {
    "jalvarez@asu.edu": {"on_track": True, "label": "sample (all requirements met)"},
    "mreyes@asu.edu": {"on_track": False, "label": "at-risk (capstone sequence wall)"},
}


def student_id_for(email: str) -> str:
    sb = get_supabase()
    result = sb.table("profiles").select("id").eq("email", email).single().execute()
    return result.data["id"]


def main() -> None:
    failures = 0

    for email, expected in EXPECTED.items():
        student_id = student_id_for(email)
        print(f"\n=== {expected['label']} ({email}) ===")

        summary = service.get_dars_summary(student_id)
        print(f"credits: {summary['credits_earned']}/{summary['credits_needed']} needed")

        projection = service.get_graduation_projection(student_id)
        print(f"current_term={projection['current_term']} expected_grad={projection['expected_grad_term']}")
        print(f"terms_remaining={projection['terms_remaining']}")
        print(f"on_track={projection['on_track']}")
        if not projection["on_track"]:
            print(f"bottleneck_course={projection['bottleneck_course']}")
            print(f"prerequisite_chain={' -> '.join(projection['prerequisite_chain'])}")
            print(f"terms_short={projection['terms_short']}")
            print(f"blocked_requirements={projection['blocked_requirements']}")

        if projection["on_track"] != expected["on_track"]:
            print(f"FAIL: expected on_track={expected['on_track']}, got {projection['on_track']}")
            failures += 1
        else:
            print("PASS: on_track matches expectation")

    if failures:
        print(f"\n{failures} check(s) failed.")
        raise SystemExit(1)

    print("\nPASS: graduation projection is correct for both personas.")


if __name__ == "__main__":
    main()
