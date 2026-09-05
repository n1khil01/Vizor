# Vizor

An AI advising assistant for ASU students, built for the ASU AIR Spark Challenge.

Vizor has two surfaces over one loop:

- **A Chrome extension** (MV3) that injects a chat panel into any `*.asu.edu` page, so a student never leaves the page they're stuck on. It answers degree-progress questions from the student's real DARS audit and policy questions from a retrieval-backed knowledge base.
- **A Next.js advisor portal** that receives only the cases that actually need a human — pre-briefed with why Vizor escalated, what the student needs, and what was already ruled out.

```
┌──────────────────────┐
│  Chrome Extension    │  MV3 content script on *://*.asu.edu/*
│  (student surface)   │  chat UI in a shadow DOM
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

The ASU API key lives **only** in the FastAPI process. A content script is readable by anyone who opens devtools, so the extension never talks to the LLM directly — every model call is proxied.

**Stack:** Next.js 16 + TypeScript + Tailwind 4 · Python 3.11+ / FastAPI · Supabase (Postgres + pgvector + Auth) · ASU AI Research LLM gateway.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Clone and configure environment](#2-clone-and-configure-environment)
3. [Set up Supabase](#3-set-up-supabase)
4. [Set up and run the backend](#4-set-up-and-run-the-backend)
5. [Seed demo data (users + DARS)](#5-seed-demo-data-users--dars)
6. [Ingest the policy knowledge base](#6-ingest-the-policy-knowledge-base)
7. [Set up and run the website](#7-set-up-and-run-the-website)
8. [Set up the Chrome extension](#8-set-up-the-chrome-extension)
9. [End-to-end smoke test](#9-end-to-end-smoke-test)
10. [Demo accounts](#demo-accounts)
11. [Project layout](#project-layout)
12. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | 3.11+ (repo dev venv is 3.13) | Backend runtime |
| [uv](https://docs.astral.sh/uv/) | latest | Python dependency + venv manager; `pyproject.toml` + `uv.lock` are the source of truth |
| Node.js | 20+ | Next.js 16 requires it |
| npm | 10+ | Ships with Node 20 |
| [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) | latest | Applying migrations |
| Google Chrome | any recent | MV3 extension, loaded unpacked |

Install `uv` and the Supabase CLI on macOS:

```bash
brew install uv supabase/tap/supabase
```

You also need:

- A **Supabase project** (hosted, or local via `supabase start`) — Postgres with the `vector` and `pgcrypto` extensions.
- **ASU AI Research LLM gateway credentials** — an API key plus the chat and embedding model names available to you at `https://openai.rc.asu.edu/v1`.

---

## 2. Clone and configure environment

```bash
git clone <your-remote> Vizor && cd Vizor
```

There are two env files, and neither is committed (`.gitignore` ignores `.env*` except `.env.example`).

### `.env` — repo root, read by the backend

Copy the template and fill it in:

```bash
cp .env.example .env
```

`backend/app/config.py` loads `../.env` relative to the backend working directory, so this file **must live at the repo root** and the backend **must be started from `backend/`**. Required keys:

| Key | What it is |
|---|---|
| `SUPABASE_URL` | Project URL, e.g. `https://xxxx.supabase.co` (or `http://127.0.0.1:54321` locally) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key. Used for all backend data access and for seeding auth users. **Never ship this to a browser.** |
| `SUPABASE_ANON_KEY` | Anon key. Used *only* for password sign-in — the service-role client bypasses password checks, so it can't authenticate a real login. |
| `SUPABASE_DB_URL` | Direct Postgres connection string (used by scripts that talk to the DB outside PostgREST) |
| `ASU_API_KEY` | ASU AI Research LLM gateway key |
| `ASU_API_BASE` | Defaults to `https://openai.rc.asu.edu/v1` |
| `ASU_CHAT_MODEL` | Chat model name on the gateway |
| `ASU_EMBEDDING_MODEL` | Embedding model name on the gateway |
| `CORS_ALLOWED_ORIGINS` | Comma-separated. Defaults to `http://localhost:3000` |

> The backend additionally allows any `*.asu.edu` origin by regex and opts in to Chrome's Private Network Access preflight — that's what lets the extension's content script, running on a public HTTPS ASU page, call `localhost:8000`. You do not need to add a `chrome-extension://` origin.

