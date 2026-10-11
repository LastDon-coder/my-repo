-- ============================================================
-- Cosman Tech Academy: Supabase schema
-- Run once: Supabase dashboard -> SQL Editor -> New query -> paste -> Run
-- Safe to re-run (idempotent).
-- ============================================================

-- ---------- registrations ----------
create table if not exists public.registrations (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  full_name   text not null check (char_length(full_name) between 2 and 120),
  email       text not null check (char_length(email) <= 254 and email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  phone       text not null check (phone ~ '^\+?[0-9\s()-]{7,20}$'),
  course      text not null check (course in ('html','css','javascript','web-development')),
  gender      text check (gender in ('Male','Female')),
  address     text check (char_length(address) <= 500),
  status      text not null default 'pending'
              check (status in ('pending','confirmed','paid','cancelled')),
  user_id     uuid default auth.uid()
);

-- One registration per email per course (case-insensitive).
create unique index if not exists registrations_email_course_key
  on public.registrations (lower(email), course);

alter table public.registrations enable row level security;

-- Lock down, then grant only what the website needs.
revoke all on public.registrations from anon, authenticated;
-- Visitors may insert only these columns (so they can never set status or user_id):
grant insert (full_name, email, phone, course, gender, address)
  on public.registrations to anon, authenticated;
-- Logged-in students may read rows (RLS below limits them to their own email):
grant select on public.registrations to authenticated;

drop policy if exists "anyone can register" on public.registrations;
create policy "anyone can register"
  on public.registrations for insert
  to anon, authenticated
  with check (true);

drop policy if exists "students read own registrations" on public.registrations;
create policy "students read own registrations"
  on public.registrations for select
  to authenticated
  using (
    lower(email) = lower(auth.jwt() ->> 'email')
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

-- No update/delete policies for the public. You (the project owner) change a student's
-- status (pending -> confirmed -> paid) in the Supabase Table Editor, which bypasses RLS.

-- ---------- newsletter_subscribers ----------
create table if not exists public.newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  email       text not null check (char_length(email) <= 254 and email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$')
);
create unique index if not exists newsletter_email_key
  on public.newsletter_subscribers (lower(email));

alter table public.newsletter_subscribers enable row level security;
revoke all on public.newsletter_subscribers from anon, authenticated;
grant insert (email) on public.newsletter_subscribers to anon, authenticated;

drop policy if exists "anyone can subscribe" on public.newsletter_subscribers;
create policy "anyone can subscribe"
  on public.newsletter_subscribers for insert
  to anon, authenticated
  with check (true);
-- Nobody can read the list from the website. View it in the Table Editor.
