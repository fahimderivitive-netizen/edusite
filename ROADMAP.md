# Quark of Education: Roadmap

Goal: build every wave, then launch officially. A private beta with 10–20 trusted students on a free course is
recommended while building.

## How to use this file
- One wave per session where possible. Tick items only after they are tested; add one line under **Session log**.
- Change the order or scope here when the owner decides to.

## Done (live)
- [x] Bangla/English UI, Quark of Education brand (logo, cyan accent), course cards with pictures
- [x] Admin + moderator panel (courses, users, exams, doubts, tickets, payments, coupons)
- [x] Bunny video (signed), custom player, corner watermark, device limit, protected PDFs, YouTube free previews
- [x] SSLCommerz **sandbox** payments (risky ones held for admin approval), coupons
- [x] MCQ and written exams, leaderboard, comments with timestamps, text/photo/voice doubts, support tickets
- [x] Profile, password reset, email templates (Gmail SMTP), legal page drafts, mobile layout, Mumbai region

## Wave 1: Students get in and stay
- [ ] Google sign-in (owner creates the Google OAuth client; collect phone number afterwards for the watermark)
- [ ] Notifications, in-app and email: doubt reply, ticket reply, exam graded
- [ ] Continue where you left off: save video position, "Continue" button
- [ ] Richer course pages: outcomes, requirements, instructor profile, FAQ, trailer, student count
- [ ] SEO and sharing: per-course titles and preview cards, sitemap, robots
- [ ] Analytics and Facebook Pixel (with consent, and a privacy page update)
- [ ] "Page not found" and error pages, error alerts

## Wave 2: Exams
- [ ] Topic tags and question bank
- [ ] Bulk question import
- [ ] Student analytics: topic accuracy, time per question, weak topics, rank and percentile
- [ ] Mistake notebook and retry
- [ ] "Daily 10" practice with streaks
- [ ] Solution video linked to the exact second per question
- [ ] Shuffled questions and options, tab-switch warnings

## Wave 3: Batches and events
- [ ] Batches (schedule, own exams and leaderboard)
- [ ] Scheduled mock exams with a live leaderboard
- [ ] Live class schedule, reminders, recordings
- [ ] Automatic merit coupons for top ranks
- [ ] College leaderboards (opt-in)

## Wave 4: Growth and revenue
- [ ] Course reviews and ratings
- [ ] Referral codes
- [ ] Bundles and all-access plan
- [ ] Installments (**needs owner's rule for missed payments**)
- [ ] Certificates with QR verification
- [ ] Receipts and refund tracking

## Wave 5: Running the business
- [ ] Admin analytics and CSV export
- [ ] Bulk lesson import
- [ ] Automatic video durations from Bunny (needs Bunny API key)
- [ ] Staff activity log
- [ ] Parent progress reports (only with student consent)

## Wave 6: Mobile and standout features
- [ ] Installable app (PWA) and push notifications
- [ ] Data-saver mode
- [ ] Concept map with mastery view
- [ ] Mark up handwritten answers on the photo
- [ ] AI helper for moderators (paid API key; a human approves every answer). Last on purpose.

## Launch readiness
- [ ] Security review and heavy-traffic test
- [ ] Domain connected: Vercel, Supabase URLs, Bunny allowed domain, email (SPF/DKIM/DMARC)
- [ ] SSLCommerz live credentials (`SSLCOMMERZ_LIVE=1`) and a real small payment test
- [ ] Paid Vercel and Supabase plans, backups
- [ ] Business details on legal pages, refund terms confirmed
- [ ] Native Bangla review of UI and legal text
- [ ] Remove sandbox payments and test data

## Owner's parallel track
- [ ] Buy a domain
- [ ] Apply for the SSLCommerz live merchant account (longest lead time)
- [ ] Pilot course: Bunny videos, 1280×720 picture, lesson durations, Bangla titles, exams

## Open checks
- Voice and photo doubts have not been tested with a real microphone and file picker.
- SSLCommerz server-to-server (IPN) delivery has not been observed.

## Session log
- Before Wave 1: platform built, rebranded and deployed (commit `4701310`). SQL phases 1–10 applied.
