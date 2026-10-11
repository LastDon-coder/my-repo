-- ============================================================
-- OPTIONAL HARDENING: only real humans who pass Turnstile can register.
-- Run AFTER schema.sql, and only when you have done all of these:
--   1. Supabase -> Authentication -> Sign In / Providers -> enable "Allow anonymous sign-ins"
--   2. Supabase -> Authentication -> Attack Protection -> enable CAPTCHA (Turnstile) + paste the SECRET key
--   3. Put the Turnstile SITE key in js/config.js and set strictRegistration: true
--
-- How it works: the browser solves Turnstile, Supabase verifies it server-side when
-- creating an anonymous session, and only that session may insert a registration.
-- Direct calls to the API without a verified session are rejected.
-- ============================================================

drop policy if exists "anyone can register" on public.registrations;
drop policy if exists "verified visitors can register" on public.registrations;

create policy "verified visitors can register"
  on public.registrations for insert
  to authenticated
  with check (true);

revoke insert on public.registrations from anon;

-- To undo, re-run the "anyone can register" block from schema.sql
-- and: grant insert (full_name, email, phone, course, gender, address) on public.registrations to anon;
