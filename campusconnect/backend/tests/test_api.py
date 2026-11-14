def get_event_id(client, index=0):
    events = client.get("/api/events").get_json()["events"]
    return events[index]["id"]


def registration_payload(event_id, **overrides):
    payload = {
        "eventId": event_id,
        "name": "Asha Rao",
        "usn": "4VC23AI001",
        "email": "asha@example.com",
        "department": "CSE",
    }
    payload.update(overrides)
    return payload


def test_health_endpoint(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}


def test_seeds_five_events(client):
    response = client.get("/api/events")

    assert response.status_code == 200
    events = response.get_json()["events"]
    assert len(events) == 5
    assert events[0]["title"] == "AI and Machine Learning Workshop"
    assert events[0]["registrationCount"] == 0


def test_creates_registration(client):
    event_id = get_event_id(client)

    response = client.post("/api/registrations", json=registration_payload(event_id))

    assert response.status_code == 201
    registration = response.get_json()["registration"]
    assert registration["eventId"] == event_id
    assert registration["usn"] == "4VC23AI001"
    assert registration["eventTitle"] == "AI and Machine Learning Workshop"


def test_lists_registrations(client):
    event_id = get_event_id(client)
    client.post("/api/registrations", json=registration_payload(event_id))

    response = client.get("/api/registrations")

    assert response.status_code == 200
    registrations = response.get_json()["registrations"]
    assert len(registrations) == 1
    assert registrations[0]["name"] == "Asha Rao"


def test_blocks_duplicate_usn_case_insensitive(client):
    event_id = get_event_id(client)
    first = client.post("/api/registrations", json=registration_payload(event_id))
    assert first.status_code == 201

    duplicate = client.post(
        "/api/registrations", json=registration_payload(event_id, usn="4vc23ai001")
    )

    assert duplicate.status_code == 409
    assert (
        duplicate.get_json()["error"]
        == "This student is already registered for this event."
    )


def test_allows_same_usn_for_different_events(client):
    first_event = get_event_id(client, 0)
    second_event = get_event_id(client, 1)

    first = client.post("/api/registrations", json=registration_payload(first_event))
    second = client.post("/api/registrations", json=registration_payload(second_event))

    assert first.status_code == 201
    assert second.status_code == 201


def test_rejects_invalid_registration(client):
    response = client.post(
        "/api/registrations",
        json={
            "eventId": None,
            "name": "A",
            "usn": "x",
            "email": "bad",
            "department": "",
        },
    )

    assert response.status_code == 400
    fields = response.get_json()["fields"]
    assert set(fields) == {"name", "usn", "email", "department", "eventId"}


def test_rejects_malformed_json(client):
    response = client.post(
        "/api/events", data="{not json", content_type="application/json"
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_rejects_non_object_json(client):
    response = client.post("/api/registrations", json=["not", "an", "object"])

    assert response.status_code == 400
    assert "body" in response.get_json()["fields"]


def test_rejects_overlong_registration_fields(client):
    event_id = get_event_id(client)

    response = client.post(
        "/api/registrations",
        json=registration_payload(event_id, name="A" * 121),
    )

    assert response.status_code == 400
    assert "name" in response.get_json()["fields"]


def test_rejects_unknown_event(client):
    response = client.post(
        "/api/registrations", json=registration_payload(9999)
    )

    assert response.status_code == 400
    assert "eventId" in response.get_json()["fields"]


def test_creates_event(client):
    response = client.post(
        "/api/events",
        json={"title": "New Event", "date": "2026-03-01", "venue": "Hall"},
    )

    assert response.status_code == 201
    event = response.get_json()["event"]
    assert event["title"] == "New Event"
    assert event["category"] == "General"

    events = client.get("/api/events").get_json()["events"]
    assert len(events) == 6


def test_creates_event_with_optional_details(client):
    response = client.post(
        "/api/events",
        json={
            "title": "Detailed Event",
            "date": "2026-03-08",
            "venue": "Hall",
            "category": "Workshop",
            "time": "10:00 AM",
            "description": "A detailed description.",
        },
    )

    assert response.status_code == 201
    event = response.get_json()["event"]
    assert event["category"] == "Workshop"
    assert event["time"] == "10:00 AM"
    assert event["description"] == "A detailed description."


def test_rejects_invalid_event(client):
    response = client.post(
        "/api/events",
        json={"title": "A", "date": "01-03-2026", "venue": ""},
    )

    assert response.status_code == 400
    fields = response.get_json()["fields"]
    assert set(fields) == {"title", "date", "venue"}


def test_rejects_impossible_calendar_date(client):
    response = client.post(
        "/api/events",
        json={"title": "Impossible", "date": "2026-02-31", "venue": "Hall"},
    )

    assert response.status_code == 400
    assert "date" in response.get_json()["fields"]


def test_deletes_event(client):
    event_id = get_event_id(client)

    assert client.delete(f"/api/events/{event_id}").status_code == 204
    assert client.delete(f"/api/events/{event_id}").status_code == 404
    assert len(client.get("/api/events").get_json()["events"]) == 4


def test_delete_event_cascades_registrations(client):
    event_id = get_event_id(client)
    client.post("/api/registrations", json=registration_payload(event_id))

    assert client.delete(f"/api/events/{event_id}").status_code == 204

    assert client.get("/api/registrations").get_json()["registrations"] == []


def test_deleted_seed_events_are_not_restored_on_restart(tmp_path):
    from app import create_app
    from config import TestConfig

    database_path = str(tmp_path / "restart.db")

    first_app = create_app(TestConfig, DATABASE_PATH=database_path)
    first_client = first_app.test_client()
    events = first_client.get("/api/events").get_json()["events"]
    for event in events:
        assert first_client.delete(f"/api/events/{event['id']}").status_code == 204

    second_app = create_app(TestConfig, DATABASE_PATH=database_path)
    second_client = second_app.test_client()

    assert second_client.get("/api/events").get_json()["events"] == []


def test_stats_reflect_data(client):
    event_id = get_event_id(client)

    before = client.get("/api/stats").get_json()
    assert before["totalEvents"] == 5
    assert before["totalRegistrations"] == 0
    assert before["eventsWithRegistrations"] == 0
    assert len(before["perEvent"]) == 5

    client.post("/api/registrations", json=registration_payload(event_id))

    after = client.get("/api/stats").get_json()
    assert after["totalRegistrations"] == 1
    assert after["eventsWithRegistrations"] == 1
    counts = {row["eventId"]: row["count"] for row in after["perEvent"]}
    assert counts[event_id] == 1
    assert len(counts) == 5
