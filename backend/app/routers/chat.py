"""POST /chat (docs/PROJECT_PLAN.md §4.1, §8, §10 phase 4).

Loads the student's record into the system prompt, replays the
conversation's history, runs the tool loop, persists every turn, and
streams the assistant's final answer back as SSE.
"""

import json
from collections.abc import Iterator

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.auth import CurrentUser, require_student
from app.db.client import get_supabase
from app.llm.client import get_llm_client
from app.llm.prompts import build_system_prompt
from app.llm.tool_loop import run_tool_loop, stream_words
from app.tickets.tools import NAME as ESCALATE_TOOL_NAME
from app.config import get_settings

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


def _load_student(user: CurrentUser) -> dict:
    sb = get_supabase()
    result = (
        sb.table("students")
        .select("profile_id, class_year, major, advisor_id, profiles!students_advisor_id_fkey(full_name)")
        .eq("profile_id", user.profile_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No student record on file")
    return result.data


def _get_or_create_conversation(student_id: str, conversation_id: str | None) -> str:
    sb = get_supabase()
    if conversation_id:
        existing = (
            sb.table("conversations")
            .select("id")
            .eq("id", conversation_id)
            .eq("student_id", student_id)
            .maybe_single()
            .execute()
        )
        if existing and existing.data:
            return existing.data["id"]
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    created = sb.table("conversations").insert({"student_id": student_id}).execute()
    return created.data[0]["id"]


def _load_history(conversation_id: str) -> list[dict]:
    sb = get_supabase()
    result = (
        sb.table("messages")
        .select("role, content, tool_calls")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
    )
    history = []
    for row in result.data or []:
        entry: dict = {"role": row["role"], "content": row["content"]}
        if row["role"] == "tool" and row.get("tool_calls"):
            entry["tool_call_id"] = row["tool_calls"]["tool_call_id"]
        elif row.get("tool_calls"):
            entry["tool_calls"] = row["tool_calls"]
        history.append(entry)
    return history


def _persist_new_turns(conversation_id: str, new_messages: list[dict]) -> None:
    sb = get_supabase()
    rows = []
    for msg in new_messages:
        if msg["role"] == "tool":
            rows.append(
                {
                    "conversation_id": conversation_id,
                    "role": "tool",
                    "content": msg["content"],
                    "tool_calls": {"tool_call_id": msg["tool_call_id"]},
                }
            )
        else:
            row = {
                "conversation_id": conversation_id,
                "role": msg["role"],
                "content": msg.get("content"),
            }
            if msg.get("tool_calls"):
                row["tool_calls"] = msg["tool_calls"]
            rows.append(row)
    if rows:
        sb.table("messages").insert(rows).execute()
    sb.table("conversations").update({"last_message_at": "now()"}).eq("id", conversation_id).execute()


def _find_escalation_draft(new_turns: list[dict]) -> dict | None:
    """If the model called escalate_to_advisor this turn, pull out the draft
    it produced (already echoed back verbatim in the tool result — see
    app/tickets/tools.py) so the router can surface it to the widget as a
    distinct SSE event, editable before the student sends it."""
    for msg in new_turns:
        if msg.get("role") != "assistant" or not msg.get("tool_calls"):
            continue
        for call in msg["tool_calls"]:
            if call["function"]["name"] != ESCALATE_TOOL_NAME:
                continue
            call_id = call["id"]
            result = next(
                (m for m in new_turns if m.get("role") == "tool" and m.get("tool_call_id") == call_id),
                None,
            )
            if result is not None:
                return json.loads(result["content"])
    return None


@router.post("/chat")
def chat(body: ChatRequest, user: CurrentUser = Depends(require_student)) -> StreamingResponse:
    student = _load_student(user)
    advisor_name = (student.get("profiles") or {}).get("full_name")

    conversation_id = _get_or_create_conversation(student["profile_id"], body.conversation_id)
    history = _load_history(conversation_id)

    system_prompt = build_system_prompt(
        full_name=user.full_name,
        major=student.get("major"),
        class_year=student.get("class_year"),
        advisor_name=advisor_name,
    )

    messages = [{"role": "system", "content": system_prompt}, *history, {"role": "user", "content": body.message}]
    turn_start = len(messages) - 1  # everything from the new user message onward is new

    settings = get_settings()
    client = get_llm_client()
    run_tool_loop(client, settings.asu_chat_model, student["profile_id"], messages)

    new_turns = messages[turn_start:]
    _persist_new_turns(conversation_id, new_turns)

    final_answer = new_turns[-1]["content"] or ""
    escalation = _find_escalation_draft(new_turns)

    def sse() -> Iterator[str]:
        yield f"event: conversation\ndata: {json.dumps({'conversation_id': conversation_id})}\n\n"
        if escalation is not None:
            payload = {**escalation, "advisor_name": advisor_name}
            yield f"event: escalation\ndata: {json.dumps(payload)}\n\n"
        for chunk in stream_words(final_answer):
            yield f"data: {json.dumps({'delta': chunk})}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(sse(), media_type="text/event-stream")
