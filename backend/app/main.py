from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth, chat, tickets

app = FastAPI(title="Vizor Backend")

_cors_origins = [o.strip() for o in get_settings().cors_allowed_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=r"https://([a-zA-Z0-9-]+\.)*asu\.edu",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Chrome's Private Network Access policy blocks a public HTTPS page
    # (e.g. ai.asu.edu) from fetching a loopback address like
    # localhost:8000 unless the server opts in on the preflight.
    allow_private_network=True,
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(tickets.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
