# Real Estate CRM

A CRM for sales teams to manage leads, properties and unit bookings.

**Live App:** _add after deployment_
**API Docs (Swagger):** _add after deployment_/docs

## Demo Login

| Role | Email | Password |
|---|---|---|
| Admin | admin@crm.com | Admin@123 |
| Sales Employee | priya@crm.com | Sales@123 |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy, Alembic |
| Database | PostgreSQL (Neon) |
| Auth | JWT with role-based access (Admin / Sales) |
| Deployment | Vercel (frontend), Render (backend), Neon (database) |

## Features

- Lead management: create, edit, search, view
- 7 lead stages: New, Contacted, Site Visit, Interested, Negotiation, Booked, Lost
- Lead assignment, notes and follow-up dates
- Property management: Project > Building > Unit
- Booking flow with double-booking prevention
- Dashboard with leads, follow-ups and bookings
- Role-based access: Admin and Sales Employee

## Project Structure

```
real-estate-crm/
├── backend/
│   └── app/
│       ├── api/routes/   # API endpoints
│       ├── models/       # database tables
│       ├── schemas/      # request/response validation
│       ├── services/     # business logic
│       ├── core/         # config, security, auth guards
│       └── db/           # session, seed data
├── frontend/             # Next.js app
└── docs/                 # ER diagram, screenshots
```

## Local Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows PowerShell
pip install -r requirements.txt
cp .env.example .env           # then fill in values
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload
```

### Frontend
_add after frontend is built_

## Environment Variables

| Variable | Description |
|---|---|
| DATABASE_URL | PostgreSQL connection string |
| SECRET_KEY | Random secret for signing JWT tokens |
| FRONTEND_URL | Allowed frontend origin for CORS |

## Key Decisions

_add at the end_