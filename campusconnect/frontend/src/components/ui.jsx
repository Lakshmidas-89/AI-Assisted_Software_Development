import { forwardRef, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

import {
  AlertIcon,
  CheckIcon,
  InboxIcon,
  SparkleIcon,
} from "./Icons.jsx";

const buttonVariants = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger",
  ghost: "btn-ghost",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`btn ${buttonVariants[variant] ?? buttonVariants.secondary} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({ variant = "primary", className = "", ...props }) {
  return (
    <Link
      className={`btn ${buttonVariants[variant] ?? buttonVariants.secondary} ${className}`}
      {...props}
    />
  );
}

const badgeTones = {
  neutral: "border-line bg-graphite/60 text-muted",
  amber: "border-amber/30 bg-amber/[0.12] text-amber",
  cyan: "border-cyan/30 bg-cyan/[0.12] text-cyan",
  success: "border-success/30 bg-success/[0.12] text-success",
  danger: "border-danger/30 bg-danger/[0.12] text-danger",
};

export function Badge({ tone = "neutral", className = "", children }) {
  return (
    <span className={`badge ${badgeTones[tone] ?? badgeTones.neutral} ${className}`}>
      {children}
    </span>
  );
}

export const Card = forwardRef(function Card(
  { className = "", ...props },
  ref
) {
  return <div ref={ref} className={`card ${className}`} {...props} />;
});

export function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-amber">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  badge,
  badgeTone = "cyan",
  loading = false,
}) {
  return (
    <Card className="card-hover p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-graphite text-cyan">
          <Icon className="h-5 w-5" />
        </span>
        {badge && <Badge tone={badgeTone}>{badge}</Badge>}
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-2 h-9 w-20" />
      ) : (
        <p className="mt-1 font-mono text-3xl font-bold tabular-nums tracking-tight text-ink">
          {value}
        </p>
      )}
    </Card>
  );
}

const statusStyles = {
  success: {
    className: "border-success/30 bg-success/[0.08] text-success",
    icon: CheckIcon,
  },
  error: {
    className: "border-danger/30 bg-danger/[0.08] text-danger",
    icon: AlertIcon,
  },
  info: {
    className: "border-cyan/30 bg-cyan/[0.08] text-cyan",
    icon: SparkleIcon,
  },
};

export function StatusMessage({ tone = "info", children }) {
  const style = statusStyles[tone] ?? statusStyles.info;
  const Icon = style.icon;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium ${style.className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

const dialogTones = {
  danger: {
    icon: "border-danger/30 bg-danger/[0.12] text-danger",
    button: "btn-danger",
  },
  primary: {
    icon: "border-amber/30 bg-amber/[0.12] text-amber",
    button: "btn-primary",
  },
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busyLabel = "Working…",
  tone = "danger",
  busy = false,
  icon: Icon = AlertIcon,
  onConfirm,
  onCancel,
}) {
  const panelRef = useRef(null);
  const cancelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  // Keep the latest callbacks without re-running the focus effect on every render.
  const handlers = useRef({ onConfirm, onCancel });
  handlers.current = { onConfirm, onCancel };
  const flags = useRef({ busy });
  flags.current = { busy };

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previouslyFocused = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => cancelRef.current?.focus(), 20);

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        if (!flags.current.busy) {
          event.preventDefault();
          handlers.current.onCancel?.();
        }
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusables = Array.from(
        panelRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

      if (focusables.length === 0) {
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
      window.clearTimeout(focusTimer);
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const toneStyle = dialogTones[tone] ?? dialogTones.danger;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6">
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-fade-in bg-canvas/80 backdrop-blur-md"
        onClick={() => {
          if (!busy) {
            handlers.current.onCancel?.();
          }
        }}
      />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative w-full max-w-md animate-pop-in rounded-xl border border-line bg-surface p-6 shadow-[0_32px_90px_-40px_rgba(0,0,0,1)] sm:p-7"
      >
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full border ${toneStyle.icon}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <h2
          id={titleId}
          className="mt-4 text-lg font-bold tracking-tight text-ink"
        >
          {title}
        </h2>
        {description && (
          <p
            id={descriptionId}
            className="mt-2 text-sm leading-relaxed text-muted"
          >
            {description}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={() => handlers.current.onCancel?.()}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${toneStyle.button}`}
            disabled={busy}
            onClick={() => handlers.current.onConfirm?.()}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function EmptyState({
  icon: Icon = InboxIcon,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface px-6 py-14 text-center ${className}`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-graphite text-cyan">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function TextField({
  id,
  label,
  error,
  hint,
  className = "",
  inputClassName = "",
  ...props
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`input ${
          error
            ? "border-danger hover:border-danger focus:border-danger focus-visible:ring-danger/40"
            : ""
        } ${inputClassName}`}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function SelectField({
  id,
  label,
  error,
  hint,
  className = "",
  children,
  ...props
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`input ${
          error
            ? "border-danger hover:border-danger focus:border-danger focus-visible:ring-danger/40"
            : ""
        }`}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextareaField({
  id,
  label,
  error,
  hint,
  className = "",
  rows = 3,
  ...props
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`input resize-y ${
          error
            ? "border-danger hover:border-danger focus:border-danger focus-visible:ring-danger/40"
            : ""
        }`}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
