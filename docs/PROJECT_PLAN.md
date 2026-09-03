# Vizor — Project Plan

AI advising assistant for ASU. Built for the Air Spark Challenge.

---

## 1. The problem

Advisors spend their day on work that doesn't need a human: repeating the same policy answers, reconstructing context they were told last month, and triaging email. The genuinely hard cases — the ones that need judgment — get whatever time is left.

Vizor puts a chat assistant on every ASU page. It answers what it can from policy and the student's own record. When it can't, it doesn't dead-end the student: it opens a ticket, writes the advisor a summary explaining what the student needs *and why the bot couldn't handle it*, and helps the student draft the message. The advisor arrives already briefed.

**The pitch in one line:** advisor time gets spent once per problem, not once per message.

---

## 2. Users and surfaces

| | Student | Advisor |
|---|---|---|
| Surface | Chrome extension, on any ASU domain | Vizor web app |
| Auth | Logs in inside the extension | Logs into the web app |
| Does | Chats, escalates, reads advisor replies | Works a ticket queue, replies, resolves |

Students never use the web app. The extension **is** the student product. The web app is a landing page plus the advisor portal.

---

## 3. Architecture

```
┌──────────────────────┐
│  Chrome Extension    │  MV3 content script on *://*.asu.edu/*
│  (student surface)   │  Chat UI in a shadow DOM
└──────────┬───────────┘
           │  HTTPS + JWT
           ▼
┌──────────────────────┐        ┌─────────────────────────┐
│  FastAPI backend     │───────▶│  ASU AI Research LLM    │
│  holds ASU API key   │        │  openai.rc.asu.edu/v1   │
│  runs the tool loop  │        │  chat + embeddings      │
└──────────┬───────────┘        └─────────────────────────┘
           │
           ▼
┌──────────────────────┐        ┌─────────────────────────┐
│  Supabase / Postgres │◀───────│  Next.js web app        │
│  + pgvector          │        │  landing + advisor      │
└──────────────────────┘        └─────────────────────────┘
```

**Stack:** Next.js + TypeScript · Python/FastAPI · Supabase (Postgres + pgvector + Auth)

**Non-negotiable:** the ASU API key lives only in the FastAPI process. A content script is readable by anyone who opens devtools on the page, so the extension never talks to the LLM directly. Every model call is proxied.

---

## 4. Core flows

### 4.1 Chat

1. Student opens the widget on an ASU page and logs in (token cached in `chrome.storage.local`).
2. Backend loads their record — name, advisor, class year, major — into the system prompt. Their DARS audit is available via tools, not stuffed into the prompt.
3. Student asks a question. The model can call tools:
   - `get_dars_summary()` / `get_requirement_detail(category)` — degree progress, read from DARS
   - `search_policy_kb(query)` — semantic search over the ASU policy corpus
   - `list_open_tickets()` / `get_ticket(id)` — **only when the student asks about a ticket**
   - `escalate_to_advisor(...)` — when it cannot resolve
4. Answer streams back into the widget.

### 4.2 Escalation

The model decides it can't resolve and calls `escalate_to_advisor`, producing in one shot:

- `reason` — why the bot couldn't resolve it (this is what the advisor most wants to know)
- `summary` — the annotated report: category, what the student actually needs, what the bot already tried
- `draft_subject` + `draft_body` — the email

The widget shows the draft. **The student can edit it before sending.** On send, the ticket is created and auto-assigned to the student's advisor.

### 4.3 Advisor works the ticket

Advisor opens the web app and sees only their own students' tickets. Ticket detail shows the AI summary and the student's email side by side. They reply. They (or the student) can mark it resolved.

### 4.4 The loop closes

Next time the student opens the widget, an unread advisor reply surfaces as a distinct card — *"Reply from Dr. Chen · your advisor"* — and the closed/minimized icon carries a badge.

Follow-up questions go to the **bot first**, with the advisor's reply now in context. It only re-escalates if it still can't resolve. This is the design that makes the product more than a ticket form: the advisor answers once, and the bot absorbs the three clarifying questions that would have been three more emails.

### 4.5 Resolution and memory

Only **open** tickets are visible to the AI. Resolved tickets vanish from its knowledge entirely.

Either party can resolve, but with different semantics:

