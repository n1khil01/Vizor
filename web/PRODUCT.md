# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js. Team decision; not delegated. No supporting-library or deploy-target decisions have been made yet.

## Users

Primary user of this surface: **academic advisors at ASU**, logging into a web dashboard to manage their assigned students. They are busy — juggling meetings, email, and ad-hoc student requests — and need to triage AI-handled conversations and tickets quickly rather than read every transcript in full.

Students are also users of the overall Vizor product, but they interact with the AI chatbot through a separate Chrome extension built by teammates, not through this website. This PRODUCT.md and the surface built from it cover the advisor-facing web app only.

## Product Purpose

Vizor is an AI advising assistant. Its chatbot (delivered as a Chrome extension, built by teammates) acts like a student advisor: it can access a student's myASU profile and DARS to answer routine requests directly, drafts emails/tickets when it can't resolve something itself, and keeps context on a student across sessions.

This website ("advizor") is the advisor-facing half of that system: a dashboard where advisors review what the AI has been doing on their behalf — session histories, tickets the AI couldn't close, and annotated reports — so they spend less time reconstructing context and more time on the judgment calls that actually need a human.

## Positioning

Unlike a generic support chatbot bolted onto a website, Vizor's assistant has real academic context (myASU + DARS) and hands off to advisors with that context already captured — advisors open a ticket and see what the student asked, what the AI told them, and why it escalated, instead of starting from a blank inbox message.

## Operating Context

- Built for the **ASU AIR Spark Challenge**, a virtual 48-hour hackathon (kickoff Wed Sept 2, 2026 5:00pm; submission due Thurs Sept 3, 2026 11:59pm MST; live finale pitch/demo Fri Sept 4, 2026). Teams of 3–4.
- Must be built on **ASU AIR** (ASU's AI Research Acceleration platform — hosted models via an OpenAI-compatible API at `https://openai.rc.asu.edu/v1`), used substantively, not just referenced.
- Judged via GitHub repo inspection plus a live demo/pitch to an expert jury; submission-day checklist favors a reliable happy-path demo over full completeness.
- Team split by surface: this user owns the advisor-facing Next.js website; teammates own the AI/backend and the student-facing Chrome extension. The website should assume it integrates with a teammate-owned backend/API rather than owning the AI logic itself.
- Advisors' current pain (from the team's own problem statement): daily context-juggling across student meetings, emails, and ad-hoc requests, with no single place to see what's already been handled.

## Capabilities and Constraints

Confirmed advisor-website functionality, per the team's feature outline:

- Advisor login/portal (shared login flow with students exists conceptually, but this website serves the advisor side).
- **Session histories**: transcripts/summaries of a student's chatbot conversations.
- **Request tickets**: items the chatbot drafted or escalated because it couldn't resolve the student's concern itself; carry stored context from the chat session.
- **Annotated reports**: reports generated from chat session history.
- A **hard resolve** action advisors use to close a ticket (distinct from a **soft resolve** students can do on their own side, outside this website).

Terminology:
- **DARS** — Degree Audit Reporting System (ASU's degree-audit tool).
- **myASU** — ASU's student portal.
- **AIR** — ASU AI Research Acceleration platform (hosted models, OpenAI-compatible API, accelerated compute).

### Confirmed data model (Supabase, project `miajqztktdzjdjxlkcgl`)

The team's shared Supabase project has a real, populated schema. Advisor auth is real Supabase Auth (`profiles.auth_user_id`), not a mock. Key tables:

- `profiles` — `role` ('student' | 'advisor'), `full_name`, `email`, tied to Supabase Auth.
- `students` — `profile_id` (PK/FK profiles), `advisor_id` (FK profiles) — **advisors see only their own assigned students**, confirmed by this column, not a shared pool.
- `conversations` / `messages` — a student's chatbot session histories; `messages.role` + `content` + `tool_calls` (jsonb).
- `tickets` — `student_id`, `advisor_id`, `conversation_id` (nullable, links back to the originating chat), `category`, `escalation_reason`, `ai_summary`, `created_at`.
  - `status` is constrained to exactly **`open` | `resolved`** (DB check constraint — confirmed by testing, no other values accepted).
  - `resolution` is constrained to exactly **`soft` | `hard`** (null while open) — this is the student soft-resolve vs. advisor hard-resolve distinction from the team's own feature spec, encoded directly in the schema.
  - `resolved_by` — FK to `profiles`; null on a soft resolve, an advisor's profile id on a hard resolve.
- `ticket_messages` — the drafted correspondence thread on a ticket: `sender` constrained to exactly **`student` | `advisor`** (no `ai`/`system` sender — the assistant drafts messages in the student's voice), `subject`, `body`, `read_at`.
- `dars_reports` → `dars_requirements` (nested via `parent_id`) → `dars_courses` — the real DARS requirement tree per student, with `overall_status`, credits earned/required/needed, GPA.
- `course_prereqs`, `kb_documents`/`kb_chunks` — backend/RAG internals, not advisor-UI concerns.

Seeded as of Sept 3, 2026: 1 advisor (Dr. Sarah Chen), 2 students (Jordan Alvarez — Senior, BS CS, 3.98 GPA, all requirements met; Morgan Reyes — Junior, BS CS, 2.59 GPA, one requirement unmet), 6 conversations / 62 messages, 2 DARS reports with 118 requirements / 116 courses, and (seeded by this session for demoability) 5 tickets / 6 ticket_messages spanning open, hard-resolved, and soft-resolved states.

Constraints / open items — do not invent beyond this:
- `.env` values (Supabase URL/anon key, backend URL) live in the team's local `vizor-env.rtf`, git-ignored; only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` belong in this Next.js app. The service-role key and DB URL are backend-only and must never reach client code.
- Extra features mentioned by the team (voice assistant, DARS-driven FAQ resolution, gamified flowchart of degree-map routes) belong primarily to the student chatbot/extension, not confirmed as advisor-website scope.

## Brand Commitments

- Product name **Vizor** is fixed.
- The team explicitly wants the assistant's mark to look distinct from a bare ASU logo ("change the logo to make it look more unique for the AI assistant") — Vizor should read as its own product, not a reskinned ASU utility, while still being credibly an ASU-affiliated tool.

## Evidence on Hand

- `Air Spark Challenge.pdf` — the team's own problem statement and feature outline for Vizor, including one rough concept mock of the **student chat widget** (not the advisor website).
- `ASU_AIR_Spark_Challenge_Brief.docx` — official challenge objectives, deliverables, timeline, and AIR setup instructions.
- `Get Ready for the ASU AIR Spark Challenge, Sept. 2-4!.eml` — official confirmation email with schedule, prize pool ($1,000 grand prize, $500 fan favorite), and team-formation logistics.
- No mockup, wireframe, or visual reference exists yet for the advisor website itself — the only visual evidence on hand is for the separate student-facing chat widget/extension. Future work should not assume the advisor site inherits that widget's look.

## Product Principles

1. Design for the advisor doing triage, not a visitor being persuaded — scanability and fast decisions beat polish-for-its-own-sake.
2. Every ticket or report an advisor opens should already carry the AI's context; advisors should never have to re-ask what a student already told the bot.
3. Make the AI's involvement legible — show what the chatbot said/did before an advisor acts on it, since advisors are trusting AI-drafted context.
4. Under a 48-hour build, a working, demoable happy path beats broad but shaky coverage — judging is a live demo plus jury Q&A.

## Accessibility & Inclusion

No product-specific accessibility requirement has been established beyond standard web accessibility practice.
