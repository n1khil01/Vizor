# Vizor — Demo Run Sheet

Presentation structure + exact inputs to type, in order. Everything below is copy-paste ready and matches the seeded fixtures.

---

## Accounts (from `scripts/create_demo_users.py`)

| Who | Email | Password | Where |
|---|---|---|---|
| Dr. Sarah Chen — advisor | `schen@asu.edu` | `VizorDemo2026!` | web app `/login` |
| **Morgan Reyes** — Junior, CS, GPA 2.59 (**demo hero**, at-risk DARS) | `mreyes@asu.edu` | `VizorDemo2026!` | extension (+ `/login/student` for the portal) |
| Jordan Alvarez — Senior, CS, GPA 3.98 (all requirements met) | `jalvarez@asu.edu` | `VizorDemo2026!` | extension |

Use **Morgan** for the live run. Morgan's audit contains the story: failed CSE 310 (SP25 E → retaken SP26 C), which pushed CSE 360 → CSE 485 → CSE 486 into a chain that can't fit before graduation. That's the "an advisor would need 20 minutes and a printed DARS to spot this" moment.

---

## Pre-flight (do this before you walk up)

- [ ] Backend running, KB ingested (`search_policy_kb` returns hits — test with the drop-deadline question below)
- [ ] Web app running, advisor logged in **in a second window/tab**, already on `/tickets` — do not burn stage time on a login form
- [ ] Extension loaded, panel open on a real `asu.edu` page, **logged out** so the login moment is visible
- [ ] Morgan's ticket queue cleared of stale demo tickets (or at least none unread — an unread reply card pops on load and will pre-empt your opening)
- [ ] Browser zoom up; the panel is small on a projector
- [ ] Backend logs visible on your own screen (not projected) so you can see tool calls fire

---

## Presentation structure

**Total ~6 min: 1 min setup, 4 min demo, 1 min architecture.** The demo is the pitch — do not front-load slides.

### 1. The problem (30 s, no slides)
Advisors at ASU carry caseloads in the hundreds. A huge share of appointment slots go to questions that were never advising: *what's the withdrawal deadline, which form do I file, am I on track.* The students with a real problem wait behind them. Both sides lose.

### 2. What Vizor is (30 s)
Two surfaces, one loop:
- A Chrome extension that lives on ASU pages — the student never leaves the page they're stuck on.
- An advisor portal that receives only what actually needs a human, pre-briefed.

Say the thesis out loud: **"Vizor doesn't try to replace the advisor. It tries to make sure that when a student reaches one, the advisor already knows everything."**

### 3. Live demo — four acts (4 min)
Run the acts below in order. They're built to escalate: FAQ deflection → real degree reasoning → escalation → advisor sees the pre-brief → reply lands back in chat. Do not skip Act 2; it's the act that proves this isn't a wrapper.

### 4. Architecture (45 s, one slide)
Next.js + TypeScript · FastAPI · Supabase (pgvector) · ASU AI Research LLM API.
Three grounded tool families the model must call: **DARS** (`get_dars_summary`, `list_unmet_requirements`, `get_graduation_projection`, `get_requirement_detail`, `get_courses_in_progress`), **policy KB** (`search_policy_kb`, embeddings-backed), **escalation** (`escalate_to_advisor`).

### 5. The three decisions worth defending (30 s)
Have these ready — they're what separates you from every other chatbot demo in the room:
1. **The bot never does credit math.** DARS already states satisfied / not satisfied per requirement; Vizor reads status, it never computes a degree outcome. Hallucinating a graduation date is the one unacceptable failure.
2. **Tool use is not left to vibes.** Against the real ASU gateway the model would answer "how do I withdraw" from memory without ever searching the KB, and would ask a clarifying question instead of escalating on "email my advisor." So there are narrow keyword backstops (`kb_intent.py`, `escalation_intent.py`) that *force* the right tool on the unambiguous cases. Everything else stays the model's judgment.
3. **Nothing sends itself, and nothing is remembered that shouldn't be.** The escalation is a draft the student edits and sends; chat transcripts are never persisted server-side; resolution is asymmetric — an advisor close is hard (gone from the bot's context), a student close is soft (recoverable, so a premature close can't destroy context they'll need).

### 6. Close (15 s)
The metric this is built to move: appointment slots returned to students who need them, and zero appointments that start with "so, tell me your situation from the beginning."

---

## Act 1 — Self-serve deflection (the volume case)

Log in on the extension as Morgan first, live, so they see the auth gate.

> **Extension login**
> - ASU email: `mreyes@asu.edu`
> - Password: `VizorDemo2026!`

**Type message 1:**
```
What's the deadline to withdraw from a course, and does a W hurt my GPA?
```
Expect: forces `search_policy_kb` (matches `\bwithdraw`). Answer should cite the real steps — My ASU → My Classes → Withdraw, W doesn't count toward GPA but does count toward attempted hours, financial-aid warning — and include the source link. Say out loud: *"That was retrieved, not remembered."*

**Type message 2:**
```
Do I need an advising appointment to withdraw?
```
Expect: a clear **no**, with the exception carved out (you do need one if it affects a specific degree requirement or aid). This is the deflection story in one answer — an appointment that never gets booked.

---

## Act 2 — The DARS moment (the act that wins it)

**Type message 3:**
```
Am I on track to graduate on time?
```
Expect: `get_graduation_projection` fires (not credit math). Grounded in Morgan's real audit: overall status **at least one requirement has not been satisfied**, 96 hours earned, expected term SP27.

