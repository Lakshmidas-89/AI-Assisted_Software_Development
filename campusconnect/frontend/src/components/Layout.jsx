import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import {
  CalendarIcon,
  ChartIcon,
  CloseIcon,
  HomeIcon,
  MenuIcon,
  SparkleIcon,
} from "./Icons.jsx";
import { Badge } from "./ui.jsx";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Overview",
    description: "Discover events",
    icon: HomeIcon,
    end: true,
  },
  {
    to: "/events",
    label: "Events",
    description: "Browse & register",
    icon: CalendarIcon,
  },
  {
    to: "/admin",
    label: "Admin",
    description: "Manage & track",
    icon: ChartIcon,
  },
];

const PAGE_TITLES = {
  "/": "Overview",
  "/events": "Events",
  "/admin": "Admin dashboard",
};

function SidebarLink({ item }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-graphite text-ink"
            : "text-muted hover:bg-graphite/60 hover:text-ink"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-amber" />
          )}
          <Icon
            className={`h-5 w-5 shrink-0 ${
              isActive ? "text-amber" : "text-muted group-hover:text-ink"
            }`}
          />
          <span className="flex min-w-0 flex-col">
            <span>{item.label}</span>
            <span className="truncate text-[11px] font-normal text-muted">
              {item.description}
            </span>
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? "CampusConnect";

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-amber focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-canvas"
      >
        Skip to content
      </a>

      <button
        type="button"
        aria-label="Close navigation"
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 z-30 cursor-default bg-canvas/80 backdrop-blur-sm transition-opacity lg:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        tabIndex={sidebarOpen ? 0 : -1}
      />

      <aside
        aria-label="Sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "invisible -translate-x-full lg:visible"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber text-canvas shadow-glow">
              <SparkleIcon className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-extrabold tracking-tight text-ink">
                CampusConnect
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
                Event operating system
              </span>
            </span>
          </Link>
          <button
            type="button"
            className="btn-icon h-9 w-9 lg:hidden"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
            Workspace
          </p>
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="border-t border-line p-4">
          <div className="rounded-xl border border-line bg-canvas/60 p-4">
            <div className="flex items-center gap-2 text-cyan">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_rgb(var(--cyan))]" />
              </span>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]">
                System online
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Session 3 demo · Flask API + React
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-canvas/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="btn-icon lg:hidden"
                aria-label="Open navigation"
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen(true)}
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber text-canvas lg:hidden">
                <SparkleIcon className="h-4 w-4" />
              </span>
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <span className="hidden text-muted sm:inline">Workspace</span>
                <span className="hidden text-line-strong sm:inline">/</span>
                <span className="truncate font-semibold text-ink">{title}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden font-mono text-xs tabular-nums text-muted md:inline">
                {today}
              </span>
              <Badge tone="cyan" className="hidden sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                Live data
              </Badge>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 py-6 focus:outline-none sm:px-6 lg:px-8 lg:py-10"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
