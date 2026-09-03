"""Phase 1 gate (docs/PROJECT_PLAN.md §10): confirm the ASU gateway supports
OpenAI-style tool calling before the chat tool loop gets built on top of it.

    uv run scripts/verify_tool_calling.py

Passes if the model responds with a `tool_calls` entry invoking `get_weather`
instead of answering in plain text.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import get_settings
from app.llm.client import get_llm_client

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather for a city.",
            "parameters": {
                "type": "object",
                "properties": {"city": {"type": "string"}},
                "required": ["city"],
            },
        },
    }
]


def main() -> None:
    settings = get_settings()
    client = get_llm_client()

    print(f"model: {settings.asu_chat_model}")
    print(f"base_url: {settings.asu_api_base}")

    response = client.chat.completions.create(
        model=settings.asu_chat_model,
        messages=[
            {"role": "user", "content": "What's the weather in Tempe, Arizona right now?"}
        ],
        tools=TOOLS,
        tool_choice="auto",
    )

    message = response.choices[0].message
    tool_calls = message.tool_calls or []

    print(f"\nfinish_reason: {response.choices[0].finish_reason}")
    print(f"content: {message.content!r}")
    print(f"tool_calls: {tool_calls!r}")

    if not tool_calls:
        print(
            "\nFAIL: no tool_calls returned. The gateway may not support "
            "OpenAI-style tool calling for this model — see PROJECT_PLAN.md §10 "
            "fallback (pre-fetch context via an intent classifier instead)."
        )
        raise SystemExit(1)

    call = tool_calls[0]
    if call.function.name != "get_weather":
        print(f"\nFAIL: expected get_weather, model called {call.function.name!r}")
        raise SystemExit(1)

    print("\nPASS: tool calling works on the ASU gateway.")


if __name__ == "__main__":
    main()
