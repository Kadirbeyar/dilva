-- ═══════════════════════════════════════════════════════════════════════
-- Restricts /admin access to exactly ONE account:
-- qader.doski41@gmail.com. Revokes isAdmin from every other account
-- (in particular Duhok.satellite@gmail.com, granted admin back in
-- 06_grant_premium_and_admin_duhok_satellite.sql) and grants it to
-- qader.doski41@gmail.com if it isn't already set.
--
-- Does NOT touch isPremiumCached/Subscription for either account —
-- this is admin access only, same isAdmin flag from
-- 02_follows_and_admin.sql (still "set by hand via SQL", no self-serve
-- signup path).
--
-- Email match is case-insensitive and trims stray spaces, same as
-- 06_grant_premium_and_admin_duhok_satellite.sql.
--
-- Run this once in the Supabase SQL editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Clear admin from everyone.
update public.users
set "isAdmin" = false
where "isAdmin" = true;

-- 2. Grant admin to exactly one account.
update public.users
set "isAdmin" = true
where id = (
  select id from auth.users
  where lower(trim(email)) = lower(trim('qader.doski41@gmail.com'))
);

-- Verification — this SELECT runs last, so its result is what shows up
-- in the Supabase SQL editor's results pane. Should come back with
-- EXACTLY ONE row: qader.doski41@gmail.com. If it comes back with zero
-- rows, that account hasn't signed up yet under this exact email —
-- double check the spelling before re-running.
select au.email, u.username, u."isAdmin"
from auth.users au
join public.users u on u.id = au.id
where u."isAdmin" = true;
