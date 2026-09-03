# DARS seed fixtures

`sample.json` (BS Computer Science, everything satisfied, summa cum laude persona) and
`sample-at-risk.json` (synthetic prerequisite-chain-blocked persona) are hand-transcribed
from `docs/reference/dars-sample.txt` and `docs/reference/dars-sample-at-risk.txt`, per
the schema in `docs/PROJECT_PLAN.md` §5 and the parsing notes in §6.1. They mirror the
`dars_reports` / `dars_requirements` / `dars_courses` tables in
`supabase/migrations/0001_init.sql`. `parent_seq` stands in for `parent_id` — the seed
script should resolve `seq -> id` per report when inserting.

## `term_sort` scheme

`term_sort = year*100 + season_code`, where `year` is the 4-digit calendar year the term
starts in and `season_code` is `SP=10, SU=20, FA=30` (chronological order within a year).
Example: `FA23` → `2023*100+30 = 202330`; `SP24` → `202410`; `SU25` → `202520`. This sorts
correctly across years and within a year, and is applied identically in both files.

## Grade / status mapping

Followed §6.1 verbatim:
- letter grade → `grade_type: "graded"`
- `NR` (with the `>>` marker in the source) → `grade_type: "in_progress"`, `is_in_progress: true`
- `AP` → `grade_type: "exam_credit"`
- `TA` → `grade_type: "transfer"`, `transfer_source` set to the institution string that
  appears on the course line (e.g. `"Mesa CC: GLG 101IN"`); the wrapped second-line title
  in the source (institution line + title line) was folded into a single `course_title`.

Requirement `status` was derived, not read, since the printer-friendly export drops the
per-requirement status column:
```
in_progress    if IP / NR / >> present
satisfied      if credits_earned >= credits_required
not_satisfied  otherwise
```

## Structural judgment calls

- **`OPT` sections → `section_type: "informational"`, `is_optional: true`.** These are
  the in-progress-courses list, exam/military-credit cap, two-year-institution cap,
  "total hours to complete the degree" (student-athlete note), and the trailing
  "electives not used to meet requirements" block. None of these represent a
  requirement to satisfy, matching the plan's warning against treating them as gaps.
  `status` on these is always `"informational"` regardless of credit math.
- **Nesting via `parent_seq`.** Used wherever the source visually nests a sub-requirement
  under a labeled block: First-Year Composition → ENG101/102 sub-groups; the three
  Awareness Areas under "AWARENESS AREAS"; each "COURSE: n hours" line under its parent
  Lower/Upper Division or Math block; the Data Science minor's single "Required Course"
  line under the minor header. Two-level nesting only — the source never goes deeper.
- **Course-list header blocks** (the "COURSE LIST: CSE 4 / Aerospace: AEE 415…" elective
  substitution catalog and the repeated flat list of every course applied to major GPA)
  were **not** transcribed as separate requirements/courses — they're reference lists,
  not requirement rows, and duplicate courses already captured under their real
  requirement. Transcribing them would double-count credits.
- **GPA-per-course annotations** (e.g. `"4.33 GPA"` after a course's earned-hours line)
  were kept as a `notes` string on that requirement rather than a structured field, since
  the schema has no place for per-course GPA.
- **Section banners with duplicated/ambiguous numbers** (e.g. sample.txt's ASU GPA block
  literally re-prints `"EARNED: 98.00 HOURS 3.98 GPA"`, reusing the Resident Credit
  hours figure) were transcribed as read rather than corrected, with the raw GPA line
  kept in `notes` — this looks like an artifact of the PDF-to-text export, not a data
  error. `credits_required` for GPA rows holds the *minimum GPA threshold* (2.00), not a
  credit-hour figure, since that's the only number DARS gives for a GPA check.
- **Elective sub-requirements with no "N hours" figure of their own** (e.g. "BS COMPUTER
  SCIENCE ELECTIVES" parent, which only states the `EARNED:` roll-up of its children) got
  `credits_required: null`; the roll-up total lives on the parent's `credits_earned`.

## `sample-at-risk.json`-specific calls

- **The `NO` marker.** `dars-sample-at-risk.txt`'s own header flags this: `dars-sample.txt`
  has zero unsatisfied requirements, so there was no real `NO` marker to copy convention
  from — the source file's `NO` usage is itself a reconstruction per uAchieve convention,
  not observed output. Requirements printed with `NO` (alone or combined `NO IP`) were
  mapped to `status: "not_satisfied"` unless `IP` was also present, in which case the
  in-progress rule takes priority and the row is `"in_progress"` (per the §6.1 precedence:
  IP is checked first). Rows with only `IP` (no `NO`) but `credits_earned >=
  credits_required` were left `"satisfied"` even though the source shows an `IP` marker
  nearby if that marker plainly belongs to a different sub-item (see Total Hours /
  Upper Division vs. Resident Credit below).
- **`NEEDS>` and `** NEEDS: X **` lines** were preserved verbatim as `notes` on the
  requirement they visually attach to, rather than parsed into new numeric fields —
  several of them (e.g. `NEEDS> 18.00 HOURS` under Total Hours, `NEEDS> 8.00 HOURS` under
  Upper Division) don't arithmetically reconcile with `credits_required - credits_earned`
  from this printer-friendly export (this is the same lossiness §6.1 flags for the
  status column), so they're recorded as-observed rather than re-derived.
- **`** PREREQ: ... **` annotations** (CSE 485 needs CSE 360 in progress; CSE 486 needs
  CSE 485 not started) were kept as `notes` on the `CSE 485 (L)` and `CSE 486 (L)`
  requirements (seq 47/48) — this is the textual anchor for the prerequisite-chain story
  the persona exists to demonstrate (§6.1 "at-risk persona"), even though the real
  blocking logic will come from the hand-seeded `course_prereqs` table, not from parsing
  this note string.
- **CSE 310 fail/retake** (`SP25 E`, then `SP26 C`) is transcribed as two course rows
  under the single CSE 310 requirement (seq 41), both present in the source's course
  list — the requirement is satisfied by the retake, with a note explaining the retake is
  the root cause of the downstream CSE 360/485/486 delay.
- No Minor section exists in this persona (`Major Verification for Minors` explicitly
  says "Student is not active in a Minor Plan Type"), so `sample-at-risk.json` has no
  `section_type: "minor"` rows, unlike `sample.json`'s Data Science minor.

## Counts

| File | Requirements | Courses |
|---|---|---|
| `sample.json` | 60 | 66 |
| `sample-at-risk.json` | 58 | 50 |
