from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import create_client

from app.auth import CurrentUser, get_current_user
from app.config import get_settings
from app.db.client import get_supabase
from app.tickets.service import list_unread_advisor_replies

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest) -> LoginResponse:
    settings = get_settings()
    # Auth must go through the anon-key client — the service-role client bypasses
    # password checks entirely, so it can't be used to authenticate a real login.
    anon_client = create_client(settings.supabase_url, settings.supabase_anon_key)

    try:
        result = anon_client.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        ) from exc

    if not result.session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    return LoginResponse(access_token=result.session.access_token)


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)) -> dict:
    """docs/PROJECT_PLAN.md §8: profile + record + unread advisor replies.
    Advisors get profile only — the unread-reply card is a student-side
    concept (§4.4); the web app reads its own dashboard data directly."""
    base = {
        "profile_id": user.profile_id,
        "role": user.role,
        "full_name": user.full_name,
        "email": user.email,
    }
    if user.role != "student":
        return base

    sb = get_supabase()
    student = (
        sb.table("students")
        .select("class_year, major, gpa, advisor_id, profiles!students_advisor_id_fkey(full_name)")
        .eq("profile_id", user.profile_id)
        .maybe_single()
        .execute()
    )
    record = student.data if student else None
    advisor_name = (record or {}).pop("profiles", None)
    return {
        **base,
        "student": record,
        "advisor_name": (advisor_name or {}).get("full_name") if advisor_name else None,
        "unread_advisor_replies": list_unread_advisor_replies(user.profile_id),
    }