**Type message 4:**
```
Which requirements am I still missing?
```
Expect: `list_unmet_requirements` — should name the actual unmet lines: CSE 485, CSE 486, Upper Division CS (needs 6 hours), CS electives, upper-division technical electives, and the two Literacy & Critical Inquiry lines that resolve through CSE 485/486.

**Type message 5 (the kill shot):**
```
Why can't I just take CSE 485 and CSE 486 next semester?
```
Expect: `get_requirement_detail` — Vizor should surface the prereq chain: CSE 485 needs CSE 360 (in progress FA26), CSE 486 needs CSE 485 (not started). Land the point: *"Morgan failed CSE 310 a year ago. That single grade is why they can't graduate on schedule, and it's buried on page four of a DARS audit. Vizor found it in one question."*

---

## Act 3 — Escalation (student stays in control)

**Type message 6:**
```
I'm thinking about switching my major because of this. Can I email my advisor about it?
```
Expect: escalation intent wins over KB intent (both match — advisor phrasing takes priority), so `escalate_to_advisor` fires immediately with no clarifying-question stall. A **Draft for your advisor** memo card renders below the answer, marked *Not sent*, addressed to Dr. Sarah Chen.

**Now edit the draft live** — this is the trust beat, so actually type into it:

> **Subject** (replace with):
> ```
> Major switch — CSE 485/486 sequencing
> ```
> **Message** (append to the bottom of what the model wrote):
> ```
> I'd rather meet before the SP27 registration window if you have time.
> ```

Then press **Send to advisor**. The card flips to *Sent* and stamps a ticket id + "assigned to Dr. Sarah Chen".

Say: *"Nothing left the student's hands until they pressed send. The model drafted, the student owns it."*

---

## Act 4 — Advisor side (the pre-brief)

Switch to the web app window (already logged in as Dr. Sarah Chen, on `/tickets`). Refresh.

The new ticket appears. Open it. Point at the two cards side by side:
- **Why Vizor escalated this** — the reason the bot couldn't resolve it
- **Vizor's summary** — the annotated report: category, what the student needs, what was already tried and ruled out

Then the **Correspondence** section with the exact email Morgan sent.

Say: *"The advisor has not asked a single question yet and already knows more than they'd get in the first ten minutes of an appointment."*

**Reply — type into the reply box:**
```
Morgan — before we talk about switching, I want to look at a summer session for CSE 485. That may recover the timeline entirely. Can you meet Thursday at 2?
```
Send it.

---

## Act 5 — The loop closes

Back on the extension: **reload the ASU page** (fresh session — this is also the proof that sessions don't persist).

Expect: a **Reply from your advisor** card at the top of the chat, before you type anything.

**Then type:**
```
Would summer session actually fix my timeline?
```
Expect: the bot answers using the advisor's reply as context and only re-escalates if it still can't resolve — follow-ups go through the bot first, so the advisor isn't dragged back in for something already answered.

Optional if you have time: hit **Mark as read**, and note the queue badge clears.

---

## Additional test cases (for your own pre-demo QA, not the live run)

Run these before you present. Each one exercises a distinct path.

### Direct ticket creation (the `+` button, no bot involved)
Click **+** in the extension composer.
> - Subject: `Major Clarification`
> - Message: `What would the necessary steps and forms be to switch my major?`

Expect: ticket lands in the advisor queue with category = the subject you typed. This is your fallback path if the LLM gateway is slow or flaky mid-demo — you can still show the advisor side.

### KB coverage sweep (each should fire `search_policy_kb`)
```
How do I file a late add petition?
```
```
What clubs are there for computer science majors?
```
```
Tell me about the 4+1 accelerated master's program.
```
```
How do I request an official transcript?
```
```
I'm on academic probation — how does the appeal work?
```

### Escalation-intent backstop (each should force `escalate_to_advisor`)
```
Can I set up a meeting with my advisor?
```
```
I need to talk to my advisor about my financial aid.
```
```
Open a ticket for me.
```

### Grounding / anti-hallucination checks
```
What did I ask you about last time?
```
Expect: says it has no memory of prior sessions. It must **not** invent one.

```
How many credits do I have left?
```
Expect: numbers that match the audit (96 earned of 120, 129 hours to complete per the audit's own line) — not the model's arithmetic.

### Contrast persona (log in as Jordan)
```
Am I on track to graduate?
```
Expect: the "all requirements met, but in-progress courses were used" status with FA26 expected graduation — proves the DARS read is per-student, not a canned response.

### Attachment path
Attach a small `.txt` with a couple of course notes, then:
```
Based on the plan I attached, does that clear my remaining requirements?
```
Expect: the answer uses the file. Reload — the attachment is gone (never stored).

### Isolation / auth checks
- Advisor B (if seeded) must not see Dr. Chen's tickets.
- `/portal` while logged in as an advisor → redirect. `/dashboard` as a student → redirect.
- Student portal (`/login/student` → `/portal`) is intentionally **read-only** — ticket history, no reply box. Don't script a student reply there; the bot is the student's channel.

---

## If something breaks on stage

| Failure | Recovery |
|---|---|
| LLM gateway slow/timing out | Skip to the `+` direct-ticket path (Act 3 alt), then run Acts 4–5 normally. The cross-app loop is the story; the model is not the only proof. |
| KB returns nothing | Say "retrieval is scoped deliberately — a broad crawl poisons results" and move to Act 2. DARS is local data and won't fail. |
| No unread reply card appears in Act 5 | Ask directly: `Any update from my advisor?` |
| Extension won't auth | Show the same ticket at `/portal` logged in as Morgan; the ticket trail is identical. |
