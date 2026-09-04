// Vizor widget: injected once per ASU page. Shadow DOM isolates our styles
// from the host page's; nothing here touches the surrounding page.
//
// Model- and user-authored text is always written with textContent or .value,
// never innerHTML — the only markup built from a string is the static shell.
(function () {
  if (document.getElementById("vizor-host")) return;

  const STORAGE_KEY = "vizor_token";
  const STATE_KEY = "vizor_widget_state"; // "open" | "minimized" | "closed"

  // Drawn from the question kinds the KB and DARS tools actually cover
  // (docs/PROJECT_PLAN.md §6.4), so the empty state advertises real ability.
  const STARTERS = [
    "Am I on track to graduate on time?",
    "What clubs fit my major?",
    "How do I withdraw from a course?",
  ];

  const host = document.createElement("div");
  host.id = "vizor-host";
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: "open" });

  root.innerHTML = `
    <style>${CSS_TEXT}</style>
    <div id="root">
      <button id="bubble" title="Open Vizor" aria-label="Open Vizor">
        <svg id="bubble-ring" viewBox="0 0 54 54" aria-hidden="true">
          <circle cx="27" cy="27" r="25.5" />
        </svg>
        <img id="bubble-logo" alt="" src="${chrome.runtime.getURL("icons/logo.png")}" />
        <span class="dot" hidden></span>
      </button>

      <section id="panel" role="dialog" aria-label="Vizor advising assistant" hidden>
        <header id="header">
          <h1 style="margin:0">
            <img id="wordmark-logo" alt="" src="${chrome.runtime.getURL("icons/logo.png")}" />
            <span id="wordmark">Vizor</span>
            <span id="kicker">ASU Advising</span>
          </h1>
          <div id="controls">
            <button id="logout" title="Log out" hidden>Log out</button>
            <button id="minimize" title="Minimize" aria-label="Minimize">&minus;</button>
            <button id="close" title="Close" aria-label="Close">&times;</button>
          </div>
        </header>

        <div id="login-view">
          <p class="eyebrow">Sun Devil sign-in</p>
          <h2 class="display">Advising, without the wait.</h2>
          <p class="sub">Sign in to ask about your degree progress, deadlines, and what to do next.</p>

          <label class="field">
            <span class="field-label">ASU email</span>
            <input id="email" type="email" autocomplete="username" placeholder="you@asu.edu" />
          </label>
          <label class="field">
            <span class="field-label">Password</span>
            <input id="password" type="password" autocomplete="current-password" placeholder="••••••••" />
          </label>

          <button id="login-btn" class="btn-primary">Sign in</button>
          <p id="login-error" class="error" role="alert" hidden></p>

          <p id="login-foot">
            Vizor reads your degree audit to answer you.<br />
            Nothing reaches your advisor until you send it.
          </p>
        </div>

        <div id="chat-view" hidden>
          <div id="messages" role="log" aria-live="polite" aria-label="Conversation">
            <div id="empty">
              <h2 class="display">What do you need to sort out?</h2>
              <p class="sub">Vizor reads your degree audit and ASU policy directly &mdash; and pulls in your advisor when a question genuinely needs one.</p>
              <ul class="starters"></ul>
            </div>
          </div>
          <div id="attachments" hidden></div>
          <div id="composer">
            <button id="new-ticket" title="Open a ticket for your advisor" aria-label="Open a ticket for your advisor">+</button>
            <label class="sr-only" for="input">Message Vizor</label>
            <textarea id="input" rows="1" placeholder="Ask about your degree, a form, a deadline&hellip;"></textarea>
            <label id="attach-label" title="Attach a file" aria-label="Attach a file">
              📎<input id="file-input" type="file" accept=".txt,.md,.csv,.json,.log" multiple hidden />
            </label>
            <button id="send">Send</button>
          </div>
        </div>
      </section>
    </div>
  `;

  const $ = (sel) => root.querySelector(sel);
  const bubble = $("#bubble");
  const panel = $("#panel");
  const loginView = $("#login-view");
  const chatView = $("#chat-view");
  const messagesEl = $("#messages");
  const emptyEl = $("#empty");
  const inputEl = $("#input");
  const sendBtn = $("#send");
  const logoutBtn = $("#logout");

  let token = null;
  let conversationId = null;
  let streaming = false;
  const bubbleDot = $("#bubble .dot");

  // This session's turns only — never written to chrome.storage or any
  // persistent store, and reset to [] whenever the widget reloads or the
  // student logs out, so a new visit never carries prior-session context.
  let sessionHistory = [];
  let pendingAttachments = []; // [{filename, text}], cleared after each send
  const attachmentsEl = $("#attachments");
  const fileInput = $("#file-input");
  const newTicketBtn = $("#new-ticket");

  // ── Chrome ────────────────────────────────────────────────────────

  function setWidgetState(state) {
    chrome.storage.local.set({ [STATE_KEY]: state });
    if (state === "open") {
      panel.hidden = false;
      bubble.hidden = true;
    } else {
      panel.hidden = true;
      bubble.hidden = false;
      bubble.classList.toggle("minimized", state === "minimized");
    }
  }

  async function showChat() {
    loginView.hidden = true;
    chatView.hidden = false;
    logoutBtn.hidden = false;
    inputEl.focus();
    const unread = await refreshUnreadBadge();
    (unread || []).forEach(renderUnreadReply);
  }

  async function logout() {
    await chrome.storage.local.remove(STORAGE_KEY);
    token = null;
    conversationId = null;
    sessionHistory = [];
    pendingAttachments = [];
    renderAttachments();
    messagesEl.querySelectorAll(".msg, .memo").forEach((el) => el.remove());
    emptyEl.hidden = false;
    logoutBtn.hidden = true;
    chatView.hidden = true;
    loginView.hidden = false;
  }

  function autosize(el, max) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }

  function setStreaming(on) {
    streaming = on;
    sendBtn.disabled = on;
    inputEl.disabled = on;
  }

  // ── Transcript ────────────────────────────────────────────────────

  function scrollToEnd() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addMessage(role, text) {
    emptyEl.hidden = true;
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    scrollToEnd();
    return div;
  }

  function addNote(text) {
    const div = document.createElement("div");
    div.className = "msg note";
    div.textContent = text;
    messagesEl.appendChild(div);
    scrollToEnd();
  }

  // ── Escalation memo (docs/PROJECT_PLAN.md §4.2) ───────────────────
  // The draft is model-authored but student-owned: nothing reaches the
  // advisor until they press send, and they can rewrite it first.

  function renderEscalation(draft) {
    emptyEl.hidden = true;

    const memo = document.createElement("article");
    memo.className = "memo";
    memo.dataset.state = "draft";
    memo.innerHTML = `
      <div class="memo-head">
        <span class="memo-kicker">Draft for your advisor</span>
        <span class="memo-stamp">Not sent</span>
      </div>
      <dl class="memo-meta">
        <dt>To</dt><dd class="memo-to"></dd>
        <dt>Re</dt><dd class="memo-re"></dd>
      </dl>
      <p class="memo-why"><b>Why this needs a person</b><span class="memo-reason"></span></p>
      <label class="field">
        <span class="field-label">Subject</span>
        <input class="memo-subject" type="text" />
      </label>
      <label class="field">
        <span class="field-label">Message</span>
        <textarea class="memo-body" rows="5"></textarea>
      </label>
      <div class="memo-actions">
        <button class="btn-ghost memo-discard">Discard</button>
        <button class="btn-primary memo-send">Send to advisor</button>
      </div>
      <p class="memo-receipt" hidden></p>
    `;

    const q = (sel) => memo.querySelector(sel);
    q(".memo-to").textContent = draft.advisor_name
      ? `${draft.advisor_name} · your advisor`
      : "Your advisor";
    q(".memo-re").textContent = draft.category || "Advising request";
    q(".memo-reason").textContent = draft.reason || "";
    q(".memo-subject").value = draft.draft_subject || "";

    const bodyEl = q(".memo-body");
    bodyEl.value = draft.draft_body || "";

    messagesEl.appendChild(memo);
    requestAnimationFrame(() => autosize(bodyEl, 122));
    bodyEl.addEventListener("input", () => autosize(bodyEl, 122));
    scrollToEnd();

    q(".memo-discard").addEventListener("click", () => {
      memo.remove();
      addNote("Draft discarded — nothing was sent.");
    });

    q(".memo-send").addEventListener("click", async () => {
      const sendEl = q(".memo-send");
      const errEl = q(".memo-receipt");
      sendEl.disabled = true;
      sendEl.textContent = "Sending…";
      errEl.hidden = true;

      try {
        const res = await fetch(`${VIZOR_API_BASE}/tickets`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: draft.reason,
            summary: draft.summary,
            category: draft.category,
            draft_subject: q(".memo-subject").value,
            draft_body: bodyEl.value,
            conversation_id: conversationId,
          }),
        });
        if (!res.ok) throw new Error("Couldn't send that — try again in a moment.");
        const ticket = await res.json();

        memo.dataset.state = "sent";
        q(".memo-kicker").textContent = "Sent to your advisor";
        q(".memo-stamp").textContent = "Sent";
        q(".memo-subject").readOnly = true;
        bodyEl.readOnly = true;
        q(".memo-actions").remove();
        errEl.hidden = false;
        errEl.textContent =
          `Ticket ${String(ticket.id).slice(0, 8)} · opened ` +
          `${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}` +
          `${ticket.advisor_name ? ` · assigned to ${ticket.advisor_name}` : ""}`;
        scrollToEnd();
      } catch (e) {
        sendEl.disabled = false;
        sendEl.textContent = "Send to advisor";
        errEl.hidden = false;
        errEl.textContent = e.message || "Something went wrong.";
      }
    });
  }

  // ── Advisor replies (docs/PROJECT_PLAN.md §4.4) ────────────────────
  // The one thing surfaced proactively rather than on request — an unread
  // reply sits in the ticket queue same as any other closed loop otherwise.

  function renderUnreadReply(reply) {
    emptyEl.hidden = true;

    const card = document.createElement("article");
    card.className = "memo";
    card.dataset.state = "reply";
    card.innerHTML = `
      <div class="memo-head">
        <span class="memo-kicker">Reply from your advisor</span>
      </div>
      <dl class="memo-meta">
        <dt>Re</dt><dd class="memo-re"></dd>
      </dl>
      <p class="memo-body-text"></p>
      <div class="memo-actions">
        <button class="btn-primary memo-ack">Mark as read</button>
      </div>
    `;
    card.querySelector(".memo-re").textContent = reply.subject || "Your ticket";
    card.querySelector(".memo-body-text").textContent = reply.body || "";
    messagesEl.prepend(card);
    scrollToEnd();

    card.querySelector(".memo-ack").addEventListener("click", async () => {
      // GET /tickets/:id marks every advisor message on it read server-side
      // (app/tickets/service.py:mark_advisor_messages_read) — same call the
      // `get_ticket` chat tool makes, so "read" means the same thing either
      // way the student encounters it.
      try {
        await fetch(`${VIZOR_API_BASE}/tickets/${reply.ticket_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Best-effort — the card still dismisses locally either way.
      }
      card.remove();
      refreshUnreadBadge();
    });
  }

  async function refreshUnreadBadge() {
    if (!token) return;
    try {
      const res = await fetch(`${VIZOR_API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const me = await res.json();
      const unread = me.unread_advisor_replies || [];
      bubbleDot.hidden = unread.length === 0;
      return unread;
    } catch {
      return [];
    }
  }

  // ── Network ───────────────────────────────────────────────────────

  async function login(email, password) {
    const errEl = $("#login-error");
    const btn = $("#login-btn");
    errEl.hidden = true;
    btn.disabled = true;
    btn.textContent = "Signing in…";
    try {
      const res = await fetch(`${VIZOR_API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("That email and password didn't match.");
      const data = await res.json();
      token = data.access_token;
      await chrome.storage.local.set({ [STORAGE_KEY]: token });
      showChat();
    } catch (e) {
      errEl.textContent = e.message || "Sign-in failed.";
      errEl.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = "Sign in";
    }
  }

  async function sendMessage(text) {
    if (!text.trim() || !token || streaming) return;
    addMessage("user", text);
    inputEl.value = "";
    autosize(inputEl, 108);
    setStreaming(true);

    const assistantEl = addMessage("assistant", "");
    assistantEl.classList.add("pending");
    let escalation = null;
    const attachmentsForThisTurn = pendingAttachments;
    pendingAttachments = [];
    renderAttachments();

    try {
      const res = await fetch(`${VIZOR_API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId,
          history: sessionHistory,
          attachments: attachmentsForThisTurn,
        }),
      });

      if (res.status === 401) {
        assistantEl.remove();
        await logout();
        return;
      }
      if (!res.ok || !res.body) throw new Error("Vizor couldn't respond. Try again.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      assistantEl.classList.remove("pending");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const raw of events) {
          const lines = raw.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event: "));
          const dataLine = lines.find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          const payload = JSON.parse(dataLine.slice("data: ".length));
          const eventName = eventLine ? eventLine.slice("event: ".length) : "message";

          if (eventName === "conversation") {
            conversationId = payload.conversation_id;
          } else if (eventName === "escalation") {
            // Held until the answer finishes streaming, so the memo lands
            // after Vizor's explanation rather than interrupting it.
            escalation = payload;
          } else if (payload.delta) {
            assistantEl.textContent += payload.delta;
            scrollToEnd();
          }
        }
      }

      if (escalation) renderEscalation(escalation);

      // Kept only in memory for the rest of this session — never sent
      // anywhere for storage, and gone the moment the widget reloads.
      sessionHistory.push({ role: "user", content: text });
      sessionHistory.push({ role: "assistant", content: assistantEl.textContent });
    } catch (e) {
      assistantEl.classList.remove("pending");
      assistantEl.textContent = e.message || "Something went wrong.";
      assistantEl.classList.add("error");
    } finally {
      setStreaming(false);
      inputEl.focus();
    }
  }

  // ── Attachments (students can supplement the assistant with a file) ─

  function renderAttachments() {
    attachmentsEl.innerHTML = "";
    attachmentsEl.hidden = pendingAttachments.length === 0;
    pendingAttachments.forEach((a, i) => {
      const chip = document.createElement("span");
      chip.className = "attachment-chip";
      chip.appendChild(document.createTextNode(a.filename));
      const remove = document.createElement("button");
      remove.textContent = "×";
      remove.title = `Remove ${a.filename}`;
      remove.addEventListener("click", () => {
        pendingAttachments.splice(i, 1);
        renderAttachments();
      });
      chip.appendChild(remove);
      attachmentsEl.appendChild(chip);
    });
  }

  async function handleFileSelection(files) {
    for (const file of Array.from(files)) {
      if (file.size > 200_000) {
        addNote(`${file.name} is too large to attach (200KB max).`);
        continue;
      }
      const text = await file.text();
      pendingAttachments.push({ filename: file.name, text });
    }
    renderAttachments();
  }

  // ── Direct ticket creation via the "+" button (no bot escalation) ──

  function renderDirectTicketForm() {
    emptyEl.hidden = true;
    const memo = document.createElement("article");
    memo.className = "memo";
    memo.dataset.state = "draft";
    memo.innerHTML = `
      <div class="memo-head">
        <span class="memo-kicker">New ticket for your advisor</span>
        <span class="memo-stamp">Not sent</span>
      </div>
      <label class="field">
        <span class="field-label">Subject</span>
        <input class="memo-subject" type="text" placeholder="What's this about?" />
      </label>
      <label class="field">
        <span class="field-label">Message</span>
        <textarea class="memo-body" rows="5" placeholder="Describe what you need help with…"></textarea>
      </label>
      <div class="memo-actions">
        <button class="btn-ghost memo-discard">Discard</button>
        <button class="btn-primary memo-send">Send to advisor</button>
      </div>
      <p class="memo-receipt" hidden></p>
    `;
    const q = (sel) => memo.querySelector(sel);
    const bodyEl = q(".memo-body");
    messagesEl.appendChild(memo);
    scrollToEnd();
    bodyEl.focus();

    q(".memo-discard").addEventListener("click", () => memo.remove());

    q(".memo-send").addEventListener("click", async () => {
      const subject = q(".memo-subject").value.trim();
      const body = bodyEl.value.trim();
      const errEl = q(".memo-receipt");
      if (!body) {
        errEl.hidden = false;
        errEl.textContent = "Add a message before sending.";
        return;
      }
      const sendEl = q(".memo-send");
      sendEl.disabled = true;
      sendEl.textContent = "Sending…";
      errEl.hidden = true;
      try {
        const res = await fetch(`${VIZOR_API_BASE}/tickets`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: "Student opened this ticket directly.",
            summary: subject || "Student-initiated ticket",
            category: "student-initiated",
            draft_subject: subject || "Question for my advisor",
            draft_body: body,
            conversation_id: conversationId,
          }),
        });
        if (!res.ok) throw new Error("Couldn't send that — try again in a moment.");
        const ticket = await res.json();
        memo.dataset.state = "sent";
        q(".memo-kicker").textContent = "Sent to your advisor";
        q(".memo-stamp").textContent = "Sent";
        q(".memo-subject").readOnly = true;
        bodyEl.readOnly = true;
        q(".memo-actions").remove();
        errEl.hidden = false;
        errEl.textContent =
          `Ticket ${String(ticket.id).slice(0, 8)} · opened ` +
          `${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}` +
          `${ticket.advisor_name ? ` · assigned to ${ticket.advisor_name}` : ""}`;
        scrollToEnd();
      } catch (e) {
        sendEl.disabled = false;
        sendEl.textContent = "Send to advisor";
        errEl.hidden = false;
        errEl.textContent = e.message || "Something went wrong.";
      }
    });
  }

  // ── Wiring ────────────────────────────────────────────────────────

  const startersEl = $(".starters");
  STARTERS.forEach((text, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "starter";
    btn.innerHTML = `<span class="num">${String(i + 1).padStart(2, "0")}</span>`;
    btn.appendChild(document.createTextNode(text));
    btn.addEventListener("click", () => sendMessage(text));
    li.appendChild(btn);
    startersEl.appendChild(li);
  });

  bubble.addEventListener("click", () => setWidgetState("open"));
  $("#minimize").addEventListener("click", () => setWidgetState("minimized"));
  $("#close").addEventListener("click", () => setWidgetState("closed"));
  logoutBtn.addEventListener("click", logout);

  $("#login-btn").addEventListener("click", () => {
    login($("#email").value.trim(), $("#password").value);
  });
  $("#password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#login-btn").click();
  });

  newTicketBtn.addEventListener("click", () => {
    if (!token) return;
    renderDirectTicketForm();
  });
  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length) handleFileSelection(e.target.files);
    fileInput.value = "";
  });

  sendBtn.addEventListener("click", () => sendMessage(inputEl.value));
  inputEl.addEventListener("input", () => autosize(inputEl, 108));
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputEl.value);
    }
  });
  panel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setWidgetState("minimized");
  });

  // Restore session and widget open/minimized/closed state on load.
  chrome.storage.local.get([STORAGE_KEY, STATE_KEY], (result) => {
    if (result[STORAGE_KEY]) {
      token = result[STORAGE_KEY];
      showChat();
    }
    setWidgetState(result[STATE_KEY] || "minimized");
  });
})();
