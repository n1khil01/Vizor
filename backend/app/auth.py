from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.db.client import get_supabase

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    auth_user_id: str
    profile_id: str
    role: str
    full_name: str
    email: str


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    sb = get_supabase()
    try:
        auth_response = sb.auth.get_user(credentials.credentials)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        ) from exc

    if auth_response is None or auth_response.user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    auth_user_id = auth_response.user.id

    result = (
        sb.table("profiles")
        .select("id, role, full_name, email")
        .eq("auth_user_id", auth_user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No profile for this account")

    profile = result.data
    return CurrentUser(
        auth_user_id=auth_user_id,
        profile_id=profile["id"],
        role=profile["role"],
        full_name=profile["full_name"],
        email=profile["email"],
    )


async def require_student(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student account required")
    return user


async def require_advisor(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role != "advisor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Advisor account required")
    return user
