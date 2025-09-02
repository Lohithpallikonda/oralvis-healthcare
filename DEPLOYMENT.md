# Deployment Guide

This guide covers deploying the OralVis Healthcare app with:
- Backend: Render (Node Web Service)
- Frontend: Netlify (Static Site)

## 1) Prepare Repository
- Ensure `render.yaml` exists at the repo root.
- Ensure `frontend/netlify.toml` exists with SPA redirect.
- Do not commit `.env` files. Templates exist at:
  - `backend/.env.example`
  - `frontend/.env.example`

## 2) Deploy Backend to Render
1. Push the repository to GitHub.
2. Render Dashboard → New → Blueprint → pick your GitHub repo.
3. Review the service from `render.yaml`:
   - `rootDir: backend`
   - `buildCommand: npm install`
   - `startCommand: node database/init.js && node server.js`
   - `healthCheckPath: /health`
   - Disk mounted at `/opt/render/project/src/backend/database` (for SQLite persistence)
4. Set environment variables (Service → Environment):
   - `NODE_VERSION = 20`
   - `JWT_SECRET = <strong random string>`
   - `CLOUDINARY_CLOUD_NAME = <your value>`
   - `CLOUDINARY_API_KEY = <your value>`
   - `CLOUDINARY_API_SECRET = <your value>`
   - `CORS_ORIGIN = http://localhost:5173` (switch to Netlify URL after frontend deploy)
5. Deploy. First boot runs DB init and creates default users.
6. Validate:
   - Open your Render URL
   - `GET /health` returns status: healthy
   - `POST /api/auth/login` with dentist credentials returns a token

## 3) Deploy Frontend to Netlify
Option A — Git (recommended)
1. Netlify Dashboard → Add new site → Import an existing project → GitHub repo.
2. Build command: `npm run build`
3. Publish directory: `frontend/dist` (or set Base directory to `frontend`, Publish to `dist`).
4. Environment Variables:
   - `VITE_API_URL = https://<your-render-service>.onrender.com/api`
5. Deploy. Copy the site URL, e.g., `https://your-site.netlify.app`.

Option B — Drag‑and‑drop
1. Locally: `cd frontend && VITE_API_URL=... npm run build` (or set in `frontend/.env`).
2. Drag the `frontend/dist/` folder to https://app.netlify.com/drop.

## 4) Update CORS
- In Render (backend service), update `CORS_ORIGIN` to the Netlify URL.
- Redeploy backend.

## 5) End‑to‑End Test (Production)
- Login as Technician, upload a scan.
- Login as Dentist, verify scans listing, search/filters, and PDF report download.

## Trouble‑shooting
- 401/403 from frontend: confirm `VITE_API_URL` is correct and token stored; check CORS on backend.
- Cloudinary errors: verify credentials in Render.
- 404 on page refresh: ensure Netlify SPA redirect exists in `frontend/netlify.toml`.