### `web/.env.local` — read by Next.js

```bash
cat > web/.env.local <<'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EOF
```

The web app talks to Supabase directly (server components + `@supabase/ssr`), not through the FastAPI backend — so it needs only these two, and both are the public-safe values.

---

## 3. Set up Supabase

### Option A — hosted project (what the demo uses)

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### Option B — fully local

```bash
supabase start        # boots Postgres, Auth, and the REST API in Docker
supabase db reset     # creates the schema and applies every migration
```

`supabase start` prints the local API URL and the anon/service-role keys — put those in `.env` and `web/.env.local`.

### What the migrations create

| Migration | Contents |
|---|---|
| `0001_init.sql` | `vector` + `pgcrypto` extensions; `profiles`, `students`, `dars_reports`, `dars_requirements`, `dars_courses`, `course_prereqs`, `conversations`, `messages`, `tickets`, `ticket_messages`, `kb_documents`, `kb_chunks` |
| `0002_kb_search.sql` | The `match_kb_chunks` similarity-search RPC |
| `0003_kb_embedding_dims.sql` | Widens embeddings to `vector(4096)` — the ASU embedding model emits 4096 dims, not 1536. No ANN index at this dimension (pgvector caps ivfflat/HNSW at 2000); the demo corpus is small enough that brute-force cosine is fast. |
| `0004_ticket_writes.sql` | RLS policies for ticket writes — advisor vs. student update rights, and `ticket_messages` insert/update |

Verify the schema landed:

```bash
supabase migration list
```

---

## 4. Set up and run the backend

```bash
cd backend
uv sync                      # creates .venv and installs from uv.lock
```

Run the API:

```bash
cd backend && uv run uvicorn app.main:app --reload --port 8000
```

Check it:

```bash
curl http://localhost:8000/health
```

Expected: `{"status":"ok"}`. Interactive docs are at <http://localhost:8000/docs>.

> If `Settings` raises a validation error on startup, a required key is missing from the root `.env` — or you started uvicorn from the repo root instead of `backend/`.

### API surface

```
POST   /auth/login              → JWT (email + password)
GET    /auth/me                 → profile + student record + unread advisor replies
POST   /chat                    → SSE stream; runs the grounded tool loop
GET    /tickets                 → the student's open tickets
GET    /tickets/:id             → one ticket + its message thread
POST   /tickets                 → student sends the (edited) escalation draft
POST   /tickets/:id/resolve     → student-side soft close
GET    /health
```

Advisor-side reads and replies go through the Next.js app against Supabase directly, so there is no `/advisor/*` router in FastAPI.

### The tool families

The model can't free-associate about a degree — it must call a tool:

- **DARS** — `get_dars_summary`, `list_unmet_requirements`, `get_graduation_projection`, `get_requirement_detail`, `get_courses_in_progress`. Vizor *reads* the audit's per-requirement satisfied/not-satisfied status; it never computes a degree outcome or invents a graduation date.
- **Policy KB** — `search_policy_kb`, embeddings-backed over the ingested corpus.
- **Escalation** — `escalate_to_advisor`, which produces a *draft* the student edits and sends.

`llm/kb_intent.py` and `llm/escalation_intent.py` are narrow keyword backstops that force the right tool on unambiguous phrasings (the gateway model will otherwise answer "how do I withdraw" from memory without ever searching). Everything else stays the model's judgment.

---

## 5. Seed demo data (users + DARS)

Creates (or reuses) the Supabase Auth accounts and seeds their profiles, student records, DARS reports, and course prereqs in one pass:

```bash
cd backend && uv run scripts/create_demo_users.py
```

Verify the row counts:

```bash
cd backend && uv run scripts/verify_seed.py
```

Expected: non-zero counts for `profiles`, `students`, `dars_reports`, `dars_requirements`, `dars_courses`, `course_prereqs`.

Check that the DARS tools return real audit data:

```bash
cd backend && uv run scripts/verify_dars_tools.py
```

DARS fixtures live in `backend/fixtures/dars/` (`sample.json` — on track; `sample-at-risk.json` — the failed-prereq story), derived from the redacted uAchieve audit in `docs/reference/`.

---

## 6. Ingest the policy knowledge base

