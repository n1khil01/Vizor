"""ASU term codes (SP24, SU24, FA24, ...) as sortable/comparable steps.

Mirrors the `term_sort` convention already used in `dars_courses`
(YYYY00 + 10/20/30 for SP/SU/FA), but expressed as a linear step count so
"how many terms apart" is a plain subtraction.
"""

import re

_SEASON_STEP = {"SP": 0, "SU": 1, "FA": 2}
_TERM_RE = re.compile(r"^(SP|SU|FA)(\d{2})$")


def term_step(term: str) -> int:
    """FA26 -> 2026*3 + 2. Steps increase by 1 per term, in calendar order."""
    match = _TERM_RE.match(term.strip().upper())
    if not match:
        raise ValueError(f"Unrecognized term code: {term!r}")
    season, year_suffix = match.groups()
    year = 2000 + int(year_suffix)
    return year * 3 + _SEASON_STEP[season]


def terms_between(current_term: str, target_term: str) -> int:
    """Number of terms strictly after `current_term`, up to and including
    `target_term`. Zero or negative if the target is now or already past.
    """
    return term_step(target_term) - term_step(current_term)


def latest_term(terms: list[str]) -> str | None:
    if not terms:
        return None
    return max(terms, key=term_step)
