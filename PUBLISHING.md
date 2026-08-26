# Publishing TerpSchedule

TerpSchedule is prepared for a free public beta, but deployment requires accounts and production URLs that must belong to the project owner.

## Recommended free beta stack

- **Frontend:** Cloudflare Pages, built from `frontend` with `npm run build` and output directory `dist`.
- **Backend:** Render free Web Service using the repository's `render.yaml`.
- **Database:** Neon free PostgreSQL. Do not use SQLite on Render: its filesystem is ephemeral.

Render's free backend sleeps after inactivity, so the first request can be slow. That tradeoff is acceptable for a small beta; move to paid compute only if usage justifies it.

## Values you must provide

1. Create the Neon database and copy its connection string into Render as `DATABASE_URL`.
2. Set `CONTACT_EMAIL` to a monitored project email. It is included in responsible upstream requests.
3. Deploy the backend and copy its `https://...onrender.com` URL.
4. Set Render `CORS_ORIGINS` to a JSON list containing the final frontend URL, for example `["https://terpschedule.pages.dev"]`.
5. In Cloudflare Pages, set `VITE_API_ORIGIN` to the Render backend URL and redeploy.
6. Keep Render's generated `ADMIN_SYNC_TOKEN` secret.

## First production sync

The refresh endpoint is intentionally hidden unless the admin token is supplied:

```bash
curl -X POST "https://YOUR-BACKEND.onrender.com/api/v1/ingest" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: YOUR-ADMIN-TOKEN" \
  -d '{"term":"202608","departments":["CMSC","MATH","STAT","ENGL","PHYS","BMGT","COMM","PSYC"]}'
```

Check `/health/ready` and `/api/v1/sync-status` afterward. The app will continue refreshing known departments automatically while the backend is awake.

## Implemented launch safeguards

- PostgreSQL/`asyncpg` support and production environment examples
- CORS configuration and configurable frontend API origin
- Protected administrative sync endpoint
- Per-IP request limits, with a tighter optimization limit
- Request status/duration logs and live/ready health checks
- Privacy and Terms/Disclaimer dialogs
- No account requirement and no analytics at launch
- Responsible configurable User-Agent/contact for upstream requests
- Security headers for the static frontend
- Playwright interaction tests on desktop, iPhone, and Android viewports
- Automated accessibility checks for critical issues

## Deliberate product limits

- Fall 2026 remains the only exposed term until the database receives a term-key migration. A fake semester picker would mix records and is intentionally not shipped.
- Walking values are labeled estimates. Google Maps links use exact UMD coordinates and provide current pedestrian routing.
- Testudo publishes seat and waitlist counts but does not reliably state whether a particular student is eligible to join a waitlist. Zero-seat sections remain labeled **waitlist or closed**.
- Missing PlanetTerp GPA is shown as **No data**, never as a real 3.0. Neutral values are used only internally so schedules can still be ranked.
- Each availability tab gets its own top 100 by score; displayed counts cover the full valid result set.

## Before sharing the URL

- Replace the placeholder contact email.
- Run the production sync and verify several classes directly against Testudo.
- Open the deployed app on a physical iPhone and Android phone; automated viewport tests cannot reproduce every mobile-browser behavior.
- Read the Privacy and Terms text and adapt it if your data practices change.
- Confirm Testudo, PlanetTerp, and UMD GIS usage expectations before promoting beyond a small beta.

## After beta feedback

- Complete the term-aware Alembic migration before adding another semester.
- Replace in-process rate limiting with shared Redis-backed limits if multiple API workers are introduced.
- Add external uptime alerts for `/health/ready` and structured error aggregation.
- Consider analytics only if a concrete product question requires it; choose a privacy-respecting service and disclose it first.
