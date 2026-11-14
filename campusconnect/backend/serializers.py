def event_to_dict(row, registration_count=None):
    data = {
        "id": row["id"],
        "title": row["title"],
        "category": row["category"],
        "description": row["description"],
        "date": row["date"],
        "time": row["time"],
        "venue": row["venue"],
    }
    if registration_count is not None:
        data["registrationCount"] = registration_count
    return data


def registration_to_dict(row):
    return {
        "id": row["id"],
        "eventId": row["event_id"],
        "eventTitle": row["event_title"],
        "name": row["name"],
        "usn": row["usn"],
        "email": row["email"],
        "department": row["department"],
        "createdAt": row["created_at"],
    }


def stats_row_to_dict(row):
    return {
        "eventId": row["event_id"],
        "title": row["title"],
        "count": row["count"],
    }
