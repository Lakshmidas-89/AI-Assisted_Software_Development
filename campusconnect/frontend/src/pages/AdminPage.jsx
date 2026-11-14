import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "../api.js";
import { formatDate } from "../components/EventCard.jsx";
import {
  ArrowUpRightIcon,
  CalendarIcon,
  CheckIcon,
  InboxIcon,
  PlusIcon,
  TicketIcon,
  TrashIcon,
  UsersIcon,
} from "../components/Icons.jsx";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  ConfirmDialog,
  EmptyState,
  MetricCard,
  PageHeader,
  Skeleton,
  StatusMessage,
  TextField,
  TextareaField,
} from "../components/ui.jsx";

const EMPTY_EVENT = {
  title: "",
  date: "",
  venue: "",
  time: "",
  description: "",
};

export function validateEvent(form) {
  const errors = {};

  if (form.title.trim().length < 2) {
    errors.title = "Enter an event title with at least 2 characters.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
    errors.date = "Use a date in YYYY-MM-DD format.";
  } else {
    const [year, month, day] = form.date.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      errors.date = "Enter a real calendar date.";
    }
  }

  if (!form.venue.trim()) {
    errors.venue = "Venue is required.";
  }

  return errors;
}

function AdminSkeleton() {
  return (
    <>
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="p-6">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="mt-5 h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
          </Card>
        ))}
      </div>
      <Skeleton className="mt-10 h-72 rounded-xl" />
      <Skeleton className="mt-10 h-64 rounded-xl" />
    </>
  );
}