- **Advisor close is hard.** The ticket is done and gone from the bot's knowledge.
- **Student close is soft.** Hidden from the advisor queue and out of the bot's default context, but retained. If the student raises the same issue again, the bot can recover it.

The asymmetry exists because a student who closes prematurely would otherwise silently destroy context they need later. `tickets.resolution` records which kind it was.

---

## 5. Data model

```sql
profiles        id, auth_user_id, role('student'|'advisor'), full_name, email
students        profile_id, advisor_id → profiles, class_year, major, gpa

-- DARS: the student's degree audit. Seeded per student.
-- Source of truth for "what have I taken" and "what do I still need".
-- Shape mirrors a real ASU uAchieve audit — see docs/reference/dars-sample.txt
dars_reports       id, student_id, program, program_code, college,
                   catalog_year, expected_grad_term,  -- what the catalog year implies, e.g. "SP27"
                   prepared_on,
                   overall_status text,          -- verbatim DARS verdict
                   status_code('met'|'met_with_ip'|'unmet'),
                   credits_earned, credits_required,
                   credits_needed,               -- the NEEDS line; can exceed the minimum
                   credits_in_progress, asu_gpa, major_gpa,
                   raw_text                      -- kept so answers can cite the source

-- Course prerequisite graph. Small, hand-seeded for the major(s) in the demo —
-- not scraped from the catalog. Powers the "on track" projection in §6.1.
course_prereqs     course_code, prereq_course_code, prereq_type('required'|'concurrent')

dars_requirements  id, report_id, parent_id → dars_requirements,  -- nests
                   seq, section_type('university'|'general_studies'|'major'
                                    |'minor'|'gpa'|'informational'),
                   is_optional bool,             -- the OPT prefix
                   code, title, description,
                   status('satisfied'|'in_progress'|'not_satisfied'|'informational'),
                   credits_required, credits_earned, credits_in_progress,
                   groups_required, notes text[]

dars_courses       id, requirement_id, term, term_sort, campus_flag,
                   course_code, course_title, credits, grade,
                   grade_type('graded'|'in_progress'|'transfer'|'exam_credit'),
                   transfer_source, is_in_progress bool

conversations   id, student_id, created_at, last_message_at
messages        id, conversation_id, role('user'|'assistant'|'tool'),
                content, tool_calls jsonb, created_at

tickets         id, student_id, advisor_id, conversation_id,
                status('open'|'resolved'), resolution('hard'|'soft'),
                resolved_by, escalation_reason, ai_summary, category,
                created_at, resolved_at
ticket_messages id, ticket_id, sender('student'|'advisor'),
                subject, body, read_at, created_at

kb_documents    id, title, source_url, raw_content
kb_chunks       id, document_id, content, embedding vector(N)
```

`N` is 4096 — the ASU embedding model's dimension, confirmed during KB ingestion. No ivfflat/HNSW index on `kb_chunks.embedding` (pgvector caps both at 2000 dims); brute-force cosine distance via the `match_kb_chunks` RPC is fine at demo corpus size.

**Row-level security:** advisors can only read tickets where `advisor_id` matches their profile; students only their own. Enforced in RLS *and* checked in the backend — belt and braces, since a routing bug here leaks student data across advisors.

---

## 6. Knowledge design

Three sources, deliberately different. Mixing them up is the main way this product gets untrustworthy.

### 6.1 DARS — structured, read not computed

On login the bot has access to the student's degree audit: courses taken, credit hours, and how each requirement stands. DARS has already done the evaluation, so the bot reads it rather than doing credit arithmetic.

This matters more than it sounds. *"Am I on track to graduate?"* is exactly where a language model invents numbers with total confidence. Because DARS states earned-against-required per requirement, the bot quotes an authority instead of deriving one. **No degree question is ever answered from embeddings.**

#### What a real DARS contains

Modelled on `docs/reference/dars-sample.txt` — an ASU uAchieve audit for BS Computer Science, redacted.

**Header:** program (`BS COMPUTER SCIENCE`), program code (`ES CSE BS`), college (`IRA A. FULTON SCHOOLS OF ENGINEERING`), catalog year (`Fall 2023`), prepared-on timestamp, and a top-level verdict — here `ALL REQUIREMENTS MET BUT IN-PROGRESS COURSES MAY HAVE BEEN USED!`

