# Quark of Education: Course Platform

Bangladeshi EdTech site (HSC and admission students). Live: https://edusite-pi.vercel.app. Folder and repo are still named `edusite`.

## Tech Stack
Next.js 16 (App Router, TypeScript, `cacheComponents`), Tailwind 4, Supabase (`@supabase/ssr`), Bunny Stream,
SSLCommerz, KaTeX + Markdown, Vercel (Mumbai).

## Folder Structure
- `src/app/`: pages, server actions, `api/`
- `src/components/`: `ui/`, `course/`, `lesson/`, `engage/`, `exam/`, `admin/`
- `src/lib/`: Supabase clients, auth, i18n, payments, helpers
- `supabase/`: `schema.sql`, `policies.sql`, `phaseN.sql` (the source of truth for tables), `tests/`, `email-templates/`

## Code Rules (Strict, Save Tokens)
- Keep code minimal and direct. No unnecessary abstractions, comments, or boilerplate.
- Never read or scan `.next/`, `node_modules/`, or lockfiles. Search first; read only the files you need.
- Server Components by default; `'use client'` only for interactive UI.
- Next 16: `await connection()`, `await params`/`searchParams`, `export const instant = false`. Request guard is `src/proxy.ts`.
- Every UI string goes in `src/lib/i18n/dict.ts` in Bangla (default) and English. Admin UI may be English only.
- Validate input with zod (`z.guid()`, not `z.uuid()`: seed ids fail the strict check). No `window.confirm()`.
- Check roles on the server in every action (`src/lib/auth.ts`). Prices and payment status are decided only on the server.
- Accent classes are `emerald-*`, remapped to brand cyan in `globals.css`.
- Ask before installing new npm packages.

## Database Rules
- RLS on every table, with explicit GRANTs. The server key (`service_role`) needs grants too.
- Changes go in a new idempotent `supabase/phaseN.sql` (next number: 11). Never edit applied files.
- Add checks to `supabase/tests/rls.test.mjs`; `npm run test:sql` must pass.
- The owner runs SQL by hand: copy the file with `Get-Content -Raw -Encoding UTF8 | Set-Clipboard`, ask them to paste it
  into a **new** SQL Editor tab, and wait before running code that needs it.
- There is only one database and it is production. Never change other users' data.

## Session Workflow
1. At the start, read `ROADMAP.md` and check `git status`. Do not review the whole codebase.
2. Before building a wave or large feature: give a short plan, list what you need from the owner, wait for approval.
3. Work on a branch `wave-N`, one commit per working feature. **`main` auto-deploys to the live site: merge or push to
   `main` only after the owner approves.**
4. Verify with `npx tsc --noEmit`, `npx eslint src`, `npx next build`, then test in the browser at desktop and phone width.
5. The owner logs in themselves; never type their password. Never print values from `.env.local`.
6. Remove your own test data. Say plainly what was not tested.
7. At the end (or when asked to "wrap up"): update `ROADMAP.md` ticks and session log, `SETUP.md` if setup changed, and commit.

## Communication
The owner is not an experienced developer: use plain words and give dashboard steps one at a time. Save tokens.
