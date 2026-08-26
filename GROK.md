# HazardWire – Project Memory (GROK.md)

Last updated: 2026-08-26

---

## 1. Project Goal

AI-powered civic hazard reporting for Sri Lanka.

- Public users submit reports without login (private token)
- Worker analyzes text/images, assigns organization, explains decision
- Organizations manage assigned reports

---

## 2. Preferred Coding Style

- Extremely minimal code
- Simple DbResult pattern
- Direct Supabase calls
- Working endpoints over perfect architecture
- AI behind abstraction layer (`src/ai.py`) with provider toggle

---

## 3. Implementation Status

### Core product
1. [x] Schema + RLS
2. [x] Org auth + profile
3. [x] Report submit + token hash + jobs queue
4. [x] Image upload (`new_*`) + thumbnails in UI
5. [x] Public reports + filters
6. [x] My Report (token)
7. [x] Map (light UI)
8. [x] Org dashboard (assigned reports + status update)
9. [x] Public Authorities directory
10. [x] Comments/update history (UI + RLS open for inserts)
11. [x] Clean light UI + auth localStorage

### AI pipeline
12. [x] AI abstraction (`gemini` | `ollama` toggle)
13. [x] Gemini via `google-genai` SDK (`GEMINI_MODEL=gemini-3.6-flash`)
14. [x] Structured analysis: category, severity, authority_type, summary, explanation, priority_score, image_tags
15. [x] Multimodal (text + images) on Gemini
16. [x] Keyword fallback
17. [x] Worker assigns `authority_id` from authority_type
18. [ ] Image privacy pipeline (`new_*` → blur faces/plates → `processed_*`)
19. [ ] Geo-aware routing (Nominatim / road context)
20. [ ] Duplicate / related report detection
21. [ ] Org inbox sort by priority_score

---

## 4. AI Architecture

```
src/ai.py       → analyze_report(title, description, image_urls)
src/worker.py   → orchestration + org assignment
src/images.py   → (next) blur + upload processed
src/geo.py      → (planned) reverse geocode
src/duplicates.py → (planned) nearby similar reports
```

Env:
- AI_PROVIDER=gemini | ollama
- GEMINI_API_KEY, GEMINI_MODEL=gemini-3.6-flash
- OLLAMA_BASE_URL, OLLAMA_MODEL

ai_analysis JSON includes:
category, severity, authority_type, cleaned_description, summary,
explanation, priority_score, image_tags, model

---

## 5. Planned feature order (competition)

1. Image blur pipeline (privacy)
2. Geo-aware routing + explanation
3. Duplicate nearby reports
4. Org inbox priority sorting
5. Later: full RAG, multilingual, advanced plate detection

---

## 6. Key decisions

- Public users = private token (hashed)
- Orgs = Supabase Auth
- Queue = jobs table
- One multimodal Gemini call for analysis (not multi-agent)
- OpenCV/classic CV for blur; LLM for understanding
- Failures never block job completion (fallback + continue)