**University blocks**, each earned-against-required:

| Block | Sample values |
|---|---|
| Total hours | 131.00 earned / 120 minimum — but `NEEDS: 123.00` |
| Upper division | 53.00 / 45 |
| Resident credit | 98.00 / 30 |
| ASU GPA | 3.98 / 2.00 minimum |
| Major GPA | 3.98 / 2.00 minimum |
| In progress | 15.00 hours across five FA26 courses |

Then **nested requirement trees** — first-year composition, general studies, major lower/upper division, electives, minor — each with sub-requirements and the courses applied to them. The nesting is real: *"Computer Science (Mathematics) Lower Division: 12 hours"* contains *"MAT 243: 3 hours, C minimum"*, which contains the course that satisfied it. Hence `parent_id` in the schema.

**Course lines are consistently shaped:**

```
FA26 M CSE 464  3.00 NR >> SOFTWARE QA AND TESTING
SP25 M CSE 310  3.00 A+    DATA STRUCTURES AND ALGORITHM
SU23   MAT 270  4.00 AP    CALCULUS W/ANALYTIC GEOMETRY
SU24   GLG 101  3.00 TA    Mesa CC: GLG 101IN
                             INTRO TO GEOLOGY I - PHYSICAL
```

term · campus flag · course · credits · grade · title. **Grade codes carry meaning:** a letter is graded, `NR` with `>>` is in progress, `AP` is exam credit, `TA` is transfer — and transfer lines name the source institution, pushing the title onto a second line.

**Markers that matter:**
- `OPT` prefixes *informational* sections (in-progress list, elective overflow, exam-credit and two-year caps) — these are not requirements to satisfy, and treating them as such would make the bot report phantom gaps
- `IP` flags a requirement partly satisfied by in-progress work
- `NEEDS: n HOURS` is the true total, which can exceed the 120 minimum — 123 here

#### The lossiness problem, stated plainly

The printer-friendly export **flattens DARS's per-requirement status column.** Satisfied requirements just show earned hours; only `IP` survives as an explicit flag. So we derive status instead of reading it:

```
in_progress    if IP / NR / >> present
satisfied      if credits_earned >= credits_required
not_satisfied  otherwise
```

That holds for this sample — but every requirement in it is met, so **the `not_satisfied` branch is unverified.** Flagged in §11; it's the one place this design could surprise us.

If we later want robust parsing, note the audit is served as HTML at `webapp4.asu.edu/uachieve/audit/read.html`. The HTML retains status classes the PDF drops — parse that, not the PDF.

#### "Am I on track?" is a sequencing question, not a credit-count question

This is the one place the bot has to reason a step beyond what DARS states outright, so the logic needs to be pinned down precisely rather than left to the model's judgment.

**"On track" means:** the student's unmet requirements can be completed within their remaining catalog-year timeline, given course prerequisites. **"Not on track" means:** a required course they haven't started has an unmet prerequisite chain that pushes it past that timeline — typically because the prerequisite itself is only offered certain terms, or the chain is simply longer than the terms left. This is *not* the same failure as "not enough credit hours." A student can have plenty of credits left and still miss their catalog year because the one course they need is gated behind two courses they haven't touched, each a term apart.

So the check is: for every `not_satisfied` requirement, walk its `course_prereqs` chain and find the longest unstarted prerequisite chain. Compare that chain length in terms against `expected_grad_term` minus the current term. If the chain doesn't fit, the requirement is **at-risk**, and it's the *reason*, not just the shortfall, that goes to the student and into the ticket if it escalates.

```
list_unmet_requirements()
  → for each not_satisfied requirement:
      chain = longest_unstarted_prereq_chain(requirement.satisfying_courses, course_prereqs)
      terms_needed = ceil(len(chain) / 1)   -- one prereq-course per term, conservatively
      terms_remaining = terms_between(current_term, expected_grad_term)
      at_risk = terms_needed > terms_remaining
```

This needs a `course_prereqs` table (added to §5), hand-seeded only for the courses that appear in the demo persona's gap — not the full ASU catalog. Scope it to what the story needs.

#### The at-risk persona

