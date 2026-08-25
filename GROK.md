# HazardWire – Project Memory (GROK.md)

Last updated: 2026-08-25

---

## 1. Project Goal

AI-powered civic hazard reporting platform for Sri Lanka.

- Public users submit reports without login (private token)
- Worker analyzes and assigns organization
- Organizations manage assigned reports

---

## 2. Preferred Coding Style

- Extremely minimal code
- Simple `DbResult(status, result)` pattern
- Direct Supabase calls
- Working endpoints over perfect architecture

---

## 3. Implementation Status

1. [x] Clean schema + RLS
2. [x] Organizations auth (signup/signin/profile)
3. [x] Report submission + token hashing + job creation
4. [x] Image upload (`new_<uuid>`) + thumbnails
5. [x] Worker (keyword analysis + authority_id assignment)
6. [x] Frontend token UX + My Report page
7. [x] Public Reports list + filters
8. [x] Clean light UI (top navbar)
9. [x] Auth persistence via localStorage
10. [x] Organization dashboard (assigned reports + profile)
11. [x] Map page (light theme)
12. [ ] Public Authorities directory page
13. [ ] Comments / update history UI
14. [ ] Real LLM analysis
15. [ ] Image blurring (faces / plates)

---

## 4. Key Decisions

- Public users = private token (hashed in DB)
- Organizations = Supabase Auth
- Queue = simple `jobs` table
- AI = keyword matching for now
- UI = clean light theme, top navigation
- Worker assigns `authority_id` by matching `authority_type`

---

## 5. Known Small Issues

- Comments/history skipped (RLS friction)
- Org report update uses query params
- No real LLM yet
