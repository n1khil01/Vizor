from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from supabase import create_client

from app.config import get_settings

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
