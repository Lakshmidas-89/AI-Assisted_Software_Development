# CampusConnect — Full-Stack App

A working version of the CampusConnect campus event app: a React single-page
frontend backed by a Flask REST API and SQLite.

It implements the Session 3 requirements: browse events, register once per
event, see live admin statistics, and add or delete events.

## Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Frontend | React 18, React Router 6, Vite 5, Tailwind CSS 3 |
| Backend  | Flask 3, Flask-CORS                             |
| Database | SQLite through Python's built-in `sqlite3`      |
| Tests    | pytest (API tests)                              |

## Project structure

```text
campusconnect/
├── backend/
│   ├── app.py             # Application factory and server entry point
│   ├── api.py             # REST endpoints
│   ├── db.py              # SQLite connection, schema and teardown
│   ├── seed.py            # Five starter events
│   ├── validation.py      # Server-side validation rules
│   ├── serializers.py     # Row-to-JSON helpers
│   ├── config.py          # App and test configuration
│   ├── requirements.txt
│   └── tests/
│       ├── conftest.py
│       └── test_api.py
└── frontend/
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vite.config.js
    └── src/
        ├── api.js
        ├── App.jsx
        ├── main.jsx
        ├── globals.css       # Design tokens and shared component classes
        ├── components/
        │   ├── EventCard.jsx
        │   ├── Icons.jsx
        │   ├── Layout.jsx    # Sidebar + top bar shell
        │   └── ui.jsx        # Buttons, cards, badges, fields, states
        └── pages/
            ├── AdminPage.jsx
            ├── EventsPage.jsx
            └── HomePage.jsx
```

## Design system

The interface uses a high-contrast "Dark Obsidian" theme:

- Canvas `#09090B`, elevated surfaces `#121215`, interactive surfaces `#1C1C21`
- Structural borders `#27272A`, focus/active borders `#F59E0B`
- Primary text `#FAFAFA`, muted text `#A1A1AA`, placeholders `#52525B`
- Primary action amber `#F59E0B` with jet-black text; data accent cyan `#06B6D4`
- Semantic statuses: success `#10B981`, warning/amber `#F59E0B`, danger `#F43F5E`
- Plus Jakarta Sans for UI text, JetBrains Mono for IDs, dates, and metrics
- All tokens live as RGB CSS variables in `src/globals.css` and are mapped into
  `tailwind.config.js`, so opacity modifiers such as `bg-amber/20` stay on-palette.

Layout, buttons, inputs, badges, tables, skeletons, empty states, and the
accessible confirmation dialog all consume the same `ui.jsx` primitives and
token classes.

## Prerequisites

- Python 3.10+
- Node.js 18+ and npm

## Run the backend

```bash
cd campusconnect/backend

# Windows
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python app.py

# macOS / Linux
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python app.py
```

The API runs at `http://localhost:5000`. The database file is created at
`backend/instance/campusconnect.db` and seeded with five upcoming events the
first time it is created. Seeding happens once: if every event is deleted, the
demo data is not restored on the next restart.

## Run the frontend

```bash
cd campusconnect/frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

To point at a different API, copy `.env.example` to `.env` and set:

```text
VITE_API_URL=http://localhost:5000/api
```

## API

| Method | Path                     | Purpose                                   |
|--------|--------------------------|-------------------------------------------|
| GET    | `/api/health`            | Health check                              |
| GET    | `/api/events`            | List events with registration counts      |
| POST   | `/api/events`            | Add an event (`title`, `date`, `venue`; optional `time`, `category`, `description`) |
| DELETE | `/api/events/<id>`       | Delete an event and its registrations     |
| GET    | `/api/registrations`     | List registrations with event titles      |
| POST   | `/api/registrations`     | Register for an event                     |
| GET    | `/api/stats`             | Totals and per-event participant counts   |

Validation failures return `400` with `{ "error": ..., "fields": { ... } }`.
A duplicate USN for the same event returns `409`.

## Tests

```bash
cd campusconnect/backend
.venv\Scripts\python -m pytest -q      # Windows
.venv/bin/python -m pytest -q          # macOS / Linux
```

The suite covers seeded events, registration, case-insensitive duplicate
prevention, invalid and malformed input, field length limits, impossible dates,
event creation/deletion, cascade deletion, one-time seeding, and statistics.

## How features map to the workshop requirements

- **Events render from one source of truth** — SQLite, exposed by `GET /api/events`.
- **Registration validation** — client-side in `EventsPage.jsx`, repeated on the server in `validation.py`.
- **Persistence** — registrations survive restarts in `instance/campusconnect.db`.
- **No duplicate registration** — enforced in `api.py` and by a `UNIQUE (event_id, usn)` constraint.
- **Admin dashboard** — live counts and participants from `GET /api/stats` and `GET /api/registrations`.
- **Add/delete events** — `POST /api/events` and `DELETE /api/events/<id>`; the admin form accepts an optional time, and registrations cascade on delete.
- **Empty states** — shown when there are no events or no participants.

## Notes

- The static workshop wireframe remains in `../starter-app/` and is untouched.
- The Flask development server is for local development only. For production,
  run it behind a WSGI server and serve the built frontend (`npm run build`).
- CORS allows `http://localhost:5173` and `http://127.0.0.1:5173` by default.
  Set `FRONTEND_ORIGIN` (comma-separated) to add more origins.
