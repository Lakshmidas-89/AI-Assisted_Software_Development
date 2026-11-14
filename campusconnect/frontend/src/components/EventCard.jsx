import { Link } from "react-router-dom";

import {
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  PinIcon,
  UsersIcon,
} from "./Icons.jsx";
import { Badge, Skeleton } from "./ui.jsx";

export function formatDate(isoDate) {
  if (!isoDate) {
    return "";
  }

  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) {
    return isoDate;
  }

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="inline-flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4 text-cyan" />
        {label}
      </dt>
      <dd className="text-right font-mono text-xs tabular-nums text-ink">
        {children}
      </dd>
    </div>
  );
}

export default function EventCard({
  event,
  showDetails = false,
  action = null,
  className = "",
}) {
  return (
    <article className={`card card-hover group flex h-full flex-col p-6 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        {event.category ? (
          <Badge tone="cyan">{event.category}</Badge>
        ) : (
          <span />
        )}
        {typeof event.registrationCount === "number" && (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums text-muted">
            <UsersIcon className="h-3.5 w-3.5" />
            {event.registrationCount}
          </span>
        )}
      </div>

      <h3 className="mt-4 text-lg font-semibold tracking-tight text-ink">
        {event.title}
      </h3>

      {event.description && (
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {event.description}
        </p>
      )}

      {showDetails && (
        <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
          <DetailRow icon={CalendarIcon} label="Date">
            {formatDate(event.date)}
          </DetailRow>
          {event.time && (
            <DetailRow icon={ClockIcon} label="Time">
              {event.time}
            </DetailRow>
          )}
          <DetailRow icon={PinIcon} label="Venue">
            {event.venue}
          </DetailRow>
        </dl>
      )}

      <div className="mt-auto pt-5">
        {action ?? (
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-cyan transition-colors hover:text-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
          >
            View &amp; register
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </article>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-4 w-10" />
      </div>
      <Skeleton className="mt-5 h-6 w-3/4" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <Skeleton className="mt-6 h-4 w-1/2" />
    </div>
  );
}
