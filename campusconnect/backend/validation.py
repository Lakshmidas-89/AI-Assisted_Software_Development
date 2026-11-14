import re
from datetime import datetime

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
USN_RE = re.compile(r"^[A-Za-z0-9]{6,20}$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

MAX_SQLITE_INT = 2**63 - 1

MAX_NAME = 120
MAX_EMAIL = 200
MAX_DEPARTMENT = 120
MAX_TITLE = 200
MAX_VENUE = 200
MAX_SHORT_TEXT = 80
MAX_TEXT = 2000


def text_field(data, key):
    """Return a stripped string, or None when the value is not a string."""
    value = data.get(key)
    return value.strip() if isinstance(value, str) else None


def parse_event_id(value):
    """Accept positive integers (or integer strings) within SQLite's range."""
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        parsed = value
    elif isinstance(value, str) and value.strip().isdigit():
        parsed = int(value.strip())
    else:
        return None
    return parsed if 0 < parsed <= MAX_SQLITE_INT else None


def _too_long(value, limit):
    return value is not None and len(value) > limit


def validate_registration(data):
    if not isinstance(data, dict):
        return {"body": "Request body must be a JSON object."}

    errors = {}

    name = text_field(data, "name")
    if name is None or len(name) < 2:
        errors["name"] = "Enter a name with at least 2 characters."
    elif _too_long(name, MAX_NAME):
        errors["name"] = f"Name must be {MAX_NAME} characters or fewer."

    usn = text_field(data, "usn")
    if usn is None or not USN_RE.fullmatch(usn):
        errors["usn"] = "Enter a valid USN such as 4VC23AI001."

    email = text_field(data, "email")
    if email is None or not EMAIL_RE.fullmatch(email):
        errors["email"] = "Enter a valid email address."
    elif _too_long(email, MAX_EMAIL):
        errors["email"] = f"Email must be {MAX_EMAIL} characters or fewer."

    department = text_field(data, "department")
    if department is None or not department:
        errors["department"] = "Department is required."
    elif _too_long(department, MAX_DEPARTMENT):
        errors["department"] = (
            f"Department must be {MAX_DEPARTMENT} characters or fewer."
        )

    if parse_event_id(data.get("eventId")) is None:
        errors["eventId"] = "Select an event."

    return errors


def validate_event(data):
    if not isinstance(data, dict):
        return {"body": "Request body must be a JSON object."}

    errors = {}

    title = text_field(data, "title")
    if title is None or len(title) < 2:
        errors["title"] = "Enter an event title with at least 2 characters."
    elif _too_long(title, MAX_TITLE):
        errors["title"] = f"Title must be {MAX_TITLE} characters or fewer."

    date = text_field(data, "date")
    if date is None or not DATE_RE.fullmatch(date):
        errors["date"] = "Use a date in YYYY-MM-DD format."
    else:
        try:
            datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            errors["date"] = "Enter a real calendar date."

    venue = text_field(data, "venue")
    if venue is None or not venue:
        errors["venue"] = "Venue is required."
    elif _too_long(venue, MAX_VENUE):
        errors["venue"] = f"Venue must be {MAX_VENUE} characters or fewer."

    category = text_field(data, "category")
    if _too_long(category, MAX_SHORT_TEXT):
        errors["category"] = (
            f"Category must be {MAX_SHORT_TEXT} characters or fewer."
        )

    time = text_field(data, "time")
    if _too_long(time, MAX_SHORT_TEXT):
        errors["time"] = f"Time must be {MAX_SHORT_TEXT} characters or fewer."

    description = text_field(data, "description")
    if _too_long(description, MAX_TEXT):
        errors["description"] = (
            f"Description must be {MAX_TEXT} characters or fewer."
        )

    return errors
