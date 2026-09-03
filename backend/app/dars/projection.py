""""Am I on track to graduate?" — sequencing, not credit arithmetic.

See docs/PROJECT_PLAN.md §6.1. DARS states earned-vs-required per
requirement; it does not say whether the remaining requirements can still
be finished by the catalog-year timeline given prerequisite ordering. This
module derives that, and only that — it never recomputes credit totals,
which DARS already states authoritatively.
"""

import re
from dataclasses import dataclass

from app.dars.repository import DarsReport
from app.dars.terms import latest_term, terms_between

FAIL_GRADES = {"E", "EN", "W", "XE"}
_NEEDS_COURSE_RE = re.compile(r"NEEDS:\s*([A-Z]{2,4}\s?\d{3})")


def _all_courses(report: DarsReport) -> list[dict]:
    return [c for courses in report.courses_by_requirement.values() for c in courses]


def current_term(report: DarsReport) -> str | None:
    """The most recent term appearing anywhere in the audit — DARS lists
    in-progress work under the term it's being taken, so this is "now"."""
    return latest_term([c["term"] for c in _all_courses(report) if c.get("term")])


def course_status(course_code: str, all_courses: list[dict]) -> str:
    """'completed' | 'in_progress' | 'not_started', from every line for that
    course across the whole report (a retake after a fail still counts as
    completed once a passing attempt exists)."""
    rows = [c for c in all_courses if c["course_code"] == course_code]
    if any(c["grade_type"] == "graded" and c.get("grade") not in FAIL_GRADES for c in rows):
        return "completed"
    if any(c["grade_type"] == "in_progress" for c in rows):
        return "in_progress"
    return "not_started"


def needed_course_code(requirement: dict) -> str | None:
    """Pull the specific course a not_satisfied requirement is blocked on,
    from its `NEEDS: <CODE>` note. Requirements whose NEEDS is a credit
    count (e.g. `NEEDS: 6.00 HOURS`) return None — there's no single course
    to chain-walk, so they're a credit gap, not a sequencing risk."""
    for note in requirement.get("notes") or []:
        match = _NEEDS_COURSE_RE.search(note)
        if match:
            return match.group(1)
    return None


def chain_length(course_code: str, prereqs: dict[str, list[str]], all_courses: list[dict]) -> int:
    """Terms of *future* work needed before `course_code` is completed,
    walking required prerequisites. A completed or in-progress course costs
    nothing further (in-progress means its own prereqs already cleared);
    an unstarted course costs one term plus whatever its hardest
    unstarted prerequisite still needs, since demo scope assumes one
    prerequisite course can be taken per term (see §6.1)."""
    status = course_status(course_code, all_courses)
    if status in ("completed", "in_progress"):
        return 0
    prereq_codes = prereqs.get(course_code, [])
    if not prereq_codes:
        return 1
    return 1 + max(chain_length(p, prereqs, all_courses) for p in prereq_codes)


@dataclass
class RequirementRisk:
    requirement: dict
    needed_course: str | None
    chain_length: int | None
    at_risk: bool


def assess_requirement(
    requirement: dict, report: DarsReport, terms_remaining: int | None
) -> RequirementRisk:
    if requirement["status"] != "not_satisfied":
        return RequirementRisk(requirement, None, None, False)

    needed = needed_course_code(requirement)
    if needed is None or terms_remaining is None:
        return RequirementRisk(requirement, needed, None, False)

    length = chain_length(needed, report.prereqs, _all_courses(report))
    return RequirementRisk(requirement, needed, length, length > terms_remaining)


def prereq_chain_path(course_code: str, prereqs: dict[str, list[str]], all_courses: list[dict]) -> list[str]:
    """The single longest unstarted prerequisite chain leading to
    `course_code`, deepest prerequisite first, ending with the course
    itself. Only unstarted/in-progress links are included."""
    status = course_status(course_code, all_courses)
    if status in ("completed", "in_progress"):
        return []
    prereq_codes = prereqs.get(course_code, [])
    if not prereq_codes:
        return [course_code]
    longest = max(
        (prereq_chain_path(p, prereqs, all_courses) for p in prereq_codes),
        key=len,
        default=[],
    )
    return longest + [course_code]


def graduation_projection(report: DarsReport) -> dict:
    now = current_term(report)
    expected = report.report.get("expected_grad_term")
    terms_remaining = terms_between(now, expected) if now and expected else None

    risks = [
        assess_requirement(r, report, terms_remaining)
        for r in report.requirements
        if r["status"] == "not_satisfied"
    ]
    course_risks = [r for r in risks if r.needed_course is not None]

    if not course_risks or terms_remaining is None:
        bottleneck = max(course_risks, key=lambda r: r.chain_length, default=None)
        return {
            "on_track": not any(r.at_risk for r in course_risks),
            "current_term": now,
            "expected_grad_term": expected,
            "terms_remaining": terms_remaining,
            "bottleneck_course": bottleneck.needed_course if bottleneck else None,
            "prerequisite_chain": [],
            "terms_short": 0,
            "blocked_requirements": [],
        }

    bottleneck = max(course_risks, key=lambda r: r.chain_length)
    all_courses = _all_courses(report)
    chain = prereq_chain_path(bottleneck.needed_course, report.prereqs, all_courses)
    terms_short = max(0, bottleneck.chain_length - terms_remaining)
    blocked = [
        r.requirement["title"]
        for r in course_risks
        if r.needed_course == bottleneck.needed_course
    ]

    return {
        "on_track": not bottleneck.at_risk,
        "current_term": now,
        "expected_grad_term": expected,
        "terms_remaining": terms_remaining,
        "bottleneck_course": bottleneck.needed_course,
        "prerequisite_chain": chain,
        "terms_short": terms_short,
        "blocked_requirements": blocked,
    }
