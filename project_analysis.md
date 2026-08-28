# HazardWire — Competition readiness analysis

This is based on the current tree: Next.js product surface, Prisma schema, Python worker (`ai` / `geo` / `images` / `worker`), and the gap between **README ambition** and **what ships today**.

---

## 1. What you already have (real strengths)

Do not undersell this. For a student/competition build, the spine is solid:

| Strength | Why judges care |
|----------|------------------|
| **Clear problem** | Jurisdiction fragmentation in Sri Lanka is a credible civic problem |
| **Anonymous citizen path** | Token-based submit + track without forcing login |
| **End-to-end pipeline** | Submit → job → AI → assign org → org updates status/comments |
| **Hybrid architecture** | Next for product HTTP; Python for AI/images — sensible split |
| **Rich org profile** | keywords, coverage, laws, geo — designed for smarter routing |
| **Privacy intent** | Raw private bucket + face blur → public images |
| **Transparency** | Public map/list, assigned org visible, comments as public updates |
| **Working product UX** | Submit map, reports filters, Assigned to Me, org profile, org directory filters |

You are past “toy CRUD”. You have a **dispatcher loop**. That is the core story.

---

## 2. The honest gap: README vs reality

Your **README** promises:

- RAG over authority mandates (RDA vs local roads, NWSDB, CEB…)
- Vector DB of jurisdiction rules  
- Road **class** from OSM (A/B vs local)  
- Duplicate / multi-hazard detection nearby  
- Structured routing that feels “legal + geographic”

What you **actually** have:

- LLM (or keyword fallback) on title/description (+ optional images + Nominatim place names)
- Heuristic org scoring (keyword overlap + haversine to org HQ)
- No vector store, no mandate corpus, no road classification pipeline

For a competition, that gap is the main risk: judges who read the README will ask *“where is the RAG?”* If you cannot show it, either **build a minimal RAG slice** or **rewrite the story to match the product**.

---

## 3. Missing features (competition-impact ordered)

### Tier A — high impact / still missing

1. **Jurisdiction knowledge (RAG or structured rules)**  
   Without this, assignment is “fuzzy keywords + distance”. One demo with wrong org hurts credibility.  
   *Minimum viable:* 10–20 short markdown rules (RDA / MC / NWSDB / CEB / police) + embed in Postgres `pgvector` or even keyword+LLM ranking over retrieved chunks.

2. **Road / place context beyond reverse geocode**  
   Nominatim `display_name` helps; **road class / highway tag** from OSM (Overpass or Nominatim extras) is what your README sold.

3. **Duplicate / near-duplicate detection**  
   Same pothole 20 times destroys trust.  
   *MVP:* same category + within ~200–500 m + open status → link or reject as duplicate.

4. **Demo-ready “AI evidence” UI**  
   Show on report detail: category, priority, **explanation**, match keywords, assigned org **why** (distance + keyword hits). Today analysis is only partly surfaced.

5. **Seed data for Sri Lanka**  
   5–10 realistic orgs (RDA, a municipal council, NWSDB, CEB, police) with geo, keywords, responsibilities. Judges cannot evaluate routing on empty profiles.

6. **Org verification / trust**  
   `verified` is read-only but there is no admin flow. Unverified orgs equal to RDA is a product/safety issue for a civic story.

### Tier B — important product gaps

7. **Structured comments / timeline**  
   `comments: String[]` has no author, time, or status change log. Competition systems usually show an **audit trail** (“Org X set IN_PROGRESS”).

8. **Notifications**  
   Email/SMS to org on assign; optional email if citizen left contact. Even “mailto” or Resend one-shot helps the story.

9. **Reassign UX on reports detail**  
   API may support it; product should make “wrong inbox” recoverable.

10. **Reports filters (Phase C)**  
    Priority, org, date range — expected on any ops dashboard.

11. **Org directory at scale**  
    Client-side filter over full list; needs server `q` + `org_type` + pagination if you claim production readiness.

12. **Citizen token UX**  
    Lose token = lose access. Add optional contact email “magic link” or “send token to email” — even if optional.

### Tier C — polish / engineering

13. Rate limit submit + upload  
14. Tests (API + worker job happy path)  
15. CI, deploy docs, one-command demo  
16. Plate blur (still stubbed)  
17. Job lock is not atomic (two workers can race)  
18. Metrics page: open/resolved counts, median time-to-assign (great for slides)

---

## 4. Concrete issues / bugs in current code