export default function AdminPage() {
  const [data, setData] = useState({
    stats: null,
    events: [],
    registrations: [],
  });
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [eventForm, setEventForm] = useState(EMPTY_EVENT);
  const [eventErrors, setEventErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const addEventRef = useRef(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setStatus("loading");
    }

    try {
      const [stats, events, registrations] = await Promise.all([
        api.getStats(),
        api.getEvents(),
        api.getRegistrations(),
      ]);
      setData({ stats, events, registrations });
      setStatus("ready");
    } catch (err) {
      if (!silent) {
        setLoadError(err.message);
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateEventField(field, value) {
    setEventForm((current) => ({ ...current, [field]: value }));
    setEventErrors((current) => ({ ...current, [field]: undefined }));
  }

  function focusAddForm() {
    addEventRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("event-name")?.focus({ preventScroll: true });
  }

  async function handleAddEvent(submitEvent) {
    submitEvent.preventDefault();
    const nextErrors = validateEvent(eventForm);
    setEventErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      setFeedback({
        type: "error",
        message: "Fix the highlighted fields and try again.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const created = await api.createEvent(eventForm);
      setFeedback({ type: "success", message: `Added "${created.title}".` });
      setEventForm(EMPTY_EVENT);
      await load({ silent: true });
    } catch (err) {
      if (err.fields && Object.keys(err.fields).length > 0) {
        setEventErrors(err.fields);
      }
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    const target = pendingDelete;
    setFeedback(null);
    setDeletingId(target.id);

    try {
      await api.deleteEvent(target.id);
      setFeedback({ type: "success", message: `Deleted "${target.title}".` });
      setPendingDelete(null);
      await load({ silent: true });
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
      setPendingDelete(null);
    } finally {
      setDeletingId(null);
    }
  }

  if (status === "loading") {
    return (
      <>
        <PageHeader
          eyebrow="Admin"
          title="Event control room"
          description="Live counts, participant records, and event management in one place."
        />
        <AdminSkeleton />
      </>
    );
  }

  if (status === "error") {
    return (
      <>
        <PageHeader
          eyebrow="Admin"
          title="Event control room"
          description="Live counts, participant records, and event management in one place."
        />
        <div className="mt-8 space-y-4">
          <StatusMessage tone="error">
            {loadError || "Could not load the dashboard."}
          </StatusMessage>
          <Button variant="secondary" onClick={() => load()}>
            Try again
          </Button>
        </div>
      </>
    );
  }

  const { stats, events, registrations } = data;
  const datesById = Object.fromEntries(
    events.map((event) => [event.id, event.date])
  );
  const coverage = stats.totalEvents
    ? Math.round((stats.eventsWithRegistrations / stats.totalEvents) * 100)
    : 0;

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Event control room"
        description="Live counts, participant records, and event management in one place."
        actions={
          <ButtonLink variant="secondary" to="/events">
            Open public site
            <ArrowUpRightIcon className="h-4 w-4" />
          </ButtonLink>
        }
      />

      {feedback && (
        <div className="mt-6">
          <StatusMessage
            tone={feedback.type === "error" ? "error" : "success"}
          >
            {feedback.message}
          </StatusMessage>
        </div>
      )}

      <section className="mt-8" aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">
          Overview
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <MetricCard
            icon={CalendarIcon}
            label="Total events"
            value={stats.totalEvents}
            badge="Live"
            badgeTone="cyan"
          />
          <MetricCard
            icon={TicketIcon}
            label="Total registrations"
            value={stats.totalRegistrations}
            badge={coverage > 0 ? `${coverage}% coverage` : "Awaiting"}
            badgeTone={coverage > 0 ? "success" : "neutral"}
          />
          <MetricCard
            icon={UsersIcon}
            label="Events with signups"
            value={stats.eventsWithRegistrations}
            badge={stats.eventsWithRegistrations > 0 ? "Active" : "None yet"}
            badgeTone={stats.eventsWithRegistrations > 0 ? "amber" : "neutral"}
          />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="events-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="events-heading"
              className="text-xl font-bold tracking-tight text-ink"
            >
              Event directory
            </h2>
            <p className="mt-1 text-sm text-muted">
              Participant counts update live from the database.
            </p>
          </div>
          <Badge tone="cyan">
            {stats.perEvent.length}{" "}
            {stats.perEvent.length === 1 ? "event" : "events"}
          </Badge>
        </div>

        <div className="mt-4">
          {stats.perEvent.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title="No events in the directory"
              description="Create the first event and it will appear on the public site immediately."
              action={
                <Button onClick={focusAddForm}>
                  <PlusIcon className="h-4 w-4" />
                  Add an event
                </Button>
              }
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Participants</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.perEvent.map((row) => {
                    const isDeleting = deletingId === row.eventId;
                    return (
                      <tr key={row.eventId}>
                        <td>
                          <div className="font-medium text-ink">
                            {row.title}
                          </div>
                          <div className="mt-0.5 font-mono text-[11px] tabular-nums text-muted">
                            EVT-{String(row.eventId).padStart(3, "0")}
                          </div>
                        </td>
                        <td className="font-mono text-xs tabular-nums text-muted">
                          {formatDate(datesById[row.eventId])}
                        </td>
                        <td>
                          <Badge tone={row.count > 0 ? "success" : "neutral"}>
                            <UsersIcon className="h-3 w-3" />
                            {row.count} {row.count === 1 ? "student" : "students"}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <Button
                            variant="danger"
                            className="px-3 py-1.5 text-xs"
                            disabled={isDeleting}
                            onClick={() =>
                              setPendingDelete({
                                id: row.eventId,
                                title: row.title,
                              })
                            }
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            {isDeleting ? "Deleting…" : "Delete"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <Card
        ref={addEventRef}
        className="mt-10 scroll-mt-24 p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink">
              Add a new event
            </h2>
            <p className="mt-1 text-sm text-muted">
              It appears on the home and events pages immediately.
            </p>
          </div>
          <Badge tone="amber">
            <CheckIcon className="h-3.5 w-3.5" />
            Admin only
          </Badge>
        </div>

        <form
          onSubmit={handleAddEvent}
          noValidate
          className="mt-6 grid gap-5 sm:grid-cols-2"
        >
          <TextField
            id="event-name"
            name="title"
            label="Event name"
            value={eventForm.title}
            onChange={(event) =>
              updateEventField("title", event.target.value)
            }
            placeholder="Enter event name"
            className="sm:col-span-2"
            error={eventErrors.title}
          />

          <TextField
            id="event-date"
            name="date"
            type="date"
            label="Date"
            value={eventForm.date}
            onChange={(event) => updateEventField("date", event.target.value)}
            error={eventErrors.date}
          />

          <TextField
            id="event-time"
            name="time"
            label="Time"
            value={eventForm.time}
            onChange={(event) => updateEventField("time", event.target.value)}
            placeholder="e.g. 10:00 AM – 1:00 PM"
            hint="Optional"
            error={eventErrors.time}
          />

          <TextField
            id="event-venue"
            name="venue"
            label="Venue"
            value={eventForm.venue}
            onChange={(event) => updateEventField("venue", event.target.value)}
            placeholder="e.g. Main Seminar Hall"
            className="sm:col-span-2"
            error={eventErrors.venue}
          />

          <TextareaField
            id="event-description"
            name="description"
            label="Description"
            value={eventForm.description}
            onChange={(event) =>
              updateEventField("description", event.target.value)
            }
            placeholder="What should students expect?"
            hint="Optional. Shown on event cards."
            className="sm:col-span-2"
            error={eventErrors.description}
          />

          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>
              <PlusIcon className="h-4 w-4" />
              {saving ? "Saving…" : "Add event"}
            </Button>
          </div>
        </form>
      </Card>

      <section className="mt-10" aria-labelledby="participants-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="participants-heading"
              className="text-xl font-bold tracking-tight text-ink"
            >
              Registered participants
            </h2>
            <p className="mt-1 text-sm text-muted">
              Every student registration, newest first.
            </p>
          </div>
          <Badge tone={registrations.length > 0 ? "success" : "neutral"}>
            {registrations.length}{" "}
            {registrations.length === 1 ? "registration" : "registrations"}
          </Badge>
        </div>

        <div className="mt-4">
          {registrations.length === 0 ? (
            <EmptyState
              icon={InboxIcon}
              title="No participants registered yet"
              description="Share the events page with students — signups will appear here the moment they register."
              action={
                <ButtonLink variant="secondary" to="/events">
                  View public events
                  <ArrowUpRightIcon className="h-4 w-4" />
                </ButtonLink>
              }
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>USN</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Event</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((registration) => (
                    <tr key={registration.id}>
                      <td className="font-medium text-ink">
                        {registration.name}
                      </td>
                      <td className="font-mono text-xs uppercase text-cyan">
                        {registration.usn}
                      </td>
                      <td>
                        <a
                          href={`mailto:${registration.email}`}
                          className="rounded text-cyan transition-colors hover:text-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
                        >
                          {registration.email}
                        </a>
                      </td>
                      <td>
                        <Badge tone="neutral">{registration.department}</Badge>
                      </td>
                      <td className="text-muted">{registration.eventTitle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this event?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" and every registration attached to it will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete event"
        busyLabel="Deleting…"
        busy={Boolean(deletingId)}
        onCancel={() => {
          if (!deletingId) {
            setPendingDelete(null);
          }
        }}
        onConfirm={confirmDelete}
      />
    </>
  );
}
