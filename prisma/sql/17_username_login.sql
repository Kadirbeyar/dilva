-- ═══════════════════════════════════════════════════════════════════════
-- Two changes, both about usernames:
--
-- 1. Case-insensitive username uniqueness. public.users.username
--    already has a plain UNIQUE constraint, but that's case-SENSITIVE
--    in Postgres — "Ahmad" and "ahmad" could otherwise both exist as
--    separate accounts, which is confusing on its own and breaks
--    username-based login below (which has to pick exactly one match).
--
-- 2. Username-based login. Supabase Auth only signs in with an email
--    (there's no built-in username login), so /api/auth/login now
--    looks up the account's email by username first when the entered
--    value isn't already an email address. That lookup needs a copy
--    of the email on public.users — Prisma/the app never has direct
--    access to Supabase's separate auth.users table otherwise. This
--    adds that column, backfills it for every existing account from
--    auth.users, and updates the signup trigger (from
--    00_auth_trigger.sql) to keep filling it in for every new signup
--    from now on.
--
-- IMPORTANT — before running part 1: if you already have two accounts
-- whose usernames differ only by case, the unique index below will
-- fail to create. Check first with:
--
--   select lower(username), array_agg(username) from public.users
--   group by lower(username) having count(*) > 1;
--
-- If that returns any rows, rename one of each pair first (Settings,
-- or a manual update) before re-running this file.
--
-- Run this once in the Supabase SQL editor, same as the other
-- prisma/sql/*.sql files.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Case-insensitive username uniqueness (in addition to the
--    existing case-sensitive UNIQUE constraint on the column itself —
--    this functional index is what actually blocks a case-variant
--    duplicate at the database level).
create unique index if not exists users_username_lower_idx on public.users (lower(username));

-- 2a. The email column + one-time backfill from auth.users.
alter table public.users
  add column if not exists email varchar(255);

update public.users u
set email = a.email
from auth.users a
where u.id = a.id
  and u.email is distinct from a.email;

create unique index if not exists users_email_idx on public.users (email);

-- 2b. Keep filling it in for every future signup (replaces the
--     function from 00_auth_trigger.sql with the same behavior plus
--     the email column).
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, username, email, "createdAt", "updatedAt")
  values (
    new.id,
    'user_' || substr(new.id::text, 1, 8),
    new.email,
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
