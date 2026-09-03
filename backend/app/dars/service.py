"""The five DARS tools the chat model can call (docs/PROJECT_PLAN.md §6.1).

Every function reads what DARS already states — no requirement's earned/
required numbers are recomputed here. `get_graduation_projection` is the
one place that goes a step beyond the audit (prerequisite sequencing), and
its logic lives in app/dars/projection.py.
"""

from app.dars.projection import assess_requirement, current_term, graduation_projection
from app.dars.repository import DarsReport, load_dars_report
from app.dars.terms import terms_between

HONORS_THRESHOLDS = [
    ("summa cum laude", 3.80),
    ("magna cum laude", 3.60),
    ("cum laude", 3.40),
]


class NoDarsReport(Exception):
    pass


def _require_report(student_id: str) -> DarsReport:
    report = load_dars_report(student_id)
    if report is None:
        raise NoDarsReport(f"No DARS report on file for student {student_id}")
    return report


def _latin_honors(asu_gpa: float | None) -> str | None:
    if asu_gpa is None:
        return None
    for label, threshold in HONORS_THRESHOLDS:
        if asu_gpa >= threshold:
            return label
    return None


def get_dars_summary(student_id: str) -> dict:
    report = _require_report(student_id).report
    return {
        "program": report["program"],
        "college": report["college"],
        "catalog_year": report["catalog_year"],
        "expected_grad_term": report["expected_grad_term"],
        "prepared_on": report["prepared_on"],
        "overall_status": report["overall_status"],
        "status_code": report["status_code"],
        "credits_earned": report["credits_earned"],
        "credits_required": report["credits_required"],
        "credits_needed": report["credits_needed"],
        "credits_in_progress": report["credits_in_progress"],
        "asu_gpa": report["asu_gpa"],
        "major_gpa": report["major_gpa"],
        "latin_honors_if_graduated_today": _latin_honors(report["asu_gpa"]),
    }


def list_unmet_requirements(student_id: str) -> list[dict]:
    dars = _require_report(student_id)
    now = current_term(dars)
    expected = dars.report.get("expected_grad_term")
    terms_remaining = terms_between(now, expected) if now and expected else None

    out = []
    for req in dars.requirements:
        if req["status"] != "not_satisfied":
            continue
        risk = assess_requirement(req, dars, terms_remaining)
        out.append(
            {
                "code": req["code"],
                "title": req["title"],
                "section_type": req["section_type"],
                "credits_required": req["credits_required"],
                "credits_earned": req["credits_earned"],
                "credits_in_progress": req["credits_in_progress"],
                "notes": req["notes"],
                "at_risk": risk.at_risk,
                "needed_course": risk.needed_course,
            }
        )
    return out


def get_graduation_projection(student_id: str) -> dict:
    dars = _require_report(student_id)
    return graduation_projection(dars)


def get_requirement_detail(student_id: str, category: str) -> dict:
    """`category` matches a requirement's `code` (e.g. "CS-UD") or its
    title, case-insensitively either way, and returns that requirement plus
    its nested sub-requirements and courses."""
    dars = _require_report(student_id)
    needle = category.strip().lower()

    match = next(
        (
            r
            for r in dars.requirements
            if (r.get("code") or "").lower() == needle or r["title"].lower() == needle
        ),
        None,
    )
    if match is None:
        match = next(
            (
                r
                for r in dars.requirements
                if needle in (r.get("code") or "").lower() or needle in r["title"].lower()
            ),
            None,
        )
    if match is None:
        return {"found": False, "category": category}

    def serialize(req: dict) -> dict:
        children = [r for r in dars.requirements if r.get("parent_id") == req["id"]]
        return {
            "code": req.get("code"),
            "title": req["title"],
            "description": req.get("description"),
            "status": req["status"],
            "credits_required": req.get("credits_required"),
            "credits_earned": req.get("credits_earned"),
            "credits_in_progress": req.get("credits_in_progress"),
            "notes": req.get("notes") or [],
            "courses": dars.courses_by_requirement.get(req["id"], []),
            "sub_requirements": [serialize(c) for c in children],
        }

    return {"found": True, "requirement": serialize(match)}


def get_courses_in_progress(student_id: str) -> list[dict]:
    dars = _require_report(student_id)
    courses = [c for courses in dars.courses_by_requirement.values() for c in courses]
    return [c for c in courses if c["is_in_progress"]]
