# Estate CRM

A small Real Estate CRM where a sales team manages leads, properties and unit bookings, built end to end (UI, API, database, deployment).

| | |
|---|---|
| **Live app** | https://real-estate-crm-one-lake.vercel.app/login |
| **API docs (Swagger)** | https://real-estate-crm-8m9l.onrender.com/docs |
| **Repository** | https://github.com/deepak-rm-debug/real-estate-crm |

> The API runs on a free Render instance and sleeps when idle. If the first request is slow, wait up to a minute for it to wake up.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@crm.com | Admin@123 |
| Sales employee | priya@crm.com | Sales@123 |

These are seeded demo accounts for evaluation only.

## What it does

**Required features**
- **Leads:** create, edit, search, filter, view. Seven stages: New, Contacted, Site Visit, Interested, Negotiation, Booked, Lost.
- **Assignment:** admins assign leads to sales employees. Notes and follow-up dates per lead.
- **Properties:** Project > Building > Unit with price, type, area and availability.
- **Booking flow:** book an available unit for a lead, cancel a booking and release the unit.
- **No double booking:** two users cannot book the same unit (see decision 2).
- **Dashboard:** leads by stage, follow-ups (today and overdue), bookings, inventory.
- **Roles:** Admin and Sales Employee with different permissions.

**Beyond the requirements**
- **Lead health score:** Hot / Warm / Cold badge from simple rules (stage, follow-up urgency, recent activity, budget). The reasons are shown, and a "Call these first" list ranks open leads.
- **Smart property matching:** on a lead, shows available units that fit the budget (up to 10% over) and preferred type, with one-click booking.
- **Lost reasons:** marking a lead Lost asks why, feeding an admin Insights page.
- **Insights (admin):** lead source conversion, lost-reason breakdown, sales scorecard.
- **Availability grid:** floor-wise visual of available, held and booked units; click a free unit to book it.
- **Activity timeline** per lead (stage changes, assignments, notes, bookings).
- **Duplicate detection** by phone number.
- **Global search** (Ctrl+K), notification bell, collapsible-on-hover sidebar, responsive layouts, loading / empty / error states.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query |
| Backend | FastAPI, SQLAlchemy 2, Alembic, Pydantic |
| Database | PostgreSQL (Neon) |
| Auth | JWT access token + rotating refresh token, bcrypt password hashing |
| Hosting | Vercel (frontend), Render (API), Neon (database) |

## Key decisions

**1. PostgreSQL instead of a document database.**
The core of this product is relational (project > building > unit, lead > booking > unit) and the hardest rule is a consistency rule: a unit must never be booked twice. Foreign keys, transactions, row locks and partial unique indexes make that enforceable in the database itself.

**2. Double booking is prevented in two layers.**
(a) The booking endpoint locks the unit row (`SELECT ... FOR UPDATE`), checks it is still available, then creates the booking, marks the unit booked and moves the lead to Booked in one transaction. A second user waits for the lock, then gets a clear 409. (b) A partial unique index (`UNIQUE (unit_id) WHERE status = 'active'`) is the last line of defence, so even a bug in application code cannot create two active bookings. Cancelled bookings are excluded, so a unit can be rebooked after a cancellation.

**3. Permissions are enforced in the API, not only in the UI.**
Sales users only ever see leads assigned to them (list, search, detail, bookings, dashboard and analytics all apply the same rule). Requesting someone else's lead returns 404 rather than 403 so its existence is not revealed. Reassigning leads, editing inventory and the Insights page are admin only. The UI hides those controls, but the server is the source of truth.

**4. A lead becomes "Booked" only through the booking flow.**
Letting people drag a lead to Booked by hand would allow a "Booked" lead with no unit behind it. The stage can only be set by creating a booking, and cancelling a booking returns the lead to Negotiation and frees the unit. A lead also cannot leave Booked while it has an active booking. Lost requires a reason.

**5. Short-lived access tokens with rotating refresh tokens.**
Access tokens last 30 minutes. Refresh tokens are random values stored hashed (SHA-256) in the database, rotated on every use, and revoked on logout. Reusing an already-rotated token is treated as theft and revokes all sessions for that user. The frontend refreshes silently on a 401 and retries the request once, with a single in-flight refresh so parallel requests do not trip reuse detection. Trade-off: tokens are kept in localStorage because the frontend and API are on different domains, where cross-site cookies are unreliable. In a same-domain production setup I would use httpOnly cookies.

## Lead health score (rules)

Open leads (not Booked or Lost) get a score:

| Signal | Effect |
|---|---|
| Stage | New +10, Contacted +20, Site Visit +40, Interested +55, Negotiation +70 |
| Follow-up | Due within 3 days +10, overdue -10, overdue more than 3 days -20, none -5 |
| Last update | Within 2 days +15, more than 7 days idle -15 |
| Budget known | +10 |