`docs/reference/dars-sample.txt` has everything satisfied, so it can't exercise this feature. `docs/reference/dars-sample-at-risk.txt` is a hand-built synthetic counterpart in the same uAchieve notation — **clearly marked as synthetic in its header**, since it is fabricated data that otherwise looks like a real record.

The story, and the reason it's the right test case:

| | |
|---|---|
| Catalog year | Fall 2023 → expected graduation **SP27** |
| Credits | 96.00 earned + 15.00 in progress = 111.00 of **129.00** needed |
| Remaining | **18.00 hours** — a heavy but *legal* single-term load |
| ASU GPA / major GPA | 2.59 / 2.31 |

On credits alone SP27 is still reachable. The blocker is ordering:

```
CSE 310  failed SP25 (E), retaken SP26 (C)
  └─> CSE 360  Intro Software Engineering   FA26  (in progress — earliest possible)
        └─> CSE 485  Capstone I             SP27  (earliest)
              └─> CSE 486  Capstone II      FA27  (earliest)
```

One failed course in spring of sophomore year pushes graduation a full semester past the catalog expectation, and **no amount of overloading fixes it** — even a maximum 18-hour SP27 leaves CSE 486 stranded. That's the distinction the feature exists to make: credit arithmetic says yes, sequencing says no.

It also cascades. Both capstone courses carry Literacy & Critical Inquiry (L) general studies credit, so this single wall marks four requirements unsatisfied at once — CSE 485, CSE 486, L-upper, and L-upper-or-lower. A bot that reports four independent gaps is technically correct and useless; one that reports *"one prerequisite chain is blocking four requirements, and here it is"* is what an advisor actually needs. `get_graduation_projection()` returns the chain, not the four symptoms.

**Caveat carried in the fixture:** the `NO` per-requirement markers are reconstructed from uAchieve convention, not observed — `dars-sample.txt` has no unsatisfied requirements to copy from. If a real unmet audit turns up, verify the notation against it before trusting `parse_dars.py` on real input.

#### Ingestion methodology

Two stages, only the first on the critical path:

1. **Transcribe the sample into seed JSON by hand, once.** This is the demo's data. It needs to be right, and hand-transcription guarantees that.
2. **`scripts/parse_dars.py`** — a regex parser over the printer-friendly text emitting the same JSON. Makes new personas cheap and opens the door to an "upload your DARS" flow.

Do not build a general uAchieve parser as the critical path. The structure is regular, but the edge cases — wrapped transfer titles, course-list blocks spanning 25 lines, arbitrarily nested sub-groups — are a rabbit hole with no demo payoff. Seed first, parse second.

#### Tools

- `get_dars_summary()` — header, verdict, credits, GPA, in-progress count
- `list_unmet_requirements()` — not-satisfied requirements, each flagged `at_risk` per the projection above
- `get_graduation_projection()` — the at-risk requirement (if any), its blocking prerequisite chain, and the terms-short number — this is what actually answers "am I on track?"
- `get_requirement_detail(category)` — one requirement subtree with its courses
- `get_courses_in_progress()`

One detail worth stealing for the demo: DARS carries the Latin honors thresholds (3.40 cum laude, 3.60 magna, 3.80 summa). The sample student's 3.98 puts them at **summa cum laude** — and the bot can volunteer that unprompted. It's the kind of thing a student would never think to ask and an advisor never has time to mention.

### 6.2 Policy KB — semantic, always available

Ingested once, chunked, embedded via the ASU embeddings endpoint, stored in pgvector. Tool: `search_policy_kb(query)`.

**Scrape less than feels natural.** For RAG a curated ~40-page corpus beats a broad crawl — nav chrome, footers and near-duplicate department pages actively poison retrieval. A seed list we choose, crawled shallow.

#### Scrape or hand-write, per bucket

| Bucket | Approach | Why |
|---|---|---|
| Club/org directory | **Scrape** | High volume, purely factual, tedious by hand |
| Career programs (internships, research, 4+1) | **Scrape** | Many programs, stable facts |
| Procedural / forms | **Hand-write** | Low volume, highest value — and ASU's own pages are often *why* students are confused |

That last row is the counterintuitive one and it's deliberate. The whole point of the form-then-meeting-anyway feature is that the official page failed the student; scraping it reproduces the failure. Roughly ten hand-written procedural entries will outperform anything crawled.

