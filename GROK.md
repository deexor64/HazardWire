
---

## 4. Implementation Status

1. [x] Clean schema + RLS
2. [x] Organizations auth (signup/signin/profile)
3. [x] Report submission + token hashing + job creation
4. [x] Image upload (`new_<uuid>`)
5. [x] Worker (keyword-based category/severity)
6. [x] Frontend token UX + My Report page
7. [x] Public Reports list
8. [x] Clean light UI (top navbar, no sidebar)
9. [x] Auth persistence via localStorage
10. [🟡] Organization dashboard (list + update status)
11. [ ] Real LLM analysis
12. [ ] Image blurring (faces / plates)
13. [ ] Proper authority_id assignment
14. [ ] Report comments history UI

---

## 5. Key Decisions

- Public users = private token (hashed in DB)
- Organizations = Supabase Auth
- Queue = simple `jobs` table
- AI = keyword matching for now (easy to replace later)
- UI = clean light theme, top navigation

---

## 6. Known Small Issues

- Worker does not set `authority_id` yet
- Some reports still have `category` / `severity` = null until worker runs
- Org report update endpoint uses query params (can be improved later)
- MapView and some components still have old dark-theme leftovers

---

## 7. Next Recommended Steps

1. Make sure Org dashboard fully works (list + status update + comment)
2. Show report updates/comments
3. Improve worker to set `authority_id` when possible
4. Replace keyword AI with real LLM when ready
