# OralVis Healthcare

OralVis is a full‑stack web app to upload dental scan images (Technician) and review them with search, filters, and PDF reports (Dentist).

## Features
- Authentication: Email + password with JWT
- Roles: Technician (upload) and Dentist (review)
- Uploads: Cloudinary storage via multer (JPG/PNG, 10MB limit)
- Database: SQLite (better‑sqlite3) with default users
- Dentist tools: Search, filters, image previews, PDF report export
- CORS and environment‑driven configuration

## Tech Stack
- Frontend: React (Vite) + React Router
- Backend: Node.js + Express 5
- DB: SQLite (better‑sqlite3)
- Storage: Cloudinary

## Monorepo Structure
- `backend/` — Express API, routes, DB init, middleware
- `frontend/` — React app (Vite), pages, components, utils

## Prerequisites
- Node.js 18+ (recommended 20+)
- npm 9+

## Environment Variables

Backend (`backend/.env`)
- `PORT=5000`
- `JWT_SECRET=your_jwt_secret_here`
- `DATABASE_PATH=./database/database.db`
- `CLOUDINARY_CLOUD_NAME=...`
- `CLOUDINARY_API_KEY=...`
- `CLOUDINARY_API_SECRET=...`
- `CORS_ORIGIN=http://localhost:5173` (set to Netlify URL in production)

Frontend (`frontend/.env`)
- `VITE_API_URL=http://localhost:5000/api` (set to Render backend URL in production)

Example templates are provided: `backend/.env.example`, `frontend/.env.example`.

## Local Development

1) Backend
- Terminal A
  - `cd backend`
  - `npm install`
  - Initialize DB (creates tables + default users): `node database/init.js`
  - Start dev server: `npm run dev`
  - Health check: `http://localhost:5000/health`

2) Frontend
- Terminal B
  - `cd frontend`
  - `npm install`
  - `npm run dev`
  - App: `http://localhost:5173`

## Default Test Users
- Technician: `technician@oralvis.com` / `technician123`
- Dentist: `dentist@oralvis.com` / `dentist123`

## API Endpoints (summary)
- `POST /api/auth/login` — authenticate and receive JWT
- `POST /api/auth/verify-token` — token validation
- `GET /api/auth/test-users` — development listing
- `POST /api/upload/` — Technician only (multipart form)
- `GET /api/upload/history` — Technician uploads
- `GET /api/scans/` — Dentist only (all scans)
- `GET /api/scans/:id` — Scan by ID
- `GET /api/scans/patient/:patientId` — Scans for patient
- `GET /api/scans/stats` — Stats
- `GET /api/scans/search?query=...&region=...&scanType=...` — Search

## Production Builds
- Backend: `cd backend && npm start`
- Frontend preview: `cd frontend && npm run build && npm run preview`

## Deployment
- Backend: Render (see `render.yaml` and DEPLOYMENT.md)
- Frontend: Netlify (`frontend/netlify.toml`, SPA redirect ready)

## Screenshots
Add images in `screenshots/` to document key flows (login, upload, review, PDF).

## Troubleshooting
- Wildcard routes: Express 5 no longer supports `'*'` in `app.use('*', ...)`. The server uses a catch‑all 404 middleware safely.
- CORS: Ensure `CORS_ORIGIN` matches your frontend origin in production.
- SQLite on Render: A persistent disk is configured in `render.yaml` mounting `backend/database`.