#### Three source types, three techniques

1. **Static pages** — `httpx` to fetch, `trafilatura` to extract main content. It strips nav/footer/sidebar properly; don't hand-roll per-page BeautifulSoup selectors, you'll rewrite them constantly.
2. **API-backed** — the club directory is CampusLabs Engage (Sun Devil Sync), a React app with a **JSON API behind it**. devtools → Network → XHR to find the endpoint, then hit it directly: faster, cleaner, structured fields for free, no headless browser. Playwright is the fallback only if a page genuinely has no API.
3. **PDFs** — `pypdf` for text, `pdfplumber` where there are tables.

#### Pipeline

```
seeds.yaml → fetch (cache/) → extract → documents.json → chunk → embed → pgvector
```

Every stage independently re-runnable, with raw responses cached to disk. The `documents.json` intermediate matters more than it looks: retrieval gets re-chunked and re-embedded several times while tuning, and none of that should re-scrape ASU.

#### Chunking

- **Split on structure, not character count** — `<h2>`/`<h3>` boundaries, 300–800 tokens
- **Prepend page title and section heading into the chunk's own text** before embedding. "Submit by the 10th day of the term" is meaningless alone; "Course Withdrawal → Deadlines: Submit by the 10th day of the term" embeds correctly
- **Never split a procedure.** Seven steps stay one chunk even if it runs long. Half a procedure is worse than none

#### Metadata and hybrid retrieval

```
kb_chunks  id, document_id, content, embedding vector(N),
           doc_type('directory'|'procedural'|'policy'),
           majors text[], source_url, form_url, title, section_heading
```

Filter on `doc_type` / `majors` in SQL, rank by vector similarity within the filter. Don't make the embedding infer that a CS student shouldn't see Nursing clubs — that's a `WHERE` clause, and pgvector handles filtered ANN fine.

#### Conduct

Public pages only. Check `robots.txt` before fetching, send an identifying User-Agent, rate-limit to ~1 req/sec — we're crawling dozens of pages, so politeness is free. **Never scrape anything behind My ASU login;** authenticated student data is exactly what the seeded DARS records simulate, and the two worlds stay separate.

#### Verifying retrieval

Write the eval set *before* tuning: the six §6.4 questions, each paired with the chunk that should come back. Then retrieval quality is a number to watch rather than a vibe.

### 6.3 Ticket history — on demand only

Never preloaded. The model calls `list_open_tickets()` / `get_ticket(id)` only when the student actually references one. Keeps prompts small and stops irrelevant history bleeding into every answer.

**One exception:** an unread advisor reply *is* surfaced proactively on login and stays in context for that conversation, because §4.4 depends on it.

### 6.4 What the KB has to cover

Drawn from the advising questions that actually drain appointment time. They fall into four kinds, and the kind determines which source answers:

| Student question | Answered by | Kind |
|---|---|---|
| Do these courses meet my credit requirement? | **DARS** — `get_requirement_detail` | Structured lookup |
| Am I on track to graduate on time? | **DARS** — `get_graduation_projection` (prerequisite-chain vs. terms remaining, see §6.1) | Structured lookup |
| What clubs and activities fit my major? | **KB** — org directory tagged by major | Directory |
| I filled out a form and still had to book a meeting | **KB** — process docs with the actual form link and steps | Procedural |
| I'm in this major — what would be a better one? | **KB** + DARS, then likely escalate | Advisory |
| What opportunities can accelerate my career? | **KB** — internships, research, 4+1 accelerated programs | Directory |

Two observations that shape the build:

**The procedural bucket is the biggest single win.** "Here is the form, here are the four fields people get wrong, you do not need an appointment" converts a 30-minute meeting into a 30-second answer. KB entries for processes should carry the link and the steps, not just prose describing that a process exists.

**The advisory bucket should escalate, and that's correct behavior.** "Should I change my major?" is a judgment call about a person's life. The bot's job is to arrive at the advisor with the groundwork already done — current progress, what would transfer, what the student is actually worried about — not to answer it. This is a good demo moment: the bot knowing its limit is a feature, not a failure.

---

## 7. Auth

Supabase Auth issues JWTs. FastAPI verifies them on every request.

