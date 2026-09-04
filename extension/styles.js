// Shadow-DOM styles for the Vizor widget. Kept as a JS string (rather than a
// linked stylesheet) so it can be injected directly into the shadow root
// without an extra network/host-permission round trip.
//
// Design direction: "editorial dossier" — the widget reads as a document being
// drafted at an advising desk, not a chat app. Near-square geometry, one warm
// bone neutral family, ASU maroon as the dominant and ASU gold used only
// structurally (rules, stamps, cursor, focus). Vizor's replies are set as
// transcript text with a gold hairline rather than as bubbles; the escalation
// draft is a carbon-copy memo. Type is a serif/mono/sans trio chosen from
// widely-installed faces — a content script can't reliably pull webfonts past
// a host page's CSP, so character comes from the stack itself.
const CSS_TEXT = `
:host { all: initial; }

* { box-sizing: border-box; }

#root {
  /* Palette: 1 dominant, 1 accent, one warm neutral family. */
  --maroon: #8C1D40;
  --maroon-deep: #5E1029;
  --maroon-wash: #F3E6EA;
  --gold: #FFC627;
  --ink: #17120F;
  --ink-soft: #6B615A;
  --paper: #FAF7F2;
  --paper-sunk: #F2ECE2;
  --rule: #DCD2C4;
  --alert: #A32C1E;

  --serif: "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif;
  --mono: ui-monospace, "SF Mono", "JetBrains Mono", "IBM Plex Mono", Menlo, Consolas, monospace;
  --sans: "Helvetica Neue", Helvetica, "Segoe UI", Arial, sans-serif;

  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);

  font-family: var(--sans);
  color: var(--ink);
}

/* ── Launcher ───────────────────────────────────────────────────────
   A tile, not a circle: squared geometry with a gold rule that grows
   on hover, so the affordance is felt rather than decorated. */
#bubble {
  position: fixed;
  bottom: 22px;
  right: 22px;
  width: 54px;
  height: 54px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: var(--maroon);
  color: #fff;
  font-family: var(--serif);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(23,18,15,0.18), 0 12px 28px rgba(23,18,15,0.22);
  transition: transform 160ms var(--ease), box-shadow 160ms var(--ease);
  z-index: 2147483647;
}
#bubble::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: var(--gold);
  transform: scaleX(0.42);
  transform-origin: left;
  transition: transform 220ms var(--ease);
}
#bubble:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(23,18,15,0.2), 0 16px 34px rgba(23,18,15,0.26); }
#bubble:hover::before { transform: scaleX(1); }
#bubble:active { transform: translateY(0); }
#bubble.minimized { opacity: 0.92; }
#bubble[hidden] { display: none; }

/* Unread advisor reply (phase 8 hook). */
#bubble .dot {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 0 2px var(--maroon);
}
#bubble .dot[hidden] { display: none; }

/* ── Panel ──────────────────────────────────────────────────────── */
#panel {
  position: fixed;
  bottom: 22px;
  right: 22px;
  width: 384px;
  height: 588px;
  max-height: calc(100vh - 44px);
  background: var(--paper);
  border-radius: 3px;
  border-top: 3px solid var(--gold);
  box-shadow: 0 2px 6px rgba(23,18,15,0.14), 0 24px 60px rgba(23,18,15,0.28);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 2147483647;
  animation: rise 200ms var(--ease);
}
#panel[hidden] { display: none; }
@keyframes rise {
  from { opacity: 0; transform: translateY(10px) scale(0.99); }
  to { opacity: 1; transform: none; }
}

/* ── Header: asymmetric — wordmark + kicker left, controls right ── */
#header {
  background: var(--maroon);
  color: #fff;
  padding: 11px 8px 11px 15px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;
}
#wordmark { display: block; font-family: var(--serif); font-size: 19px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.1; }
#kicker {
  display: block;
  margin-top: 3px;
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gold);
}
#controls { display: flex; align-items: center; gap: 2px; }
#controls button {
  background: transparent;
  border: none;
  border-radius: 2px;
  color: #fff;
  font-family: var(--mono);
  cursor: pointer;
  padding: 5px 7px;
  line-height: 1;
  transition: background 140ms var(--ease), color 140ms var(--ease);
}
#controls button:hover { background: rgba(255,255,255,0.14); }
#minimize, #close { font-size: 15px; }
#close:hover { background: var(--gold); color: var(--maroon-deep); }
#logout { font-size: 9px; letter-spacing: 0.11em; text-transform: uppercase; padding: 6px 8px; }
#logout[hidden] { display: none; }

/* ── Login: left-aligned editorial, underline fields ───────────── */
#login-view { flex: 1; min-height: 0; padding: 26px 20px 20px; display: flex; flex-direction: column; }
#login-view[hidden] { display: none; }
/* States the consent model where it matters — before sign-in, not buried. */
#login-foot {
  margin: auto 0 0;
  padding-top: 13px;
  border-top: 1px solid var(--rule);
  font-family: var(--mono);
  font-size: 9.5px;
  line-height: 1.75;
  letter-spacing: 0.04em;
  color: var(--ink-soft);
}
.eyebrow {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--maroon);
  margin: 0 0 8px;
}
.display {
  font-family: var(--serif);
  font-size: 25px;
  line-height: 1.15;
  letter-spacing: -0.015em;
  margin: 0 0 6px;
  max-width: 15ch;
}
.sub { font-size: 13px; line-height: 1.5; color: var(--ink-soft); margin: 0 0 22px; max-width: 34ch; }

.field { display: block; margin-bottom: 16px; }
.field-label {
  display: block;
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-bottom: 5px;
}
.field input {
  width: 100%;
  border: none;
  border-bottom: 1px solid var(--rule);
  border-radius: 0;
  background: transparent;
  padding: 6px 1px;
  font-family: var(--sans);
  font-size: 14px;
  color: var(--ink);
  transition: border-color 160ms var(--ease);
}
.field input::placeholder { color: #B5AA9C; }
.field input:focus { outline: none; border-bottom-color: var(--maroon); box-shadow: 0 1px 0 0 var(--maroon); }

.btn-primary {
  width: 100%;
  background: var(--maroon);
  color: #fff;
  border: none;
  border-radius: 2px;
  padding: 11px 14px;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 160ms var(--ease), transform 120ms var(--ease);
}
.btn-primary:hover { background: var(--maroon-deep); }
.btn-primary:active { transform: translateY(1px); }
.btn-primary:disabled { opacity: 0.45; cursor: default; transform: none; }

.error {
  color: var(--alert);
  font-family: var(--mono);
  font-size: 11px;
  line-height: 1.5;
  margin: 12px 0 0;
  padding-left: 9px;
  border-left: 2px solid var(--alert);
}
.error[hidden] { display: none; }

/* ── Chat ───────────────────────────────────────────────────────── */
#chat-view { display: flex; flex-direction: column; flex: 1; min-height: 0; }
#chat-view[hidden] { display: none; }

#messages {
  flex: 1;
  overflow-y: auto;
  padding: 18px 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  scrollbar-width: thin;
  scrollbar-color: var(--rule) transparent;
}
#messages::-webkit-scrollbar { width: 8px; }
#messages::-webkit-scrollbar-thumb { background: var(--rule); border-radius: 99px; border: 2px solid var(--paper); }

/* Student: a set block, right-aligned, with one squared corner. */
.msg.user {
  align-self: flex-end;
  max-width: 84%;
  background: var(--maroon-wash);
  border-right: 2px solid var(--maroon);
  border-radius: 3px 3px 0 3px;
  padding: 9px 12px;
  font-size: 13.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* Vizor: transcript text under a gold hairline — not a bubble. */
.msg.assistant {
  align-self: stretch;
  max-width: 100%;
  padding-top: 9px;
  border-top: 1px solid var(--gold);
  font-size: 13.5px;
  line-height: 1.62;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.msg.assistant::before {
  content: "Vizor";
  display: block;
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-bottom: 6px;
}
.msg.assistant.pending::after {
  content: "";
  display: inline-block;
  width: 7px;
  height: 14px;
  margin-left: 1px;
  vertical-align: -2px;
  background: var(--gold);
  animation: blink 1s steps(2, start) infinite;
}
@keyframes blink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }
.msg.assistant.error { border-top-color: var(--alert); color: var(--alert); }
.msg.assistant.error::before { content: "Error"; color: var(--alert); }
.msg.note {
  align-self: stretch;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  padding-left: 9px;
  border-left: 2px solid var(--rule);
}

/* ── Empty state: an editorial index, not a card grid ──────────── */
#empty { padding: 6px 0 4px; }
#empty[hidden] { display: none; }
#empty .display { font-size: 22px; max-width: 18ch; margin-bottom: 4px; }
#empty .sub { margin-bottom: 18px; }
.starters { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--rule); }
.starter {
  display: flex;
  align-items: baseline;
  gap: 11px;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--rule);
  padding: 11px 2px;
  cursor: pointer;
  font-family: var(--serif);
  font-size: 14.5px;
  line-height: 1.35;
  color: var(--ink);
  transition: padding-left 180ms var(--ease), color 180ms var(--ease);
}
.starter .num {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #C0B5A6;
  transition: color 180ms var(--ease);
}
.starter:hover { padding-left: 8px; color: var(--maroon); }
.starter:hover .num { color: var(--gold); }

/* ── Escalation memo: the centerpiece ──────────────────────────── */
.memo {
  align-self: stretch;
  background: #fff;
  border: 1px solid var(--rule);
  border-left: 3px solid var(--maroon);
  border-radius: 0 3px 3px 0;
  padding: 13px 14px 14px;
  box-shadow: 0 1px 2px rgba(23,18,15,0.05), 0 10px 22px rgba(23,18,15,0.07);
  animation: rise 240ms var(--ease);
}
.memo-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 9px;
  margin-bottom: 11px;
  border-bottom: 1px solid var(--rule);
}
.memo-kicker {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.17em;
  text-transform: uppercase;
  color: var(--maroon);
}
.memo-stamp {
  font-family: var(--mono);
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 3px 6px;
  border: 1px solid currentColor;
  border-radius: 2px;
  color: var(--ink-soft);
  transform: rotate(-1.5deg);
}
.memo[data-state="sent"] { border-left-color: var(--gold); }
.memo[data-state="sent"] .memo-stamp { color: var(--maroon); background: var(--gold); border-color: var(--gold); }

.memo-meta { display: grid; grid-template-columns: 34px 1fr; gap: 3px 10px; margin: 0 0 9px; }
.memo-meta dt {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--ink-soft);
  padding-top: 2px;
}
.memo-meta dd { margin: 0; font-size: 12.5px; line-height: 1.4; }

.memo-why {
  background: var(--paper-sunk);
  border-radius: 2px;
  padding: 8px 10px;
  margin: 0 0 11px;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--ink);
}
.memo-why b {
  display: block;
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-bottom: 4px;
}
.memo-body-text {
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--ink);
  white-space: pre-line;
  margin: 0 0 11px;
}

.memo .field { margin-bottom: 10px; }
.memo input, .memo textarea {
  width: 100%;
  border: none;
  border-bottom: 1px solid var(--rule);
  border-radius: 0;
  background: transparent;
  padding: 5px 1px;
  font-family: var(--sans);
  font-size: 13px;
  line-height: 1.55;
  color: var(--ink);
  resize: none;
  transition: border-color 160ms var(--ease);
}
.memo input:focus, .memo textarea:focus { outline: none; border-bottom-color: var(--maroon); box-shadow: 0 1px 0 0 var(--maroon); }
.memo textarea { max-height: 122px; overflow-y: auto; }
.memo[data-state="sent"] input, .memo[data-state="sent"] textarea { color: var(--ink-soft); border-bottom-color: transparent; }

.memo-actions { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
.memo-actions .btn-primary { width: auto; flex: 1; padding: 9px 12px; font-size: 10px; }
.btn-ghost {
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: 2px;
  padding: 9px 12px;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-soft);
  cursor: pointer;
  transition: border-color 160ms var(--ease), color 160ms var(--ease);
}
.btn-ghost:hover { border-color: var(--ink-soft); color: var(--ink); }
.memo-receipt {
  font-family: var(--mono);
  font-size: 10px;
  line-height: 1.6;
  letter-spacing: 0.04em;
  color: var(--ink-soft);
  margin: 13px 0 0;
  padding-top: 11px;
  border-top: 1px solid var(--rule);
}
.memo-receipt[hidden] { display: none; }

/* ── Composer: flush, tight, no floating pill ──────────────────── */
#composer {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 12px 16px 14px;
  border-top: 1px solid var(--rule);
  background: var(--paper);
  flex-shrink: 0;
}
#input {
  flex: 1;
  resize: none;
  border: none;
  border-bottom: 1px solid var(--rule);
  border-radius: 0;
  background: transparent;
  padding: 6px 1px;
  font-family: var(--sans);
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--ink);
  max-height: 108px;
  overflow-y: auto;
  transition: border-color 160ms var(--ease);
}
#input::placeholder { color: #B5AA9C; }
#input:focus { outline: none; border-bottom-color: var(--maroon); box-shadow: 0 1px 0 0 var(--maroon); }
#send {
  background: var(--maroon);
  color: #fff;
  border: none;
  border-radius: 2px;
  padding: 9px 13px;
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 160ms var(--ease), transform 120ms var(--ease);
}
#send:hover { background: var(--maroon-deep); }
#send:active { transform: translateY(1px); }
#send:disabled { opacity: 0.4; cursor: default; transform: none; }

/* ── Focus & motion ─────────────────────────────────────────────── */
:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
#header :focus-visible { outline-color: var(--gold); outline-offset: 1px; }

.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

@media (prefers-reduced-motion: reduce) {
  #panel, .memo { animation: none; }
  * { transition-duration: 1ms !important; }
  .msg.assistant.pending::after { animation: none; }
}
`;
