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
from app.tickets.tools import NAME as ESCALATE_TOOL_NAME
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


def run_tool_loop(client, model: str, student_id: str, messages: list[dict]) -> list[dict]:
    """Mutates and returns `messages` with every assistant/tool turn appended.
    The final entry is always an assistant message with no further tool_calls."""
    for _ in range(MAX_TOOL_ROUNDS):
        response = client.chat.completions.create(
            model=model, messages=messages, tools=TOOL_DEFS, tool_choice="auto"
        )
        message = response.choices[0].message
        tool_calls = message.tool_calls or []

        if not tool_calls:
            messages.append({"role": "assistant", "content": message.content or ""})
            return messages

        messages.append(
            {
                "role": "assistant",
                "content": message.content,
                "tool_calls": [
                    {
                        "id": call.id,
                        "type": "function",
                        "function": {
                            "name": call.function.name,
                            "arguments": call.function.arguments,
                        },
                    }
                    for call in tool_calls
                ],
            }
        )

        for call in tool_calls:
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