Score 65 or more is Hot, 35 or more is Warm, otherwise Cold. It is deliberately rule-based so the reasons can be shown to the user.

## Database overview

```mermaid
erDiagram
    users ||--o{ leads : "assigned_to / created_by"
    users ||--o{ lead_notes : writes
    users ||--o{ lead_activities : performs
    users ||--o{ bookings : "booked_by"
    users ||--o{ refresh_tokens : owns
    projects ||--o{ buildings : has
    buildings ||--o{ units : has
    leads ||--o{ lead_notes : has
    leads ||--o{ lead_activities : has
    leads ||--o{ bookings : has
    units ||--o{ bookings : "booked via"

    users {
        int id PK
        string email UK
        string role "admin or sales"
        bool is_active
    }
    leads {
        int id PK
        string phone
        enum stage
        int assigned_to FK
        date follow_up_date
        string lost_reason
        string preferred_type
    }
    projects {
        int id PK
        string name UK
        string location
    }
    buildings {
        int id PK
        int project_id FK
        string name
    }
    units {
        int id PK
        int building_id FK
        string unit_number
        string type
        numeric price
        enum status "available, held, booked"
    }
    bookings {
        int id PK
        int lead_id FK
        int unit_id FK
        numeric amount
        enum status "active or cancelled"
    }
```

Notable constraints: `units (building_id, unit_number)` is unique; `bookings (unit_id)` is unique where `status = 'active'`; `users.email` is unique. Indexes cover phone, stage, assignee, follow-up date and unit status for search, kanban-style filters and the dashboard.

## API overview

Full interactive documentation: `/docs` (Swagger). All endpoints except login, refresh and health need `Authorization: Bearer <token>`.

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/login`, `/refresh`, `/logout`, `GET /api/auth/me` |
| Leads | `GET/POST /api/leads`, `GET/PUT /api/leads/{id}`, `PATCH /{id}/stage`, `PATCH /{id}/assign` (admin), `POST /{id}/notes`, `GET /{id}/matches` |
| Properties | `GET/POST /api/projects` (admin to create), `GET/POST /api/projects/{id}/buildings`, `GET /api/units`, `POST /api/buildings/{id}/units`, `PUT/DELETE /api/units/{id}` (admin) |
| Bookings | `GET/POST /api/bookings`, `POST /api/bookings/{id}/cancel` |
| Dashboard | `GET /api/dashboard` |
| Insights | `GET /api/analytics` (admin) |
| Search | `GET /api/search?q=` |
| Users | `GET /api/users/sales` (admin) |
| Health | `GET /health` |

Errors use consistent status codes: 401 not signed in, 403 not allowed, 404 not found or not yours, 409 conflict (duplicate phone, unit already booked), 422 validation.

## Project structure

```
real-estate-crm/
├── backend/
│   ├── app/
│   │   ├── api/routes/     # endpoints
│   │   ├── models/         # SQLAlchemy tables
│   │   ├── schemas/        # request/response validation
│   │   ├── services/       # business rules (health score)
│   │   ├── core/           # config, security, auth dependencies
│   │   └── db/             # session, seed scripts
│   └── alembic/            # migrations
└── frontend/
    └── src/
        ├── app/            # pages
        ├── components/     # reusable UI, layout, feature components
        ├── hooks/          # shared hooks
        └── lib/            # API client, auth, formatting, types
```

## Run locally

Requirements: Python 3.11+, Node 20+, a PostgreSQL database (a free Neon database works).

**Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env           # then fill in the values below
alembic upgrade head           # creates the tables
python -m app.db.seed          # demo users, projects, units, leads
python -m app.db.seed_demo     # optional: more leads, bookings, notes
python -m app.db.patch_demo    # optional: preferred types and lost reasons
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
npm run dev
```
Open http://localhost:3000.

**Environment variables (backend/.env)**

| Variable | Description |
|---|---|
| `DATABASE_URL` | e.g. `postgresql+psycopg2://user:password@host/dbname?sslmode=require` |
| `SECRET_KEY` | Long random string used to sign tokens |
| `FRONTEND_URL` | Allowed frontend origin for CORS, e.g. `http://localhost:3000` |

## Known limitations and next steps

- Tokens are stored in localStorage (see decision 5); httpOnly cookies are the next hardening step on a shared domain.
- Unit "held" status is supported in the data model and shown in the UI, but there is no hold-with-expiry workflow yet. That would need a background job.
- No automated test suite yet. The booking concurrency rule is the first thing I would cover.
- The free Render instance sleeps when idle, so the first request after a quiet period is slow.