Pipeline: `seeds.yaml` → fetch → extract → `fixtures/kb/documents.json` → chunk → embed → pgvector. Each stage is independently re-runnable.

```bash
cd backend && uv run scripts/ingest_kb.py all
```

Or run the stages separately:

```bash
cd backend && uv run scripts/ingest_kb.py fetch    # seeds.yaml → documents.json
```

```bash
cd backend && uv run scripts/ingest_kb.py load     # documents.json → chunk, embed, load
```

- `fetch` pulls the static ASU pages listed in `backend/seeds.yaml` (raw HTML cached in `backend/cache/`, so re-running never re-hits ASU), hits the club-directory API, and reads the handwritten procedural docs in `backend/fixtures/kb/procedural/`.
- `load` requires working ASU embedding credentials — it calls the gateway for every chunk.

Verify retrieval quality (each eval question must retrieve its expected source document):

```bash
cd backend && uv run scripts/verify_kb_retrieval.py
```

Then verify the full grounded loop — that each question routes to the right source (DARS vs. KB) and answers with real numbers:

```bash
cd backend && uv run scripts/verify_chat.py
```

```bash
cd backend && uv run scripts/verify_tool_calling.py
```

---

## 7. Set up and run the website

```bash
cd web
npm install
npm run dev
```

Open <http://localhost:3000>.

| Route | What it is |
|---|---|
| `/` | Landing page |
| `/login` | Advisor sign-in → advisor dashboard |
| `/login/student` | Student sign-in → student portal |
| `/dashboard`, `/tickets`, `/students`, `/sessions`, `/reports` | Advisor workspace (ticket queue, student detail, requirement tree) |
| `/portal`, `/portal/tickets/:id` | Student-facing ticket view |

Sign in at `/login` as `schen@asu.edu` / `VizorDemo2026!` and land on `/tickets`.

Production build:

```bash
cd web && npm run build && npm run start
```

Lint:

```bash
cd web && npm run lint
```

> Auth session refresh runs in `web/proxy.ts` via `@supabase/ssr`. If sign-in succeeds but every page bounces back to `/login`, the two `NEXT_PUBLIC_*` values in `web/.env.local` are wrong or point at a different project than the one you seeded. Restart `next dev` after editing env files.

---

## 8. Set up the Chrome extension

The extension is unbundled — no build step, no npm install. You load the `extension/` directory as-is.

### 8.1 Point it at your backend

`extension/config.js`:

```js
const VIZOR_API_BASE = "http://localhost:8000";
```

Leave it as-is for local development. If you point it at a deployed API, also update `host_permissions` in `extension/manifest.json` to match that origin — MV3 blocks fetches to hosts not listed there.

### 8.2 Load it in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select the `extension/` folder in this repo.
5. Confirm "Vizor 0.1.0" appears with no errors. If there's an **Errors** button, open it — a manifest typo shows up here.

### 8.3 Use it

