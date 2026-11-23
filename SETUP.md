# EduSite setup checklist (Phases 1–6)

All code is on branch `feature/platform`. `main` is untouched. Merge only after you finish the steps below.

## 1. Run the SQL (Supabase → SQL Editor), in this order

`schema.sql` and `policies.sql` are already applied. Then run, one file at a time:

1. `supabase/phase1.sql` – roles, Bangla columns, free-only self-enroll
2. `supabase/phase2.sql` – staff write policies, private buckets
3. `supabase/phase3.sql` – device sessions, phone, moves raw video URLs into `lesson_media`
4. `supabase/phase4.sql` – payments
5. `supabase/phase5.sql` – exams
6. `supabase/phase6.sql` – progress, comments, doubts, tickets, bucket limits

All files are idempotent (safe to re-run). `npm run test:sql` replays them in an in-memory Postgres and checks the
security rules (paid-course lockout, hidden answer keys, grading, privacy between students).

## 2. Make yourself admin

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'YOUR_EMAIL');
```

Then use **/admin → Users** to create moderators and tick their scopes (`content`, `qna`, `support`).

## 3. Environment variables (`.env.local` and Vercel)

| Variable | Needed for |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | **Required** for signed media URLs, device limit, payments, user emails in admin. Server only, never `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SITE_URL` | Payment callback URLs, e.g. `https://yourdomain.com` (local: `http://localhost:3000`) |
| `BUNNY_CDN_HOST`, `BUNNY_TOKEN_KEY` | Bunny Stream pull-zone host (e.g. `vz-xxxx.b-cdn.net`) and its token-authentication key |
| `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD` | Sandbox credentials first. `SSLCOMMERZ_LIVE=1` switches to live. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Optional. Without them rate limiting is per-server-instance memory. |
| `DEVICE_LIMIT` | Optional, default `2` concurrent devices per student |
| `ALLOW_DIRECT_VIDEO_URLS=1` | Optional. Lets full `https://…` URLs in the lesson "video ID" field play in production (always allowed in dev). |

## 4. Services

- **Bunny Stream:** create a library, enable *Token Authentication* on its pull zone, paste each video's GUID into the lesson editor.
- **SSLCommerz sandbox:** in the merchant panel set the IPN URL to `https://YOUR_SITE/api/payments/sslcommerz/ipn`.
- Success/fail/cancel URLs are sent per payment by the app.

## 5. Not verified yet (needs your live accounts)

- Bunny token signing (`src/lib/media.ts`) follows Bunny's documented token_path scheme but has not been run against Bunny.
- SSLCommerz init/validation calls (`src/lib/sslcommerz.ts`) follow the v4 sandbox API but have not been run against SSLCommerz.
- UI pages were built and type-checked but not clicked through against a live database.
- Browser-only features (voice notes via MediaRecorder, fullscreen, HLS quality menu) need a manual pass.
