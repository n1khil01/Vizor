// Shadow-DOM styles for the Vizor widget. Kept as a JS string (rather than a
// linked stylesheet) so it can be injected directly into the shadow root
// without an extra network/host-permission round trip.
const CSS_TEXT = `
:host { all: initial; }
* { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

#bubble {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #8C1D40;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0,0,0,0.25);
  z-index: 2147483647;
}
#bubble.minimized { opacity: 0.85; }
#bubble[hidden] { display: none; }

#panel {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 340px;
  height: 480px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 2147483647;
}
#panel[hidden] { display: none; }

#header {
  background: #8C1D40;
  color: #fff;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
#title { font-weight: 600; font-size: 15px; }
#controls button {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  padding: 2px 8px;
  line-height: 1;
}
#controls button:hover { opacity: 0.75; }
#logout {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
}
#logout[hidden] { display: none; }

#login-view {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hint { font-size: 13px; color: #444; margin: 0 0 4px; }
#login-view input {
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
}
#login-btn {
  background: #8C1D40;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 9px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
#login-btn:hover { background: #6e1732; }
.error { color: #c0392b; font-size: 12px; margin: 0; }
#login-view[hidden] { display: none; }

#chat-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
#chat-view[hidden] { display: none; }
#messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.msg {
  max-width: 85%;
  padding: 8px 11px;
  border-radius: 10px;
  font-size: 13.5px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
}
.msg.user {
  align-self: flex-end;
  background: #8C1D40;
  color: #fff;
}
.msg.assistant {
  align-self: flex-start;
  background: #f0f0f0;
  color: #222;
}
.msg.assistant.pending::after {
  content: "...";
  opacity: 0.5;
}
.msg.assistant.error {
  background: #fdecea;
  color: #c0392b;
}

#composer {
  display: flex;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid #e5e5e5;
}
#input {
  flex: 1;
  resize: none;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13.5px;
  max-height: 80px;
}
#send {
  background: #8C1D40;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0 14px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
}
#send:hover { background: #6e1732; }
`;
