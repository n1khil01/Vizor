"""Ticket creation and lookup (docs/PROJECT_PLAN.md §4.2, §4.5, §8).

A ticket only exists once the student confirms the draft the chat tool
loop produced — `escalate_to_advisor` (app/tickets/tools.py) never writes
here. Auto-assignment is just reading `students.advisor_id`; there's no
routing logic to get wrong.
"""

from app.db.client import get_supabase


class NoAdvisorAssigned(Exception):
    pass


class TicketNotFound(Exception):
    pass


def _student_advisor(student_id: str) -> tuple[str, str | None]:
    """Returns (advisor_id, advisor_name). The name is only for display — the
    widget's "sent to Dr. Chen" receipt — so a missing one isn't fatal."""
    sb = get_supabase()
    result = (
        sb.table("students")
        .select("advisor_id, profiles!students_advisor_id_fkey(full_name)")
        .eq("profile_id", student_id)
        .single()
        .execute()
    )
    row = result.data or {}
    advisor_id = row.get("advisor_id")
    if not advisor_id:
        raise NoAdvisorAssigned(f"Student {student_id} has no advisor on file")
    return advisor_id, (row.get("profiles") or {}).get("full_name")


def create_ticket(
    student_id: str,
    reason: str,
    summary: str,
    draft_subject: str,
    draft_body: str,
    category: str | None = None,
    conversation_id: str | None = None,
) -> dict:
    """Creates the ticket plus its first (student-authored) message, assigned
    to the student's own advisor. `draft_subject`/`draft_body` are whatever
    the student ended up sending — the model's draft, edited or not."""
    sb = get_supabase()
    advisor_id, advisor_name = _student_advisor(student_id)

    ticket = (
        sb.table("tickets")
        .insert(
            {
                "student_id": student_id,
                "advisor_id": advisor_id,
                "conversation_id": conversation_id,
                "status": "open",
                "escalation_reason": reason,
                "ai_summary": summary,
                "category": category,
            }
        )
        .execute()
    )
    ticket_row = ticket.data[0]

    sb.table("ticket_messages").insert(
        {
            "ticket_id": ticket_row["id"],
            "sender": "student",
            "subject": draft_subject,
            "body": draft_body,
        }
    ).execute()

    return {**ticket_row, "advisor_name": advisor_name}


def list_open_tickets(student_id: str) -> list[dict]:
    sb = get_supabase()
    result = (
        sb.table("tickets")
        .select("id, status, category, escalation_reason, created_at")
        .eq("student_id", student_id)
        .eq("status", "open")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


def get_ticket(student_id: str, ticket_id: str) -> dict:
    sb = get_supabase()
    ticket = (
        sb.table("tickets")
        .select("id, status, resolution, category, escalation_reason, ai_summary, created_at, resolved_at")
        .eq("id", ticket_id)
        .eq("student_id", student_id)
        .maybe_single()
        .execute()
    )
    if not ticket or not ticket.data:
        raise TicketNotFound(f"No ticket {ticket_id} for student {student_id}")

    messages = (
        sb.table("ticket_messages")
        .select("id, sender, subject, body, read_at, created_at")
        .eq("ticket_id", ticket_id)
        .order("created_at")
        .execute()
    )
    mark_advisor_messages_read(ticket_id)
    return {**ticket.data, "messages": messages.data or []}


def mark_advisor_messages_read(ticket_id: str) -> None:
    """Called whenever the student actually views a ticket — via the widget's
    ticket list/detail or the `get_ticket` chat tool (docs/PROJECT_PLAN.md
    §4.4). Advisor replies are what §4.4's unread card cares about; the
    student's own messages are never "unread" from their perspective."""
    sb = get_supabase()
    sb.table("ticket_messages").update({"read_at": "now()"}).eq("ticket_id", ticket_id).eq(
        "sender", "advisor"
    ).is_("read_at", "null").execute()


def resolve_ticket_as_student(student_id: str, ticket_id: str) -> dict:
    """Soft resolve (docs/PROJECT_PLAN.md §4.5): hidden from the advisor
    queue and out of default bot context, but recoverable — unlike an
    advisor's hard resolve, this never deletes the ticket from existence."""
    sb = get_supabase()
    existing = (
        sb.table("tickets")
        .select("id, status")
        .eq("id", ticket_id)
        .eq("student_id", student_id)
        .maybe_single()
        .execute()
    )
    if not existing or not existing.data:
        raise TicketNotFound(f"No ticket {ticket_id} for student {student_id}")

    updated = (
        sb.table("tickets")
        .update(
            {
                "status": "resolved",
                "resolution": "soft",
                "resolved_by": student_id,
                "resolved_at": "now()",
            }
        )
        .eq("id", ticket_id)
        .execute()
    )
    return updated.data[0]


def list_unread_advisor_replies(student_id: str) -> list[dict]:
    """Powers the widget's proactive "Reply from your advisor" card and icon
    badge (§4.4) — the one case where ticket content is surfaced without the
    student asking, because otherwise a reply could go unnoticed for a
    session or more."""
    sb = get_supabase()
    result = (
        sb.table("ticket_messages")
        .select("id, ticket_id, subject, body, created_at, tickets!inner(student_id)")
        .eq("sender", "advisor")
        .is_("read_at", "null")
        .eq("tickets.student_id", student_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [{k: v for k, v in row.items() if k != "tickets"} for row in (result.data or [])]
