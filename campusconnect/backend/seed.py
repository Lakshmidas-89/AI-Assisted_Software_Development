from datetime import date, datetime, timedelta, timezone

from db import get_db

# The five workshop events. Dates are offsets from the day the database is
# first seeded so the demo always has genuinely upcoming events.
DEFAULT_EVENTS = [
    {
        "title": "AI and Machine Learning Workshop",
        "category": "Workshop",
        "description": "Introduction to core machine learning concepts and practical AI tools.",
        "offset_days": 7,
        "time": "10:00 AM \u2013 1:00 PM",
        "venue": "Main Seminar Hall",
    },
    {
        "title": "Web Development Bootcamp",
        "category": "Bootcamp",
        "description": "Hands-on workshop covering HTML, CSS and JavaScript fundamentals.",
        "offset_days": 14,
        "time": "9:30 AM \u2013 4:00 PM",
        "venue": "Computer Lab 2",
    },
    {
        "title": "Coding Competition",
        "category": "Competition",
        "description": "Competitive programming challenge for students interested in algorithms.",
        "offset_days": 21,
        "time": "2:00 PM \u2013 5:00 PM",
        "venue": "Computer Lab 1",
    },
    {
        "title": "Project Exhibition",
        "category": "Exhibition",
        "description": "Showcase of student projects from across departments.",
        "offset_days": 28,
        "time": "11:00 AM \u2013 4:00 PM",
        "venue": "College Auditorium",
    },
    {
        "title": "Technical Quiz Competition",
        "category": "Quiz",
        "description": "A technical quiz covering programming, databases and emerging technology.",
        "offset_days": 35,
        "time": "12:00 PM \u2013 2:00 PM",
        "venue": "Seminar Hall B",
    },
]


def utc_now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def seed_events():
    """Insert the demo events once, recorded by a marker in the meta table.

    The marker makes deletion of every event durable: restarting the app must
    not silently restore the demo data.
    """
    database = get_db()

    if database.execute("SELECT 1 FROM meta WHERE key = 'seeded'").fetchone():
        return

    if database.execute("SELECT COUNT(*) AS count FROM events").fetchone()["count"] == 0:
        today = date.today()
        created_at = utc_now_iso()
        database.executemany(
            """
            INSERT INTO events (title, category, description, date, time, venue, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    event["title"],
                    event["category"],
                    event["description"],
                    (today + timedelta(days=event["offset_days"])).isoformat(),
                    event["time"],
                    event["venue"],
                    created_at,
                )
                for event in DEFAULT_EVENTS
            ],
        )

    database.execute(
        "INSERT OR REPLACE INTO meta (key, value) VALUES ('seeded', '1')"
    )
    database.commit()
