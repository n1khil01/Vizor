"""POST /chat (docs/PROJECT_PLAN.md §4.1, §8, §10 phase 4).

Loads the student's record into the system prompt, runs the tool loop over
the turns the client hands back with this request, and streams the
assistant's final answer back as SSE.

Each visit is an independent session: the client is the only place this
turn's history lives (see extension/content.js), nothing here reads or
writes a persisted transcript, and a `conversation_id` is never reused
across a fresh page load. `conversations` rows still exist purely as an
opaque handle tickets can point to for routing — they hold no message
content.
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
from app.kb.tools import NAME as KB_TOOL_NAME
from app.llm.escalation_intent import wants_advisor_escalation
from app.llm.kb_intent import wants_policy_lookup
from app.llm.tool_loop import run_tool_loop, stream_words
from app.tickets.tools import NAME as ESCALATE_TOOL_NAME
from app.config import get_settings

router = APIRouter(tags=["chat"])


class HistoryTurn(BaseModel):
    role: str
    content: str


class Attachment(BaseModel):
    filename: str
    text: str


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None
    # Held by the extension for the life of this session only — never read
    # back from any server-side store, so a new visit starts with `[]`.
    history: list[HistoryTurn] = []
    attachments: list[Attachment] = []


def _load_student(user: CurrentUser) -> dict:
    sb = get_supabase()
    result = (
        sb.table("students")
        .select(
            "profile_id, class_year, major, advisor_id, "
            "profiles!students_advisor_id_fkey(full_name, email)"
        )
        .eq("profile_id", user.profile_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No student record on file")
    return result.data


def _load_catalog_year(student_id: str) -> str | None:
    sb = get_supabase()
    result = (
        sb.table("dars_reports")
        .select("catalog_year")
        .eq("student_id", student_id)
        .order("prepared_on", desc=True)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    return rows[0]["catalog_year"] if rows else None


def _get_or_create_conversation(student_id: str, conversation_id: str | None) -> str:
    """Just an id for tickets to point at — created fresh every session
    (the extension never persists `conversation_id` across a reload), and
    never used to look up message history."""
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


def _attachments_context(attachments: list[Attachment]) -> str | None:
    if not attachments:
        return None
    parts = [
        f"--- {a.filename} ---\n{a.text.strip()[:8000]}" for a in attachments if a.text.strip()
    ]
    if not parts:
        return None
    return (
        "The student attached the following file(s) this session to supplement "
        "their question. Use them as additional context; they are not stored "
        "anywhere and won't be available in a future session.\n\n" + "\n\n".join(parts)
    )


@router.post("/chat")
def chat(body: ChatRequest, user: CurrentUser = Depends(require_student)) -> StreamingResponse:
    student = _load_student(user)
    advisor_profile = student.get("profiles") or {}
    advisor_name = advisor_profile.get("full_name")
    advisor_email = advisor_profile.get("email")
    catalog_year = _load_catalog_year(student["profile_id"])

    conversation_id = _get_or_create_conversation(student["profile_id"], body.conversation_id)

    system_prompt = build_system_prompt(
        full_name=user.full_name,
        major=student.get("major"),
        class_year=student.get("class_year"),
        catalog_year=catalog_year,
        advisor_name=advisor_name,
        advisor_email=advisor_email,
    )

    attachments_note = _attachments_context(body.attachments)
    if attachments_note:
        system_prompt = f"{system_prompt}\n\n{attachments_note}"

    # `body.history` is exactly what this session has said so far and
    # nothing else — the client, not this endpoint, is the only place it's
    # held, so a fresh visit always starts from an empty list.
    history = [{"role": t.role, "content": t.content} for t in body.history]
    messages = [{"role": "system", "content": system_prompt}, *history, {"role": "user", "content": body.message}]
    turn_start = len(messages) - 1  # everything from the new user message onward is new

    settings = get_settings()
    client = get_llm_client()
    # Advisor intent wins if both match ("email my advisor about withdrawing") —
    # reaching a person is the stronger ask. See app/llm/*_intent.py.
    forced_tool = (
        ESCALATE_TOOL_NAME
        if wants_advisor_escalation(body.message)
        else KB_TOOL_NAME
        if wants_policy_lookup(body.message)
        else None
    )
    run_tool_loop(client, settings.asu_chat_model, student["profile_id"], messages, forced_tool)

    new_turns = messages[turn_start:]

    # No transcript write here, deliberately: session history is never
    # persisted to the database (product requirement — see extension's "new
    # independent session" contract). Only `last_message_at` is touched, and
    # only to keep the conversation row (routing handle for tickets) from
    # looking stale.
    get_supabase().table("conversations").update({"last_message_at": "now()"}).eq(
        "id", conversation_id
    ).execute()

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
