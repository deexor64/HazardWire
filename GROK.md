# HazardWire – Project Memory (grok.md)

Last updated: 2026-08-23

---

## 1. Project Goal

AI-powered civic hazard reporting platform for Sri Lanka.

- Normal users submit hazard reports **without authentication**.
- Frontend generates a private token → user must save it.
- Backend receives report + enqueues it.
- Python worker runs AI pipeline:
  - Analyzes report
  - Fills missing fields
  - Blurs sensitive data in images (faces, number plates)
  - Assigns correct organization
- Organizations (authenticated) can view assigned reports and update status + comments.

---

## 2. Preferred Coding Style (Strict)

- Extremely minimal code
- No heavy validation / Pydantic models beyond basic request bodies
- No fancy response codes or error hierarchies
- Simple `DbResult(status: bool, result: Any)` pattern
- Direct Supabase calls
- Prefer readability and working endpoints over perfection
- Keep functions short and flat
- Avoid over-engineering

---

## 3. Architecture Overview
Frontend (Vite + React)
↓
FastAPI (thin API layer)
↓
Supabase
├── Auth (Organizations only)
├── Postgres (reports, organizations, jobs, report_updates)
├── Storage (images: new_* → processed_*)
└── Queue (jobs table)
Python Worker (separate process)
↓ (polls jobs)
AI Pipeline → updates reports
text---

## 4. Database Schema (Minimal)

### organizations
- id (uuid, PK, references auth.users)
- email, name, authority_type, description, phone, address, website
- verified (bool, default false)
- created_at, updated_at

### reports
- id (uuid, PK)
- public_token_hash (text, unique)
- title, description, category, severity
- status (default 'pending')
- latitude, longitude
- authority_id (FK → organizations)
- contact_email, contact_phone
- media_urls (text[])          -- processed images
- raw_media_urls (text[])      -- original new_* images
- ai_analysis (jsonb)
- submitted_at, analyzed_at, updated_at

### jobs
- id (bigserial)
- report_id (FK)
- payload (jsonb)
- status ('pending' | 'processing' | 'done' | 'failed')
- attempts, locked_at, created_at

### report_updates
- id, report_id, organization_id, status, comment, created_at

---

## 5. Status Lifecycle

pending → analyzing → assigned → in_progress → resolved → closed
                 ↘ failed

---

## 6. Image Rules

- Upload: `new_<uuid>`
- After AI: `processed_<uuid>`
- Keep both for now

---

## 7. Implementation Order

1. [x] Clear old Supabase data
2. [x] Apply new schema + basic RLS
3. [x] Fix Organizations (signup / signin / profile)
4. [x] Report submission (token hash + enqueue)
5. [x] Basic worker skeleton
6. [x] Image upload
7. [x] AI Pipeline (partial; skipped for now)
8. [x] Frontend token UX + My Reports
9. [ ] Organization portal

---

## 8. Decision Log

- 2026-08-22: Start with clean schema (Option A)
- Coding style: minimal
- Queue: simple jobs table
- Auth: Organizations only

- 2026-08-23: New (Option A)
- 