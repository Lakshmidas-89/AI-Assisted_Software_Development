import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api.js";
import EventCard, { EventCardSkeleton } from "../components/EventCard.jsx";
import {
  ArrowRightIcon,
  CalendarIcon,
  SparkleIcon,
  TicketIcon,
  UsersIcon,
} from "../components/Icons.jsx";
import {
  Badge,
  ButtonLink,
  EmptyState,
  MetricCard,
  StatusMessage,
} from "../components/ui.jsx";

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([api.getEvents(), api.getStats()])
      .then(([eventList, statsData]) => {
        if (!active) return;
        setEvents(eventList);
        setStats(statsData);
        setStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  const upcoming = events.slice(0, 3);
  const coverage =
    stats && stats.totalEvents
      ? Math.round((stats.eventsWithRegistrations / stats.totalEvents) * 100)
      : 0;

  return (
    <>
      <section className="hero-panel relative animate-fade-up overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-glow sm:p-8 lg:p-10">
        <div className="relative max-w-3xl">
          <Badge tone="amber">
            <SparkleIcon className="h-3.5 w-3.5" />
            Campus events, reimagined
          </Badge>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Find your next{" "}
            <span className="bg-gradient-to-r from-amber via-amber-hover to-cyan bg-clip-text text-transparent">
              campus moment.
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            Browse workshops, bootcamps, and competitions. Register in seconds —
            your spot is saved automatically.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink to="/events">
              Browse events
              <ArrowRightIcon className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink variant="secondary" to="/admin">
              Admin dashboard
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <MetricCard
          icon={CalendarIcon}
          label="Total events"
          value={stats ? stats.totalEvents : "—"}
          badge="Live"
          badgeTone="cyan"
          loading={status === "loading"}
        />
        <MetricCard
          icon={TicketIcon}
          label="Registrations"
          value={stats ? stats.totalRegistrations : "—"}
          badge={coverage > 0 ? `${coverage}% coverage` : "Awaiting"}
          badgeTone={coverage > 0 ? "success" : "neutral"}
          loading={status === "loading"}
        />
        <MetricCard
          icon={UsersIcon}
          label="Events with signups"
          value={stats ? stats.eventsWithRegistrations : "—"}
          badge={
            stats && stats.eventsWithRegistrations > 0 ? "Active" : "None yet"
          }
          badgeTone={
            stats && stats.eventsWithRegistrations > 0 ? "amber" : "neutral"
          }
          loading={status === "loading"}
        />
      </div>

      <section className="mt-12" aria-labelledby="upcoming-events-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="upcoming-events-heading"
              className="text-2xl font-bold tracking-tight text-ink"
            >
              Upcoming events
            </h2>
            <p className="mt-1 text-sm text-muted">
              The next three events on the calendar.
            </p>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-cyan transition-colors hover:text-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
          >
            View all events
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6">
          {status === "loading" && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <EventCardSkeleton key={index} />
              ))}
            </div>
          )}

          {status === "error" && (
            <StatusMessage tone="error">
              {error || "Could not load events."}
            </StatusMessage>
          )}

          {status === "ready" && upcoming.length === 0 && (
            <EmptyState
              icon={CalendarIcon}
              title="No events on the calendar yet"
              description="Add the first event from the admin dashboard and it will appear here instantly."
              action={
                <ButtonLink to="/admin">
                  Add an event
                  <ArrowRightIcon className="h-4 w-4" />
                </ButtonLink>
              }
            />
          )}

          {status === "ready" && upcoming.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} showDetails />
              ))}
            </div>
          )}
        </div>
      </section>

      {status === "ready" && stats && stats.totalRegistrations === 0 && (
        <section className="mt-6">
          <div className="card flex flex-wrap items-center justify-between gap-4 border-dashed p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-graphite text-amber">
                <SparkleIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">
                  Be the first to register
                </p>
                <p className="text-xs text-muted">
                  New registrations show up instantly on the admin dashboard.
                </p>
              </div>
            </div>
            <ButtonLink variant="secondary" to="/events">
              Claim a spot
            </ButtonLink>
          </div>
        </section>
      )}
    </>
  );
}
