Last updated: 2026-08-27

---

## 1. Project Goal (main subject)

AI-powered civic hazard reporting for Sri Lanka.

**Citizen flow**
- Submit a hazard (no login) → get a private access token
- System analyzes report (text + images), protects privacy, assigns the right organization
- Citizen tracks status with the token

**Organization flow**
- Org signs up / signs in
- Sees only assigned reports, updates status, maintains profile (coverage, responsibilities, keywords, laws, …)

**Competition value**
- Useful AI: classification, priority, explanation, org assignment (later: geo, duplicates)
- Not “AI for its own sake” — AI must change routing and transparency

---

## 2. Repo layout
/
src/                 Next.js App Router (UI + most HTTP APIs)
src-fastapi/         Python: worker + AI + image processing (+ optional upload)
prisma/              Prisma 7 schema
prisma.config.ts
GROK.md
textLegacy Vite UI removed / not the source of truth.

---

## 3. Stack split

| Concern | Owner |
|---------|--------|
| UI pages | Next.js |
| Public reports CRUD/list | Next `/api/reports` |
| My report by token | Next `/api/reports/by-token/[token]` |
| Public org directory | Next `GET /api/orgs` |
| Org auth | Supabase Auth (browser) |
| Org profile | Next `/api/orgs/profile` |
| Org assigned reports | Next `/api/orgs/reports` |
| Job queue processing | **Python worker** |
| AI analysis | **Python `ai.py`** |
| Face blur / processed images | **Python `images.py`** |
| Image upload to storage | Prefer Python (or Next later) |

**Do not** proxy all `/api/*` to FastAPI. Next owns org/report HTTP. Python is compute + worker.

---

## 4. Data model (Prisma / Postgres)

### Enums
- `ReportCategory`: ROAD, WATER, IRRIGATION, GARBAGE, ENVIRONMENT, ACCIDENT, CONSTRUCTION, CRIME, GENERAL
- `ReportPriority`: UNKNOWN, LOW, MEDIUM, HIGH, CRITICAL
- `ReportStatus`: PENDING, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED
- `OrgType`: GOVERNMENT, NON_GOVERNMENT

### Organization
Rich profile for better AI routing later:
- identity: name, branch_name, email, org_type, verified, logo/cover
- contact: phones[], address, website, geo
- coverage: coverage_region, coverage_areas[]
- knowledge: responsibilities[], keywords[], reference_links[], compliance[], laws[]

`id` = Supabase `auth.users.id` on signup.

### Report
- Citizen: title, description, lat/lng, contact_*, `public_token_hash`, `raw_image_urls`
- AI/worker: category, priority, status, analysis (JSON), `image_urls` (processed), geo, `org_id`
- Org: comments[]

### Job (thin queue)
- report_id, status (`pending`|`processing`|`done`|`failed`), attempts, locked_at

---

## 5. Implementation status

### Next.js product surface
1. [x] Prisma 7 schema + client (`src/lib/prisma.ts`)
2. [x] App routes: map, reports, submit, my-reports, organizations, orgs (portal)
3. [x] Shared UI: Header, StatusBadge, ReportCard, AuthProvider
4. [x] API: reports list/create, by-token
5. [x] API: orgs public list, profile GET/POST/PUT
6. [x] API: org assigned reports GET, PATCH status
7. [x] Org login via Supabase; dashboard tabs (reports + profile)
8. [x] Naming: “authority” → organization/orgs (URLs + types)
9. [x] Fix: do not rewrite `/api/*` to FastAPI :8000
10. [x] Fix: `getReports` uses `data.results`; `GET /api/orgs/reports/route.ts` exists

### Still rough / polish
- [ ] Image upload in Submit UI (raw_image_urls)
- [ ] Map page fully aligned with new Report fields
- [ ] RLS policies reviewed after schema reset
- [ ] Storage bucket `hazard-images` policies

### Python worker (OUT OF DATE vs new schema) — NEXT FOCUS
11. [x] Older pipeline existed (Gemini, blur, keyword fallback)
12. [ ] **Rewire worker to new schema** (priority not severity, org_id not authority_id, analysis not ai_analysis, enums UPPERCASE)
13. [ ] Job model is thin (only report_id) — load full Report from DB
14. [ ] Assign org using Organization.keywords / responsibilities / coverage (not only authority_type)
15. [ ] Remove leftover FastAPI routes that duplicate Next (orgs/reports HTTP)
16. [ ] Geo-aware routing
17. [ ] Duplicate detection
18. [ ] Org inbox sort by priority_score inside analysis

---

## 6. AI / worker target design
Job pending
→ lock job
→ load Report
→ blur raw_image_urls → upload processed → set image_urls
→ analyze_report(title, description, image_urls, optional geo)
→ map category/priority enums
→ pick Organization (keywords/responsibilities/coverage)
→ update Report: category, priority, analysis, image_urls, org_id, status=ASSIGNED
→ job done | failed
text### `analysis` JSON (stored on Report.analysis)
```json
{
  "summary": "...",
  "explanation": "...",
  "priority_score": 0-100,
  "image_tags": [],
  "privacy": { "blurred": true, "faces": 0 },
  "model": "gemini-..."
}
Env (Python)

AI_PROVIDER=gemini | ollama
GEMINI_API_KEY, GEMINI_MODEL (e.g. gemini-3.6-flash)
SUPABASE_URL, SUPABASE_KEY (service role preferred for worker updates)
OLLAMA_* if local

Coding style (Python)

Minimal
AI behind ai.py abstraction
Worker orchestrates only
Failures: fallback + mark job failed; don’t crash the loop

Item,Rule
Raw upload,"Bucket images_raw (private), path = {uuid}.jpg"
Processed,"Bucket images (public), path = {uuid}.jpg"
Report.raw_image_urls,Storage paths (or private URLs)
Report.image_urls,Public URLs from images
Report.geo / Organization.geo,Same JSON shape (below)
Enums in DB,"ROAD, HIGH, ASSIGNED, …"
