// Vizor widget: injected once per ASU page. Shadow DOM isolates our styles
// from the host page's; nothing here touches the surrounding page.
(function () {
  if (document.getElementById("vizor-host")) return;

  const STORAGE_KEY = "vizor_token";
  const STATE_KEY = "vizor_widget_state"; // "open" | "minimized" | "closed"

  const host = document.createElement("div");
  host.id = "vizor-host";
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: "open" });

  root.innerHTML = `
    <style>${CSS_TEXT}</style>
    <div id="bubble" title="Open Vizor">V</div>
    <div id="panel" hidden>
      <div id="header">
        <span id="title">Vizor</span>
        <div id="controls">
          <button id="logout" title="Log out" hidden>Log out</button>
          <button id="minimize" title="Minimize">−</button>
          <button id="close" title="Close">×</button>
        </div>
      </div>
      <div id="login-view">
        <p class="hint">Log in to chat with Vizor.</p>
        <input id="email" type="email" placeholder="ASU email" autocomplete="username" />
        <input id="password" type="password" placeholder="Password" autocomplete="current-password" />
        <button id="login-btn">Log in</button>
        <p id="login-error" class="error" hidden></p>
      </div>
      <div id="chat-view" hidden>
        <div id="messages"></div>
        <div id="composer">
          <textarea id="input" placeholder="Ask Vizor anything..." rows="1"></textarea>
          <button id="send">Send</button>
        </div>
      </div>
    </div>
  `;

  const $ = (sel) => root.querySelector(sel);
  const bubble = $("#bubble");
  const panel = $("#panel");
  const loginView = $("#login-view");
  const chatView = $("#chat-view");
  const messagesEl = $("#messages");
  const inputEl = $("#input");
  const logoutBtn = $("#logout");

  let token = null;
  let conversationId = null;

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

  function showChat() {
    loginView.hidden = true;
    chatView.hidden = false;
    logoutBtn.hidden = false;
    inputEl.focus();
  }

  async function logout() {
    await chrome.storage.local.remove(STORAGE_KEY);
    token = null;
    conversationId = null;
    messagesEl.innerHTML = "";
    logoutBtn.hidden = true;
    chatView.hidden = true;
    loginView.hidden = false;
  }

  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  async function login(email, password) {
    const errEl = $("#login-error");
    errEl.hidden = true;
    try {
      const res = await fetch(`${VIZOR_API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Invalid email or password");
      const data = await res.json();
      token = data.access_token;
      await chrome.storage.local.set({ [STORAGE_KEY]: token });
      showChat();
    } catch (e) {
      errEl.textContent = e.message || "Login failed";
      errEl.hidden = false;
    }
  }

  async function sendMessage(text) {
    if (!text.trim() || !token) return;
    addMessage("user", text);
    inputEl.value = "";
    const assistantEl = addMessage("assistant", "");
    assistantEl.classList.add("pending");

    try {
      const res = await fetch(`${VIZOR_API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text, conversation_id: conversationId }),
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
          } else if (payload.delta) {
            assistantEl.textContent += payload.delta;
            messagesEl.scrollTop = messagesEl.scrollHeight;
          }
        }
      }
    } catch (e) {
      assistantEl.classList.remove("pending");
      assistantEl.textContent = e.message || "Something went wrong.";
      assistantEl.classList.add("error");
    }
  }

  bubble.addEventListener("click", () => setWidgetState("open"));
  $("#minimize").addEventListener("click", () => setWidgetState("minimized"));
  logoutBtn.addEventListener("click", logout);
  $("#close").addEventListener("click", () => setWidgetState("closed"));

  $("#login-btn").addEventListener("click", () => {
    login($("#email").value.trim(), $("#password").value);
  });
  $("#password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#login-btn").click();
  });

  $("#send").addEventListener("click", () => sendMessage(inputEl.value));
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputEl.value);
    }
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
