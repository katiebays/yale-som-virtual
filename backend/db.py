"""Read-only access to the Yale SOM course catalog (data/yale_som.db)."""

from __future__ import annotations

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "yale_som.db"
MAX_ROWS = 15  # cap tool results so a broad search doesn't flood the model

SUMMARY_COLS = "course_number, section, course_title, course_category, faculty_1, daytimes, room, course_session, units"


def _connect() -> sqlite3.Connection:
    con = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    return con


def _rows(sql: str, params: tuple = ()) -> list[dict]:
    with _connect() as con:
        return [dict(r) for r in con.execute(sql, params).fetchall()]


def search_courses(query: str, category: str | None = None) -> list[dict]:
    """Courses whose number, title, description, category, or instructor contains `query`."""
    like = f"%{query.strip()}%"
    sql = (
        f"select {SUMMARY_COLS} from courses where "
        "(course_number like ? or course_title like ? or course_description like ? "
        "or course_category like ? or faculty_1 like ?)"
    )
    params: tuple = (like,) * 5
    if category:
        sql += " and course_category like ?"
        params += (f"%{category}%",)
    return _rows(sql + f" order by course_number, section limit {MAX_ROWS}", params)


def get_course(course_number: str) -> list[dict]:
    """Every section of one course, with description, bio, schedule, and syllabus link."""
    num = " ".join(course_number.upper().split())  # "mgt  409" -> "MGT 409"
    return _rows(
        "select course_number, section, course_title, course_category, course_session, course_description, "
        "faculty_1, faculty_bio, daytimes, room, units, syllabus from courses where course_number = ? order by section",
        (num,),
    )


def courses_by_professor(name: str) -> list[dict]:
    """Courses taught by anyone whose name contains `name` (stored as "Last, First")."""
    return _rows(
        f"select {SUMMARY_COLS} from courses where faculty_1 like ? order by course_number, section limit {MAX_ROWS}",
        (f"%{name.strip()}%",),
    )


def courses_in_room(room: str) -> list[dict]:
    """Courses that meet in a room, e.g. "2200" or "EVANS 2200"."""
    return _rows(
        f"select {SUMMARY_COLS} from courses where room like ? order by daytimes limit {MAX_ROWS}",
        (f"%{room.strip()}%",),
    )


def list_categories() -> list[dict]:
    return _rows("select course_category as category, count(*) as sections from courses group by 1 order by 2 desc")
