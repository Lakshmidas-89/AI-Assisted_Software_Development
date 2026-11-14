import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "../api.js";
import EventCard, { EventCardSkeleton } from "../components/EventCard.jsx";
import { CalendarIcon } from "../components/Icons.jsx";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  SelectField,
  StatusMessage,
  TextField,
} from "../components/ui.jsx";

const EMPTY_FORM = {
  name: "",
  usn: "",
  email: "",
  department: "",
  eventId: "",
};

export function validateRegistration(form) {
  const errors = {};

  if (form.name.trim().length < 2) {
    errors.name = "Enter a name with at least 2 characters.";
  }
  if (!/^[A-Za-z0-9]{6,20}$/.test(form.usn.trim())) {
    errors.usn = "Enter a valid USN such as 4VC23AI001.";
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.department.trim()) {
    errors.department = "Department is required.";
  }
  if (!form.eventId) {
    errors.eventId = "Select an event.";
  }

  return errors;
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const formRef = useRef(null);

  const loadEvents = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoadStatus("loading");
    }

    try {
      const data = await api.getEvents();
      setEvents(data);
      setLoadStatus("ready");
    } catch (err) {
      if (!silent) {
        setLoadError(err.message);
        setLoadStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function selectEvent(eventId) {
    setForm((current) => ({ ...current, eventId: String(eventId) }));
    setErrors((current) => ({ ...current, eventId: undefined }));
    setFeedback(null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    const nextErrors = validateRegistration(form);
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      setFeedback({
        type: "error",
        message: "Fix the highlighted fields and try again.",
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      await api.createRegistration({
        ...form,
        eventId: Number(form.eventId),
      });
      setFeedback({
        type: "success",
        message: "Registration saved. See you there!",
      });
      setForm(EMPTY_FORM);
      await loadEvents({ silent: true });
    } catch (err) {
      if (err.fields && Object.keys(err.fields).length > 0) {
        setErrors(err.fields);
      }
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  const selectedEvent = events.find(
    (event) => String(event.id) === form.eventId
  );

  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="Browse and register"
        description="Every session on the campus calendar, in one place. Pick an event, fill in your details, and lock in your spot."
        actions={
          <Badge tone="cyan">
            <CalendarIcon className="h-3.5 w-3.5" />
            {events.length > 0 ? `${events.length} events` : "Live schedule"}
          </Badge>
        }
      />

      {loadStatus === "loading" && (
        <section className="mt-8" aria-label="Loading events">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <EventCardSkeleton key={index} />
            ))}
          </div>
        </section>
      )}

      {loadStatus === "error" && (
        <div className="mt-8 space-y-4">
          <StatusMessage tone="error">
            {loadError || "Could not load events."}
          </StatusMessage>
          <Button variant="secondary" onClick={() => loadEvents()}>
            Try again
          </Button>
        </div>
      )}

      {loadStatus === "ready" && (
        <>
          <section className="mt-8" aria-labelledby="all-events-heading">
            <h2 id="all-events-heading" className="sr-only">
              Available events
            </h2>

            {events.length === 0 ? (
              <EmptyState
                icon={CalendarIcon}
                title="No events are available yet"
                description="Once an administrator adds an event it will appear here for registration."
                action={
                  <ButtonLink to="/admin">
                    Add an event
                  </ButtonLink>
                }
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {events.map((event) => {
                  const isSelected = String(event.id) === form.eventId;
                  return (
                    <EventCard
                      key={event.id}
                      event={event}
                      showDetails
                      className={
                        isSelected ? "border-amber/60 ring-1 ring-amber/30" : ""
                      }
                      action={
                        <Button
                          className="w-full sm:w-auto"
                          variant={isSelected ? "secondary" : "primary"}
                          onClick={() => selectEvent(event.id)}
                        >
                          {isSelected ? "Selected" : "Register"}
                        </Button>
                      }
                    />
                  );
                })}
              </div>
            )}
          </section>

          <Card
            id="registration"
            className="mt-10 scroll-mt-24 p-6 sm:p-8"
            ref={formRef}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-ink">
                  Register for an event
                </h2>
                <p className="mt-1 text-sm text-muted">
                  One registration per event. Duplicate student IDs are blocked
                  automatically.
                </p>
              </div>
              {selectedEvent && (
                <Badge tone="amber" className="max-w-full normal-case tracking-normal">
                  <span className="truncate">{selectedEvent.title}</span>
                </Badge>
              )}
            </div>

            {feedback && (
              <div className="mt-5">
                <StatusMessage
                  tone={feedback.type === "error" ? "error" : "success"}
                >
                  {feedback.message}
                </StatusMessage>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-6 grid gap-5 sm:grid-cols-2"
            >
              <TextField
                id="student-name"
                name="name"
                label="Student name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Enter your name"
                autoComplete="name"
                error={errors.name}
              />

              <TextField
                id="usn"
                name="usn"
                label="USN / Student ID"
                value={form.usn}
                onChange={(event) => updateField("usn", event.target.value)}
                placeholder="e.g. 4VC23AI001"
                autoComplete="off"
                spellCheck="false"
                inputClassName="font-mono"
                error={errors.usn}
              />

              <TextField
                id="email"
                name="email"
                type="email"
                label="Email address"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                error={errors.email}
              />

              <TextField
                id="department"
                name="department"
                label="Department"
                value={form.department}
                onChange={(event) =>
                  updateField("department", event.target.value)
                }
                placeholder="e.g. CSE"
                autoComplete="organization"
                error={errors.department}
              />

              <SelectField
                id="selected-event"
                name="event"
                label="Event"
                value={form.eventId}
                onChange={(event) => updateField("eventId", event.target.value)}
                className="sm:col-span-2"
                error={errors.eventId}
              >
                <option value="">Select an event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </SelectField>

              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted">
                  Your details are stored only for this event.
                </p>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  {submitting ? "Saving…" : "Submit registration"}
                </Button>
              </div>
            </form>
          </Card>
        </>
      )}
    </>
  );
}