1. Make sure the backend is running on port 8000.
2. Navigate to any `*.asu.edu` page (e.g. <https://www.asu.edu>). The content script matches `*://*.asu.edu/*` and injects on `document_idle`; it will not appear anywhere else.
3. Click the Vizor bubble in the corner to open the panel.
4. Sign in with a seeded **student** account (`mreyes@asu.edu` / `VizorDemo2026!`). Advisor accounts are rejected — chat and tickets are student-scoped.
5. Ask a question. Use `+` in the composer to file a ticket directly, without the bot.

**How it behaves, by design:**

- The whole UI lives in a shadow DOM, so the host ASU page's CSS can't touch it and vice versa. Model- and user-authored text is written with `textContent`/`.value`, never `innerHTML`.
- The JWT is cached in `chrome.storage.local` (cookies are impossible — the widget runs on `asu.edu`, a different origin from the backend), along with the panel's open/minimized/closed state.
- **Chat transcripts are never persisted.** The message list is this session's turns only. Reloading the page gives you a fresh conversation — that's intentional, and it's also what makes the "reply from your advisor" card visible on reload.

### 8.4 After you change extension code

Content scripts are not hot-reloaded. Hit the **↻ reload** button on the Vizor card in `chrome://extensions`, then **reload the ASU tab**. Missing the second step is the most common reason an edit "didn't take."

---

## 9. End-to-end smoke test

With the backend, web app, and extension all running:

1. **Backend** — `curl http://localhost:8000/health` returns `{"status":"ok"}`.
2. **KB** — on the extension, ask *"What's the deadline to withdraw from a course?"* Backend logs should show `search_policy_kb` firing, and the answer should carry a source link.
3. **DARS** — as Morgan, ask *"Am I on track to graduate on time?"* Expect `get_graduation_projection` and real numbers from the audit (96 hours earned, expected SP27), not credit arithmetic.
4. **Escalation** — ask *"Can I email my advisor about switching majors?"* A **Draft for your advisor** card renders, marked *Not sent*. Edit it, then press **Send to advisor**; it stamps a ticket id.
5. **Advisor side** — in the web app at `/tickets` as Dr. Chen, refresh. The new ticket appears with the escalation reason and Vizor's summary. Reply to it.
6. **Loop closes** — reload the ASU page. A **Reply from your advisor** card appears at the top of the fresh chat.

`HACKATHON_TEST_SCRIPT.md` has the full run sheet with exact copy-paste inputs and expected tool calls.

---

## Demo accounts

Created by `scripts/create_demo_users.py`; all share the password `VizorDemo2026!`.

| Who | Email | Surface |
|---|---|---|
| Dr. Sarah Chen — advisor | `schen@asu.edu` | Web app `/login` |
| Morgan Reyes — Junior, CS, GPA 2.59, at-risk DARS | `mreyes@asu.edu` | Extension (+ `/login/student`) |
| Jordan Alvarez — Senior, CS, GPA 3.98, all requirements met | `jalvarez@asu.edu` | Extension (+ `/login/student`) |

Student accounts are seeded, never self-registered — there is no sign-up flow.

---

## Project layout

```
Vizor/
├── backend/
│   ├── app/
│   │   ├── main.py  config.py  auth.py
│   │   ├── llm/         gateway client, prompts, tool loop, intent backstops
│   │   ├── routers/     auth, chat, tickets
│   │   ├── dars/        projection, repository, terms, tools
│   │   ├── kb/          chunker, embeddings, repository, service, tools
│   │   ├── tickets/     service, tools
│   │   └── db/          Supabase client
│   ├── scripts/         create_demo_users, seed_data, ingest_kb, verify_*
│   ├── fixtures/        dars/*.json, kb/documents.json, kb/procedural/*.md
│   ├── seeds.yaml       KB scrape targets
│   ├── cache/           raw scraped HTML (git-ignored)
│   └── pyproject.toml
├── web/                 Next.js — landing, advisor dashboard, student portal
├── extension/           MV3 — manifest, config, styles, content script, icons
├── supabase/migrations/ 0001–0004
├── docs/
│   ├── PROJECT_PLAN.md          full design rationale
│   └── reference/               redacted DARS audit, schema source of truth
└── HACKATHON_TEST_SCRIPT.md     demo run sheet
```

The two `.claude/launch.json` configurations (`backend`, `web`) start the same two dev servers described above.

---

## Troubleshooting

**`ValidationError` on backend startup.** A key is missing from the root `.env`, or you launched uvicorn from the repo root. `config.py` reads `../.env` relative to the process working directory — start from `backend/`.

**Extension panel never appears.** Confirm the URL is under `*.asu.edu` (the content script matches nothing else), then check `chrome://extensions` for a load error, then reload both the extension and the tab.

**Extension login fails / requests never reach the backend.** Confirm the backend is on port 8000 and `VIZOR_API_BASE` matches. If the console shows a CORS or Private Network Access failure, the request is being blocked before it arrives — `main.py` sets `allow_private_network=True` for exactly this case, so a failure here usually means you're hitting a different backend build or a non-`asu.edu` page.

**`search_policy_kb` returns nothing.** The KB was never loaded, or was loaded before migration `0003` widened embeddings to 4096 dims. Re-run `uv run scripts/ingest_kb.py load` after `supabase db push`.

**Embedding dimension mismatch on insert.** Same cause. `kb_chunks.embedding` must be `vector(4096)`; confirm `0003_kb_embedding_dims.sql` is applied.

**Web app redirect loop back to `/login`.** `web/.env.local` is missing, wrong, or points at a Supabase project that has no seeded profiles. Restart `next dev` after editing it.

**Advisor account can't use the extension.** Correct — `/chat` and `/tickets` require the `student` role. Use a student account.
