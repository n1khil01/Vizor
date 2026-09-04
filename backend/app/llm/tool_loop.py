"""The chat tool loop (docs/PROJECT_PLAN.md §4.1, §10 phase 4).

Runs completions against the ASU gateway, dispatching DARS and KB tool
calls until the model answers with plain content. Tool-call rounds are not
streamed — function-call arguments arrive as a single JSON blob, so there's
nothing useful to stream until the model's final turn.
"""

import json
from collections.abc import Iterator

from app.dars.tools import TOOL_DEFS as DARS_TOOL_DEFS
from app.dars.tools import call_dars_tool
from app.kb.tools import TOOL_DEFS as KB_TOOL_DEFS
from app.kb.tools import call_kb_tool
from app.tickets.tools import TOOL_DEFS as TICKET_TOOL_DEFS
from app.tickets.tools import call_ticket_tool

TOOL_DEFS = DARS_TOOL_DEFS + KB_TOOL_DEFS + TICKET_TOOL_DEFS
_DARS_TOOL_NAMES = {t["function"]["name"] for t in DARS_TOOL_DEFS}
_TICKET_TOOL_NAMES = {t["function"]["name"] for t in TICKET_TOOL_DEFS}

MAX_TOOL_ROUNDS = 6


def _dispatch(name: str, student_id: str, arguments: dict) -> dict | list:
    if name in _DARS_TOOL_NAMES:
        return call_dars_tool(name, student_id, arguments)
    if name in _TICKET_TOOL_NAMES:
        return call_ticket_tool(name, arguments)
    return call_kb_tool(name, arguments)


def _append_tool_call_round(messages: list[dict], message, tool_calls) -> None:
    messages.append(
        {
            "role": "assistant",
            "content": message.content,
            "tool_calls": [
                {
                    "id": call.id,
                    "type": "function",
                    "function": {"name": call.function.name, "arguments": call.function.arguments},
                }
                for call in tool_calls
            ],
        }
    )


def _force_tool_call(client, model: str, student_id: str, messages: list[dict], tool_name: str) -> None:
    """Issues one completion with `tool_choice` pinned to `tool_name` and
    appends its assistant/tool turn. Used when the student's message clearly
    calls for a specific tool (see app/llm/escalation_intent.py and
    app/llm/kb_intent.py) but the model, left to its own judgment, tried to
    answer from memory or keep the conversation going instead — verified
    against the real ASU gateway to happen for both escalation and KB
    lookups (docs/PROJECT_PLAN.md §11)."""
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        tools=TOOL_DEFS,
        tool_choice={"type": "function", "function": {"name": tool_name}},
    )
    message = response.choices[0].message
    call = message.tool_calls[0]
    _append_tool_call_round(messages, message, [call])
    try:
        arguments = json.loads(call.function.arguments or "{}")
        result = _dispatch(call.function.name, student_id, arguments)
    except Exception as exc:
        result = {"error": str(exc)}
    messages.append({"role": "tool", "tool_call_id": call.id, "content": json.dumps(result, default=str)})


def run_tool_loop(
    client, model: str, student_id: str, messages: list[dict], forced_tool: str | None = None
) -> list[dict]:
    """Mutates and returns `messages` with every assistant/tool turn appended.
    The final entry is always an assistant message with no further tool_calls.

    `forced_tool` names a tool the student's message clearly calls for
    (escalate_to_advisor or search_policy_kb — see the *_intent modules). If
    the model hasn't called it by the time it would otherwise finish or run
    out of rounds, one round is forced via `tool_choice` rather than left to
    the model's judgment."""
    forced_tool_used = False

    for _ in range(MAX_TOOL_ROUNDS):
        response = client.chat.completions.create(
            model=model, messages=messages, tools=TOOL_DEFS, tool_choice="auto"
        )
        message = response.choices[0].message
        tool_calls = message.tool_calls or []

        if not tool_calls:
            if forced_tool and not forced_tool_used:
                _force_tool_call(client, model, student_id, messages, forced_tool)
                forced_tool_used = True
                continue
            messages.append({"role": "assistant", "content": message.content or ""})
            return messages

        _append_tool_call_round(messages, message, tool_calls)

        for call in tool_calls:
            if call.function.name == forced_tool:
                forced_tool_used = True
            try:
                arguments = json.loads(call.function.arguments or "{}")
                result = _dispatch(call.function.name, student_id, arguments)
            except Exception as exc:
                result = {"error": str(exc)}
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": call.id,
                    "content": json.dumps(result, default=str),
                }
            )

    if forced_tool and not forced_tool_used:
        _force_tool_call(client, model, student_id, messages, forced_tool)
        try:
            response = client.chat.completions.create(
                model=model, messages=messages, tools=TOOL_DEFS, tool_choice="auto"
            )
            messages.append({"role": "assistant", "content": response.choices[0].message.content or ""})
            return messages
        except Exception:
            pass

    messages.append(
        {
            "role": "assistant",
            "content": (
                "I wasn't able to finish looking that up. Please try rephrasing, "
                "or escalate to your advisor."
            ),
        }
    )
    return messages


def stream_words(text: str, chunk_words: int = 6) -> Iterator[str]:
    """Fakes token streaming over an already-complete string, so the chat
    endpoint can respond as an SSE stream even though tool-call rounds
    happen synchronously up front."""
    words = text.split(" ")
    for i in range(0, len(words), chunk_words):
        chunk = " ".join(words[i : i + chunk_words])
        if i + chunk_words < len(words):
            chunk += " "
        yield chunk
