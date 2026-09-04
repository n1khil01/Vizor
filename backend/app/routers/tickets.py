"""Ticket endpoints, student side (docs/PROJECT_PLAN.md §4.2, §8, §10 phase 6).

Advisor-side endpoints (§8's `/advisor/...` routes) belong to the web app
work a teammate owns — not built here.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth import CurrentUser, require_student
from app.tickets import service

router = APIRouter(prefix="/tickets", tags=["tickets"])


class SendTicketRequest(BaseModel):
    reason: str
    summary: str
    draft_subject: str
    draft_body: str
    category: str | None = None
    conversation_id: str | None = None


@router.get("")
def list_open_tickets(user: CurrentUser = Depends(require_student)) -> list[dict]:
    return service.list_open_tickets(user.profile_id)


@router.get("/{ticket_id}")
def get_ticket(ticket_id: str, user: CurrentUser = Depends(require_student)) -> dict:
    try:
        return service.get_ticket(user.profile_id, ticket_id)
    except service.TicketNotFound as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("", status_code=status.HTTP_201_CREATED)
def send_ticket(body: SendTicketRequest, user: CurrentUser = Depends(require_student)) -> dict:
    """Creates the ticket from the (possibly student-edited) escalation
    draft. Nothing is written until this is called — see app/tickets/tools.py."""
    try:
        return service.create_ticket(
            student_id=user.profile_id,
            reason=body.reason,
            summary=body.summary,
            draft_subject=body.draft_subject,
            draft_body=body.draft_body,
            category=body.category,
            conversation_id=body.conversation_id,
        )
    except service.NoAdvisorAssigned as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/{ticket_id}/resolve")
def resolve_ticket(ticket_id: str, user: CurrentUser = Depends(require_student)) -> dict:
    """Student-side resolve — always soft (§4.5). The advisor's hard resolve
    lives entirely in the web app, which talks to Supabase directly."""
    try:
        return service.resolve_ticket_as_student(user.profile_id, ticket_id)
    except service.TicketNotFound as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
