"""FastAPI backend: chat with Yale SOM professor agents.

Run from this folder:  uvicorn main:app --port 8000
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

# backend/.env first (model choice), then parent folders (the class .env holds PORTKEY_API_KEY).
# load_dotenv never overrides a value that's already set, so the closest file wins.
HERE = Path(__file__).resolve().parent
for folder in [HERE, *HERE.parents][:5]:
    load_dotenv(folder / ".env")
os.environ.setdefault("PYDANTIC_AI_NO_BANNER", "1")

from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402
from pydantic_ai.messages import ModelMessage  # noqa: E402
from pydantic_ai.usage import UsageLimits  # noqa: E402

from professors import PERSONAS, build_agents  # noqa: E402

log = logging.getLogger("professors")
logging.basicConfig(level=logging.INFO)

MAX_HISTORY = 40  # messages kept per conversation
MAX_SESSIONS = 500

app = FastAPI(title="Yale SOM Virtual professors")
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
origins += [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST"], allow_headers=["*"])

agents = build_agents()
sessions: dict[tuple[str, str], list[ModelMessage]] = {}  # (session_id, professor_id) -> history


class ChatIn(BaseModel):
    professor_id: str
    session_id: str = Field(min_length=8, max_length=64)
    message: str = Field(min_length=1, max_length=2000)


class ChatOut(BaseModel):
    reply: str


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "model": os.getenv("OPENAI_MODEL", "gpt-6-luna")}


@app.get("/api/professors")
def professors() -> list[dict]:
    return [{"id": p.id, "name": p.display_name, "course": p.course_number} for p in PERSONAS.values()]


@app.post("/api/chat", response_model=ChatOut)
async def chat(body: ChatIn) -> ChatOut:
    agent = agents.get(body.professor_id)
    if agent is None:
        raise HTTPException(404, f"No professor called {body.professor_id!r}")
    key = (body.session_id, body.professor_id)
    try:
        result = await agent.run(
            body.message,
            message_history=sessions.get(key),
            usage_limits=UsageLimits(request_limit=6),
        )
    except Exception as exc:  # surface a readable message, keep details in the server log
        log.exception("agent run failed")
        raise HTTPException(502, "The professor couldn't answer just now. Check the backend log.") from exc
    if len(sessions) >= MAX_SESSIONS and key not in sessions:
        sessions.pop(next(iter(sessions)))
    sessions[key] = result.all_messages()[-MAX_HISTORY:]
    return ChatOut(reply=result.output)
