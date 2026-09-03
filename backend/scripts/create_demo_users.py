"""Creates (or reuses) the demo advisor/student auth accounts, then seeds
profiles/students/DARS data for them in one go.

    uv run scripts/create_demo_users.py

Demo login passwords are printed at the end — share them with whoever is
driving the extension/advisor-app demo.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.client import get_supabase
from scripts.seed_data import PEOPLE, COURSE_PREREQS, load_dars_fixture, insert_dars_report

DEMO_PASSWORD = "VizorDemo2026!"


def get_or_create_auth_user(sb, email: str) -> str:
    existing = sb.auth.admin.list_users()
    for u in existing:
        if u.email == email:
            return u.id
    created = sb.auth.admin.create_user(
        {
            "email": email,
            "password": DEMO_PASSWORD,
            "email_confirm": True,
        }
    )
    return created.user.id


def main() -> None:
    sb = get_supabase()

    email_to_profile_id: dict[str, str] = {}

    advisors = [p for p in PEOPLE if p["role"] == "advisor"]
    students = [p for p in PEOPLE if p["role"] == "student"]

    for person in advisors:
        auth_id = get_or_create_auth_user(sb, person["email"])
        row = sb.table("profiles").insert(
            {
                "auth_user_id": auth_id,
                "role": "advisor",
                "full_name": person["full_name"],
                "email": person["email"],
            }
        ).execute().data[0]
        email_to_profile_id[person["email"]] = row["id"]
        print(f"advisor: {person['email']}")

    for person in students:
        auth_id = get_or_create_auth_user(sb, person["email"])
        row = sb.table("profiles").insert(
            {
                "auth_user_id": auth_id,
                "role": "student",
                "full_name": person["full_name"],
                "email": person["email"],
            }
        ).execute().data[0]
        student_profile_id = row["id"]
        email_to_profile_id[person["email"]] = student_profile_id

        s = person["student"]
        sb.table("students").insert(
            {
                "profile_id": student_profile_id,
                "advisor_id": email_to_profile_id[s["advisor_email"]],
                "class_year": s["class_year"],
                "major": s["major"],
                "gpa": s["gpa"],
            }
        ).execute()

        fixture = load_dars_fixture(person["dars_fixture"])
        insert_dars_report(sb, student_profile_id, fixture)
        print(f"student: {person['email']} + DARS report")

    prereq_rows = [
        {"course_code": c, "prereq_course_code": p, "prereq_type": t}
        for c, p, t in COURSE_PREREQS
    ]
    sb.table("course_prereqs").insert(prereq_rows).execute()
    print(f"seeded {len(prereq_rows)} course_prereqs rows")

    print(f"\nDemo password for all accounts: {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
