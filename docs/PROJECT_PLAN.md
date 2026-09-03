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
dars_reports       id, student_id, program, catalog_year, generated_at,
                   overall_status, credits_earned, credits_required
dars_requirements  id, report_id, category, title,
                   status('satisfied'|'in_progress'|'not_satisfied'),
                   credits_earned, credits_required, notes
dars_courses       id, requirement_id, course_code, course_title,
                   credits, term, grade, applied('yes'|'no'|'in_progress')

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

`N` is set once we know the ASU embedding model's dimension.

**Row-level security:** advisors can only read tickets where `advisor_id` matches their profile; students only their own. Enforced in RLS *and* checked in the backend — belt and braces, since a routing bug here leaks student data across advisors.

---

## 6. Knowledge design

Three sources, deliberately different. Mixing them up is the main way this product gets untrustworthy.

### 6.1 DARS — structured, read not computed

On login the bot has access to the student's degree audit: courses taken, credit hours, and **whether each requirement is satisfied**. DARS has already done the evaluation, so the bot reads a status field rather than doing credit arithmetic.

This matters more than it sounds. Questions like *"am I on track to graduate?"* are exactly where a language model will confidently invent numbers. Because DARS states `status` per requirement, the bot quotes an authoritative answer instead of deriving one. **No degree question is ever answered from embeddings.**

Tools: `get_dars_summary()` for the overview, `get_requirement_detail(category)` to drill into one block.

### 6.2 Policy KB — semantic, always available

Ingested once, chunked, embedded via the ASU embeddings endpoint, stored in pgvector. The model searches it whenever a question looks policy- or resource-shaped. This is what removes the routine appointments.

Tool: `search_policy_kb(query)`.

### 6.3 Ticket history — on demand only

Never preloaded. The model calls `list_open_tickets()` / `get_ticket(id)` only when the student actually references one. Keeps prompts small and stops irrelevant history bleeding into every answer.

**One exception:** an unread advisor reply *is* surfaced proactively on login and stays in context for that conversation, because §4.4 depends on it.

### 6.4 What the KB has to cover

Drawn from the advising questions that actually drain appointment time. They fall into four kinds, and the kind determines which source answers:

| Student question | Answered by | Kind |
|---|---|---|
| Do these courses meet my credit requirement? | **DARS** | Structured lookup |
| Am I on track to graduate on time? | **DARS** + terms remaining | Structured lookup |
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
POST   /tickets/:id/send              → student sends (or edits then sends) the draft
POST   /tickets/:id/messages          → student follow-up, if bot re-escalates
POST   /tickets/:id/resolve           → either party

GET    /advisor/tickets               → queue, scoped to this advisor's students
GET    /advisor/tickets/:id           → summary + email thread + transcript
POST   /advisor/tickets/:id/reply     → advisor reply
```

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
│   ├── scripts/         seed_data.py, ingest_kb.py
│   └── pyproject.toml
├── web/                 Next.js — landing, advisor login, dashboard
├── extension/           MV3 — manifest, content script, chat UI, background
├── supabase/migrations/
└── docs/PROJECT_PLAN.md
```

---

## 10. Build order

Dependency-ordered. Each phase is demoable on its own.

| # | Phase | Done when |
|---|---|---|
| 0 | **Foundations** — Supabase project, schema migrations, seed students/advisors **and their DARS reports** | You can query a seeded student, their advisor, and their audit |
| 1 | **Backend core** — config, Supabase auth, LLM client. **Verify tool calling works on the ASU gateway.** | A test call returns `tool_calls` |
| 2 | **DARS tools** — `get_dars_summary`, `get_requirement_detail` | "Am I on track?" answers correctly with zero invented numbers |
| 3 | **KB ingestion** — corpus, chunking, embeddings, vector search | `search_policy_kb("clubs for my major")` returns the right chunk |
| 4 | **Chat endpoint** — system prompt, full tool loop, streaming | curl each of the six §6.4 questions, get grounded answers |
| 5 | **Extension shell** — MV3 injection, shadow DOM, chat UI, `x`/`−` controls, login | Widget appears on a real ASU page and holds a conversation |
| 6 | **Escalation** — `escalate_to_advisor`, ticket creation, AI summary, editable draft, send | Ticket lands in the DB, assigned to the right advisor |
| 7 | **Advisor web app** — login, scoped queue, ticket detail, reply, resolve | Advisor answers a ticket end to end |
| 8 | **Loop closure** — unread reply card, icon badge, bot-mediated follow-ups | Full circle demoable in one take |
| 9 | **Landing page + polish** | Judge-ready |
| — | *Voice assistant* | Deferred. Mic permission stays out of the manifest until we build it |

**Phase 1 gates the architecture.** The ASU endpoint is OpenAI-compatible, so tool calling *should* work — but gateways vary by model. If it doesn't, §4.1 changes: an intent-classification pass runs before the main call and pre-fetches context, instead of the model choosing tools itself. Confirm this before writing the chat layer.

---

## 11. Open items

- [ ] `ASU_API_KEY`, `ASU_CHAT_MODEL`, `ASU_EMBEDDING_MODEL` in `.env`
- [ ] Supabase project + keys
- [ ] **DARS shape** — do we have a real DARS report to model the seed data on, or should I invent a faithful structure? A real one (even redacted) makes the seed data convincing.
- [ ] **KB source** — scraped from real ASU pages, or hand-written? Note this only applies to §6.2; DARS is seeded structured data either way.
- [ ] Seed personas — how many students/advisors, and whose situation does the demo follow?

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