| Issue | Severity | Notes |
|-------|----------|--------|
| **`ELECTRICITY` → `GENERAL` in `ai.py` aliases** | High | Explicitly maps electricity to GENERAL — wrong for CEB story |
| **AI category list omits ELECTRICITY/ANIMALS in prompt vs schema** | Medium | Prompt categories incomplete vs Prisma enums |
| **Job locking** | Medium | Read attempts → update status is not compare-and-swap |
| **Failed jobs never retry** | Medium | `failed` is terminal |
| **Org scoring threshold arbitrary** | Medium | `best_score < 5` → unassigned; hard to explain |
| **Comments not attributable** | Medium | No org name/timestamp |
| **Public list shows all reports** | Policy | Including contact fields if ever selected — audit API selects |
| **GROK.md / README outdated** | Process | Judges/docs drift; README still Vite + full RAG |
| **Auth in localStorage** | Medium | XSS risk; acceptable for demo if disclosed |
| **Service role in worker** | OK if server-only | Ensure never in Next public env |
| **Haar face cascade quality** | Low | Fine for demo; note limitations |
| **No worker health / dead-letter UI** | Low | Ops blind spot |

---

## 5. Frontend assessment

**Good:** clear routes, calm UI, token gate on submit, map pin, image upload path, Assigned to Me, org profile richness, directory search/type filter.

**Weak for competition polish:**

- Little **storytelling of AI** on the public report (explanation, confidence, routing reason)
- Map is markers only — no cluster, no filter, no legend tied to live filters
- My Reports is token-only; no status timeline
- No empty states that teach (“Worker will assign within minutes…”)
- Accessibility / mobile pass not obvious
- No Sinhala/Tamil even as optional labels (strong local signal if competition is national)

---

## 6. Python worker assessment

**Good:** clear pipeline, Gemini/Ollama switch, keyword fallback, geocode, blur, org scoring, service role.

**Not competition-max yet:**

- Assignment is **not** mandate-aware (no RAG)
- No duplicate check before assign  
- No structured “routing_reason” written for the UI  
- Loads **all** orgs every job (fine for demo, not for scale)  
- `main.py` may still exist as leftover FastAPI noise  
- Observability = print statements only  

**Quick wins in worker:**

1. Fix ELECTRICITY alias  
2. Persist `routing_reason` in `analysis`  
3. Nearby open-report query for duplicates  
4. Atomic job claim (`pending` → `processing` only if still pending)

---

## 7. What “competition worthy” means here

Judges usually score:

1. **Problem + impact** — you have this  
2. **Working demo** — mostly yes  
3. **Technical depth** — AI + geo + queue is good; **RAG/jurisdiction** is the missing depth vs your own README  
4. **Trust & safety** — privacy blur helps; verification + audit trail lag  
5. **Presentation** — seed data, one scripted scenario, metrics  

A **winning narrative** is not “we used Gemini”. It is:

> Citizen reports a leak on a named road → system enriches location → matches mandate + proximity → assigns NWSDB → public can see status and updates.

That path must be **visible in the UI** in under 2 minutes.

---

## 8. Recommended roadmap (tight, not infinite)

### Sprint 1 — Credibility (1–2 days)

- Fix AI category bugs (ELECTRICITY, prompt enums)  
- Seed 6–8 Sri Lankan orgs with geo + keywords  
- Surface `analysis.explanation` + routing reason on report detail  
- Script one demo scenario end-to-end  

### Sprint 2 — Differentiator (3–5 days)

- Minimal RAG: embed ~15 jurisdiction snippets; retrieve top-k into Gemini prompt  
- Or structured rules table if RAG is too heavy  
- Duplicate detection (radius + category + open status)  
- OSM road context if time  

### Sprint 3 — Product trust  

- Comment timeline with timestamp + org name (schema change)  
- Admin “verify org” or hardcode verified seeds  
- Report filters: priority, org, dates  
- Optional notify email on assign  

### Sprint 4 — Engineering hygiene  

- Atomic job lock + retry  
- Server-side org search pagination  
- README rewrite to match reality (or finish RAG)  
- Deploy + 1-page demo guide  

---

## 9. What you should *not* spend time on (for now)

- Perfect design system / dark mode  
- Microservices  
- Full multilingual CMS  
- Perfect plate OCR  
- Rewriting Next ↔ Python boundaries again  

Depth on **routing correctness + demo clarity** beats more UI chrome.

---

## 10. Bottom line

| Dimension | Score (honest) |
|-----------|----------------|
| Problem fit | Strong |
| Working MVP | Strong |
| AI usefulness today | Medium (classifies + assigns heuristically) |
| Match to stated RAG vision | Weak |
| Trust / civic readiness | Medium-low |
| Competition potential | **High if Sprint 1–2 done**; otherwise “good student app” |

You do **not** have a toy-only project. You have an incomplete **civic routing system**. The distance to “competition worthy” is mainly:

1. Make assignment **explainable and mandate-aware** (even lightly).  
2. Make the AI decision **visible** in the product.  
3. Seed a **Sri Lanka-realistic** demo path.  
4. Align **README/GROK** with what you actually ship.

If you want a follow-up, the highest leverage next build is: **routing_reason in analysis + seed orgs + fix ELECTRICITY + show explanation in ReportDetails** — half a day, large perceived quality jump.
