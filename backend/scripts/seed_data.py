"""Shared demo-persona data and DARS-insertion helpers.

Not meant to be run directly — `scripts/create_demo_users.py` creates the
Supabase Auth users first (since profiles.auth_user_id is a real FK) and
then calls into the helpers here. Run that script instead:

    uv run scripts/create_demo_users.py
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.client import get_supabase

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures" / "dars"

PEOPLE = [
    {
        "role": "advisor",
        "full_name": "Dr. Sarah Chen",
        "email": "schen@asu.edu",
    },
    {
        "role": "student",
        "full_name": "Jordan Alvarez",
        "email": "jalvarez@asu.edu",
        "student": {
            "advisor_email": "schen@asu.edu",
            "class_year": "Senior",
            "major": "BS Computer Science",
            "gpa": 3.98,
        },
        "dars_fixture": "sample.json",
    },
    {
        "role": "student",
        "full_name": "Morgan Reyes",
        "email": "mreyes@asu.edu",
        "student": {
            "advisor_email": "schen@asu.edu",
            "class_year": "Junior",
            "major": "BS Computer Science",
            "gpa": 2.59,
        },
        "dars_fixture": "sample-at-risk.json",
    },
]

COURSE_PREREQS = [
    ("CSE 310", "CSE 205", "required"),
    ("CSE 360", "CSE 310", "required"),
    ("CSE 485", "CSE 360", "required"),
    ("CSE 486", "CSE 485", "required"),
]


def load_dars_fixture(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text())


def insert_dars_report(sb, student_id: str, fixture: dict) -> None:
    report_row = {**fixture["report"], "student_id": student_id}
    report = sb.table("dars_reports").insert(report_row).execute().data[0]

    seq_to_id: dict[int, str] = {}
    for req in fixture["requirements"]:
        parent_id = seq_to_id.get(req.get("parent_seq"))
        row = {
            "report_id": report["id"],
            "parent_id": parent_id,
            "seq": req["seq"],
            "section_type": req["section_type"],
            "is_optional": req.get("is_optional", False),
            "code": req.get("code"),
            "title": req["title"],
            "description": req.get("description"),
            "status": req["status"],
            "credits_required": req.get("credits_required"),
            "credits_earned": req.get("credits_earned"),
            "credits_in_progress": req.get("credits_in_progress"),
            "groups_required": req.get("groups_required"),
            "notes": req.get("notes", []),
        }
        inserted = sb.table("dars_requirements").insert(row).execute().data[0]
        seq_to_id[req["seq"]] = inserted["id"]

        courses = [
            {**c, "requirement_id": inserted["id"]} for c in req.get("courses", [])
        ]
        if courses:
            sb.table("dars_courses").insert(courses).execute()


if __name__ == "__main__":
    raise SystemExit("Run scripts/create_demo_users.py instead — it creates the Supabase Auth users this data needs.")
