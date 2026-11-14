import sqlite3

from flask import Blueprint, jsonify, request

from db import get_db
from seed import utc_now_iso
from serializers import event_to_dict, registration_to_dict, stats_row_to_dict
from validation import (
    parse_event_id,
    text_field,
    validate_event,
    validate_registration,
)

api = Blueprint("api", __name__, url_prefix="/api")

EVENT_LIST_SQL = """
SELECT e.*, COUNT(r.id) AS registration_count
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id
GROUP BY e.id
ORDER BY e.date, e.id
"""

REGISTRATION_LIST_SQL = """
SELECT r.*, e.title AS event_title
FROM registrations r
JOIN events e ON e.id = r.event_id
ORDER BY r.created_at DESC, r.id DESC
"""


@api.get("/health")
def health():
    return jsonify({"status": "ok"})


@api.get("/events")
def list_events():
    rows = get_db().execute(EVENT_LIST_SQL).fetchall()
    return jsonify(
        {"events": [event_to_dict(row, row["registration_count"]) for row in rows]}
    )


@api.post("/events")
def create_event():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return (
            jsonify(
                {
                    "error": "Request body must be a JSON object.",
                    "fields": {"body": "Send a JSON object."},
                }
            ),
            400,
        )

    errors = validate_event(data)
    if errors:
        return jsonify({"error": "Validation failed.", "fields": errors}), 400

    database = get_db()
    cursor = database.execute(
        """
        INSERT INTO events (title, category, description, date, time, venue, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            text_field(data, "title"),
            text_field(data, "category") or "General",
            text_field(data, "description") or "",
            text_field(data, "date"),
            text_field(data, "time") or "",
            text_field(data, "venue"),
            utc_now_iso(),
        ),
    )
    database.commit()
    row = database.execute(
        "SELECT *, 0 AS registration_count FROM events WHERE id = ?",
        (cursor.lastrowid,),
    ).fetchone()
    return jsonify({"event": event_to_dict(row, 0)}), 201


@api.delete("/events/<int:event_id>")
def delete_event(event_id):
    database = get_db()
    row = database.execute(
        "SELECT id FROM events WHERE id = ?", (event_id,)
    ).fetchone()
    if row is None:
        return jsonify({"error": "Event not found."}), 404

    database.execute("DELETE FROM events WHERE id = ?", (event_id,))
    database.commit()
    return "", 204


@api.get("/registrations")
def list_registrations():
    rows = get_db().execute(REGISTRATION_LIST_SQL).fetchall()
    return jsonify(
        {"registrations": [registration_to_dict(row) for row in rows]}
    )


@api.post("/registrations")
def create_registration():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return (
            jsonify(
                {
                    "error": "Request body must be a JSON object.",
                    "fields": {"body": "Send a JSON object."},
                }
            ),
            400,
        )

    errors = validate_registration(data)
    event_id = parse_event_id(data.get("eventId"))
    database = get_db()

    if event_id is not None:
        event = database.execute(
            "SELECT id FROM events WHERE id = ?", (event_id,)
        ).fetchone()
        if event is None:
            errors["eventId"] = "Selected event does not exist."

    if errors:
        return jsonify({"error": "Validation failed.", "fields": errors}), 400

    usn = text_field(data, "usn").upper()
    duplicate = database.execute(
        "SELECT id FROM registrations WHERE event_id = ? AND usn = ?",
        (event_id, usn),
    ).fetchone()
    if duplicate is not None:
        return (
            jsonify(
                {"error": "This student is already registered for this event."}
            ),
            409,
        )

    try:
        cursor = database.execute(
            """
            INSERT INTO registrations (event_id, name, usn, email, department, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                event_id,
                text_field(data, "name"),
                usn,
                text_field(data, "email"),
                text_field(data, "department"),
                utc_now_iso(),
            ),
        )
        database.commit()
    except sqlite3.IntegrityError as error:
        database.rollback()
        if "UNIQUE constraint failed: registrations.event_id, registrations.usn" in str(
            error
        ):
            return (
                jsonify(
                    {"error": "This student is already registered for this event."}
                ),
                409,
            )
        return jsonify({"error": "Could not save the registration."}), 400

    row = database.execute(
        """
        SELECT r.*, e.title AS event_title
        FROM registrations r
        JOIN events e ON e.id = r.event_id
        WHERE r.id = ?
        """,
        (cursor.lastrowid,),
    ).fetchone()
    return jsonify({"registration": registration_to_dict(row)}), 201


@api.get("/stats")
def stats():
    database = get_db()
    total_events = database.execute(
        "SELECT COUNT(*) AS count FROM events"
    ).fetchone()["count"]
    total_registrations = database.execute(
        "SELECT COUNT(*) AS count FROM registrations"
    ).fetchone()["count"]
    events_with_registrations = database.execute(
        "SELECT COUNT(DISTINCT event_id) AS count FROM registrations"
    ).fetchone()["count"]
    per_event = database.execute(
        """
        SELECT e.id AS event_id, e.title, COUNT(r.id) AS count
        FROM events e
        LEFT JOIN registrations r ON r.event_id = e.id
        GROUP BY e.id
        ORDER BY e.date, e.id
        """
    ).fetchall()

    return jsonify(
        {
            "totalEvents": total_events,
            "totalRegistrations": total_registrations,
            "eventsWithRegistrations": events_with_registrations,
            "perEvent": [stats_row_to_dict(row) for row in per_event],
        }
    )
