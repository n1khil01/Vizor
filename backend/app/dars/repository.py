"""Reads DARS data out of Supabase into plain dicts/lists.

Kept separate from app/dars/projection.py so the sequencing logic can be
unit-tested against fixture data without a database.
"""

from dataclasses import dataclass, field

from app.db.client import get_supabase


@dataclass
class DarsReport:
    report: dict
    requirements: list[dict]
    courses_by_requirement: dict[str, list[dict]] = field(default_factory=dict)
    prereqs: dict[str, list[str]] = field(default_factory=dict)


def load_dars_report(student_id: str) -> DarsReport | None:
    sb = get_supabase()

    report_result = (
        sb.table("dars_reports")
        .select("*")
        .eq("student_id", student_id)
        .order("prepared_on", desc=True)
        .limit(1)
        .execute()
    )
    if not report_result.data:
        return None
    report = report_result.data[0]

    requirements = (
        sb.table("dars_requirements")
        .select("*")
        .eq("report_id", report["id"])
        .order("seq")
        .execute()
        .data
    )

    requirement_ids = [r["id"] for r in requirements]
    courses_by_requirement: dict[str, list[dict]] = {rid: [] for rid in requirement_ids}
    if requirement_ids:
        courses = (
            sb.table("dars_courses")
            .select("*")
            .in_("requirement_id", requirement_ids)
            .execute()
            .data
        )
        for course in courses:
            courses_by_requirement[course["requirement_id"]].append(course)

    prereq_rows = sb.table("course_prereqs").select("*").execute().data
    prereqs: dict[str, list[str]] = {}
    for row in prereq_rows:
        prereqs.setdefault(row["course_code"], []).append(row["prereq_course_code"])

    return DarsReport(
        report=report,
        requirements=requirements,
        courses_by_requirement=courses_by_requirement,
        prereqs=prereqs,
    )
