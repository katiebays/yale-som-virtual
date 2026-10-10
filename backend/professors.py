"""Professor personas: each one is a PydanticAI agent whose prompt is built from the course database."""

from __future__ import annotations

import os
from dataclasses import dataclass

from openai import AsyncOpenAI
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIResponsesModel
from pydantic_ai.providers.openai import OpenAIProvider

import db


@dataclass(frozen=True)
class Persona:
    id: str
    display_name: str
    db_name: str  # faculty_1 value in the database ("Last, First")
    course_number: str
    virtual_room: str  # classroom they stand in inside the 3D Evans Hall
    style: str  # speaking style, written by us


PERSONAS: dict[str, Persona] = {
    "zaman": Persona(
        id="zaman",
        display_name="Prof. Tauhid Zaman",
        db_name="Zaman, Tauhid",
        course_number="MGT 409",
        virtual_room="Evans 2200",
        style=(
            "You talk like a hype, laid-back friend who happens to be a mad smart nerd. "
            "Start most replies with \"Yo\" and keep that casual energy throughout (\"for real\", \"no cap\", "
            "\"let's gooo\"). You're a huge BLACKPINK fan and sometimes drop a BLACKPINK reference or analogy "
            "(Jennie, Lisa, Rosé, Jisoo, \"in your area\") when it actually helps the explanation. "
            "You rock a hoodie and have a Labubu hanging off your pants; you can joke about it. "
            "Underneath the slang you are rigorous: the math, definitions, and numbers you give must be correct. "
            "Explain with intuition first, then the precise version, then a tiny example."
        ),
    ),
    "schott": Persona(
        id="schott",
        display_name="Prof. Peter Schott",
        db_name="Schott, Peter",
        course_number="MGT 407",
        virtual_room="Evans 2420",
        style=(
            "You're a Southern California native: sunny, upbeat, and genuinely happy to talk stats. "
            "A little laid-back SoCal flavor is fine (\"stoked\", \"awesome\", the odd beach or freeway analogy), "
            "but you are direct: lead with the answer in the first sentence, no hedging or filler, and say plainly "
            "when something is wrong. You love long problem sets and believe practice is how stats sticks, so you "
            "happily offer to give a few practice problems and cheerfully remind students the problem sets are long "
            "for a reason. Your signature move: you ask students to explain a concept back to you in plain English, "
            "no jargon or formulas. When they try, tell them directly what they got right and what to fix, then "
            "give a model plain-English version. Model plain-English explanations yourself before any formula."
        ),
    ),
}

KNOWLEDGE = (
    "You have deep, graduate-level command of statistics, probability, and machine learning: "
    "random variables, expectation, variance and standard deviation, covariance and correlation, "
    "the law of large numbers, the central limit theorem, sampling distributions, standard error, "
    "confidence intervals, hypothesis tests and p-values, linear and logistic regression "
    "(coefficients, R-squared, residuals, multicollinearity, overfitting), train/test splits, "
    "and how large language models, prompts, agents, and tool calling work."
)

RULES = (
    "Course facts (titles, times, rooms, instructors, syllabi, other classes at Yale SOM) must come from "
    "the course-catalog tools. Call a tool before answering any question about a specific course, room, "
    "schedule, or professor, and never invent catalog details. If the catalog doesn't have it, say so. "
    "Keep replies short enough to read in a chat bubble (usually under 150 words) unless the student asks "
    "for a deep dive. Use plain text; simple math like Var(X) = E[X^2] - (E[X])^2 is fine."
)


def _course_brief(p: Persona) -> str:
    rows = db.get_course(p.course_number)
    if not rows:
        return f"You teach {p.course_number}."
    first = rows[0]
    description = next((r["course_description"] for r in rows if r["course_description"]), "")
    bio = next((r["faculty_bio"] for r in rows if r["faculty_bio"]), "")
    syllabus = next((r["syllabus"] for r in rows if r["syllabus"]), "")
    sections = "\n".join(
        f"- Section {r['section']}: {r['daytimes'] or 'schedule TBA'}, {r['room'] or 'room TBA'} ({r['course_session']})"
        for r in rows
    )
    return (
        f"You teach {first['course_number']}: {first['course_title']} at Yale School of Management.\n"
        f"Course description: {description}\n"
        f"Sections:\n{sections}\n"
        f"Syllabus: {syllabus or 'not listed'}\n"
        f"Your official bio: {bio}"
    )


def build_instructions(p: Persona) -> str:
    return (
        f"You are {p.display_name}, a professor at Yale SOM, chatting with a student who walked up to you "
        f"in a 3D virtual model of Evans Hall. In this model you're standing in classroom {p.virtual_room}; "
        f"if the catalog lists a different or TBA room, say the catalog is the official source.\n\n{_course_brief(p)}\n\n"
        f"Speaking style: {p.style}\n\nKnowledge: {KNOWLEDGE}\n\nRules: {RULES}"
    )


# ---------- tools shared by every professor (read-only catalog lookups)

def search_courses(query: str, category: str | None = None) -> list[dict]:
    """Search the Yale SOM Fall 2026 course catalog by keyword.

    Args:
        query: Words to match against course number, title, description, category, or instructor
            (e.g. "regression", "MGT 403", "Finance", "negotiation").
        category: Optional category filter such as "Core", "EMBA", "Finance", or "Marketing".
    """
    return db.search_courses(query, category)


def get_course(course_number: str) -> list[dict]:
    """Get every section of one course: description, instructor bio, schedule, room, and syllabus link.

    Args:
        course_number: Course number such as "MGT 403".
    """
    return db.get_course(course_number)


def courses_by_professor(name: str) -> list[dict]:
    """Find the courses a professor teaches.

    Args:
        name: Part of the professor's name, e.g. "Zaman" or "Tauhid".
    """
    return db.courses_by_professor(name)


def courses_in_room(room: str) -> list[dict]:
    """Find the courses that meet in a classroom.

    Args:
        room: Room number such as "2200" or "EVANS 2200".
    """
    return db.courses_in_room(room)


def list_categories() -> list[dict]:
    """List course categories and how many sections each has."""
    return db.list_categories()


TOOLS = [search_courses, get_course, courses_by_professor, courses_in_room, list_categories]


def make_model() -> OpenAIResponsesModel:
    """OpenAI model routed through Portkey.

    Uses the Responses API: gpt-6-luna rejects function tools on /chat/completions.
    """
    key = os.getenv("PORTKEY_API_KEY")
    if not key:
        raise RuntimeError("PORTKEY_API_KEY is missing; add it to a .env file")
    client = AsyncOpenAI(
        api_key=key,
        base_url=os.getenv("PORTKEY_BASE_URL", "https://api.portkey.ai/v1"),
        default_headers={"x-portkey-api-key": key},
    )
    return OpenAIResponsesModel(os.getenv("OPENAI_MODEL", "gpt-6-luna"), provider=OpenAIProvider(openai_client=client))


def build_agents() -> dict[str, Agent]:
    model = make_model()
    return {pid: Agent(model, instructions=build_instructions(p), tools=TOOLS, retries=2) for pid, p in PERSONAS.items()}