- **Extension:** login form posts to `/auth/login` → backend authenticates against Supabase → returns JWT → cached in `chrome.storage.local`. Cannot use cookies; the widget runs on `asu.edu`, a different origin from our backend.
- **Web app:** standard Supabase Auth session in Next.js.
- **CORS:** backend allowlists the extension origin (`chrome-extension://<id>`) once the unpacked ID is known, plus the web app origin.

Student accounts are seeded, not self-registered.

---

## 8. API surface

```
POST   /auth/login                    → JWT
GET    /me                            → profile + record + unread advisor replies
POST   /chat                          → streaming completion, runs the tool loop
GET    /tickets                       → student's open tickets
GET    /tickets/:id                   → one ticket + its message thread
POST   /tickets                       → student sends the (edited) escalation draft
POST   /tickets/:id/messages          → student follow-up, if bot re-escalates
POST   /tickets/:id/resolve           → either party

GET    /advisor/tickets               → queue, scoped to this advisor's students
GET    /advisor/tickets/:id           → summary + email thread + transcript
POST   /advisor/tickets/:id/reply     → advisor reply
```

Creation is `POST /tickets`, not `POST /tickets/:id/send`: no draft is ever
persisted, so there's no id to address until the student confirms. The model's
draft lives only in the chat response (an `escalation` SSE event) until then —
which is what makes "the student can edit it before sending" true rather than
merely presentational.

---

## 9. Repo structure

```
Vizor/
├── backend/
│   ├── app/
│   │   ├── main.py  config.py  auth.py
│   │   ├── llm/         client, tool definitions, prompts, tool loop
│   │   ├── routers/     auth, chat, tickets, advisor
│   │   └── db/          models, queries
│   ├── scripts/
│   │   ├── seed_data.py     students, advisors, DARS seed JSON
│   │   ├── parse_dars.py    printer-friendly DARS text → seed JSON
│   │   └── ingest_kb.py     fetch → extract → chunk → embed → pgvector
│   ├── fixtures/        dars/*.json, kb/documents.json
│   ├── seeds.yaml       KB scrape target URLs
│   ├── cache/           raw scraped responses (git-ignored)
│   └── pyproject.toml
├── web/                 Next.js — landing, advisor login, dashboard
├── extension/           MV3 — manifest, content script, chat UI, background
├── supabase/migrations/
└── docs/
    ├── PROJECT_PLAN.md
    └── reference/dars-sample.txt   redacted uAchieve audit, schema source of truth
```

---

## 10. Build order

Dependency-ordered. Each phase is demoable on its own.

| # | Phase | Done when |
|---|---|---|
| 0 | **Foundations** — Supabase project, schema migrations, seed students/advisors, **DARS sample transcribed to seed JSON** | You can query a seeded student, their advisor, and their audit tree |
| 1 | **Backend core** — config, Supabase auth, LLM client. **Verify tool calling works on the ASU gateway.** | A test call returns `tool_calls` |
| 2 | **DARS tools** — summary, unmet requirements, graduation projection, requirement detail, in-progress | "Am I on track?" correctly says no for the at-risk persona, yes for the sample, zero invented numbers either way |
| 3 | **KB ingestion** — `seeds.yaml`, fetch/cache, extract, chunk, embed, hybrid query | `search_policy_kb("clubs for my major")` returns the right chunk; eval set passes |
| 4 | **Chat endpoint** — system prompt, full tool loop, streaming | curl each of the six §6.4 questions, get grounded answers |
| 5 | ~~**Extension shell** — MV3 injection, shadow DOM, chat UI, `x`/`−` controls, login~~ | ✅ Widget appears on a real ASU page and holds a conversation |
| 6 | ~~**Escalation** — `escalate_to_advisor`, ticket creation, AI summary, editable draft, send~~ | ✅ Ticket lands in the DB, assigned to the right advisor |
| 7 | **Advisor web app** — login, scoped queue, ticket detail, reply, resolve | Advisor answers a ticket end to end — *owned by teammate, see §12* |
| 8 | **Loop closure** — unread reply card, icon badge, bot-mediated follow-ups | Full circle demoable in one take |
| 9 | **Landing page + polish** | Judge-ready |
| — | *Voice assistant* | Deferred. Mic permission stays out of the manifest until we build it |

