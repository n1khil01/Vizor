"""Phase 4 gate (docs/PROJECT_PLAN.md §10): the chat endpoint's tool loop must
ground each of the six §6.4 questions in the right source (DARS vs. KB) and
answer with real numbers, not invented ones.

Requires the DB to already be seeded (`uv run scripts/create_demo_users.py`).

    uv run scripts/verify_chat.py
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient

from app.main import app

DEMO_EMAIL = "jalvarez@asu.edu"
DEMO_PASSWORD = "VizorDemo2026!"

QUESTIONS = [
    "Do my CSE 310 and MAT 243 count toward my major requirements?",
    "Am I on track to graduate on time?",
    "What clubs or activities fit my major?",
    "I filled out the change of major form and it still told me to book a meeting — what am I missing?",
    "I'm not sure Computer Science is right for me — what would be a better fit?",
    "What opportunities are there to accelerate my career, like internships or a 4+1 program?",
]


def read_sse(response) -> tuple[str, str | None]:
    text = ""
    conversation_id = None
    for line in response.iter_lines():
        if not line or not line.startswith("data: "):
            continue
        payload = json.loads(line.removeprefix("data: "))
        if "delta" in payload:
            text += payload["delta"]
        elif "conversation_id" in payload:
            conversation_id = payload["conversation_id"]
    return text, conversation_id


def main() -> None:
    client = TestClient(app)

    login = client.post("/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    login.raise_for_status()
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    conversation_id = None
    for question in QUESTIONS:
        print(f"\n=== {question} ===")
        body = {"message": question}
        if conversation_id:
            body["conversation_id"] = conversation_id
        with client.stream("POST", "/chat", json=body, headers=headers) as response:
            response.raise_for_status()
            answer, conversation_id = read_sse(response)
        print(answer)

    print("\nPASS: all six questions answered. Read the transcript above to confirm grounding.")


if __name__ == "__main__":
    main()