**Phase 1 gates the architecture.** The ASU endpoint is OpenAI-compatible, so tool calling *should* work — but gateways vary by model. If it doesn't, §4.1 changes: an intent-classification pass runs before the main call and pre-fetches context, instead of the model choosing tools itself. Confirm this before writing the chat layer.

---

## 11. Open items

- [x] ~~`ASU_API_KEY`, `ASU_CHAT_MODEL`, `ASU_EMBEDDING_MODEL` in `.env`~~ — set
- [x] ~~Supabase project + keys~~ — set
- [x] ~~A second, at-risk DARS persona~~ — built as `docs/reference/dars-sample-at-risk.txt`, synthetic, capstone-sequence wall. See §6.1.
- [ ] **`course_prereqs` seed data** — only the chain the persona needs: `CSE 205 → CSE 310 → CSE 360 → CSE 485 → CSE 486`. Not the full catalog (see §6.1's projection logic).
- [ ] **Verify the `NO` marker notation** against a real unmet audit if one becomes available — currently reconstructed, not observed.
- [x] ~~**KB seed URLs**~~ — `seeds.yaml` has a first curated set: 6 hand-written procedural entries (withdrawal, add/drop, change of major, transcript, suspension appeal, late-registration petition) plus 3 scraped directory pages (4+1, internships, undergrad research). The club directory API endpoint is stubbed but not wired — needs a shape-specific parser (see `scripts/ingest_kb.py`). Expand as advisors flag more high-traffic questions.
- [ ] Seed personas — how many students/advisors, and whose situation does the demo follow?
- [ ] **Watch escalation eagerness.** `escalate_to_advisor` is reachable at any tool round with only prompt guidance holding it back. If the model escalates before trying DARS/KB, add a gate in `app/llm/tool_loop.py`: track tool names called this turn and reject an escalation that arrives before any lookup, returning an error tool result that tells it to search first.
- [ ] **Bundle webfonts?** The widget uses installed faces because a content script's `@font-face` is subject to the host page's CSP. If ASU pages turn out to permit it, shipping two woff2 files as `web_accessible_resources` would tighten the display type.

---

## 12. Decision log

Settled, so we don't relitigate:

- **Chrome extension only.** No embeddable-widget or mock-page path.
- **Email never leaves the system.** "Email" is a UI framing over `ticket_messages`. No SMTP, no inbound webhooks, no magic links — the fragile part of the design, removed.
- **Students don't use the web app.**
- **Only escalated sessions become tickets.** Bot-resolved conversations stay as logged history and never reach the queue.
- **Tickets auto-assign** via the student's advisor field; advisors see only their own students.
- **Resolved means invisible** to the AI. Advisor closes are hard; student closes are soft and recoverable.
- **Follow-ups are bot-mediated**, not advisor-direct.
- **DARS is the authority on degree progress.** The bot reads requirement status; it never computes credit math and never answers a degree question from embeddings.
- **DARS seed data is hand-transcribed first**, parser second. A general uAchieve parser is not on the critical path.
- **KB is curated, not crawled.** Directories get scraped; procedures get hand-written.
- **Escalation is a judgment call, not a counter.** Nothing enforces "try N tools before escalating" — the system prompt steers it and the tool loop allows it at any round. A hard gate is available if testing shows the model bailing too early (see §11).
- **The draft is student-owned.** `escalate_to_advisor` writes nothing; it returns a draft the widget renders as an editable memo, and only `POST /tickets` persists anything. "The student can edit it before sending" is enforced by the architecture, not by UI convention.
- **Widget design direction: editorial dossier.** Near-square geometry, one warm bone neutral family, maroon dominant with gold used only structurally (rules, stamps, cursor, focus). Vizor's replies are transcript text under a hairline, not bubbles; the escalation draft is a carbon-copy memo with a NOT SENT → SENT stamp. Chosen because the product's pitch is an artifact handed to an advisor — a document aesthetic reinforces that where a chat-bubble aesthetic fights it. Type comes from installed faces (Iowan Old Style / mono / Helvetica), since a content script can't reliably load webfonts past a host page's CSP.
- **Team split:** a teammate owns the advisor web app (Phase 7 — login, queue, ticket detail, reply, resolve). Our work here focuses purely on refining the chatbot extension (Phases 6, 8+) — escalation flow, chat quality, widget UX.
