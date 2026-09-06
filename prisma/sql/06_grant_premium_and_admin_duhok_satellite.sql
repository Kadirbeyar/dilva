-- ═══════════════════════════════════════════════════════════════════════
-- Grants Dilva Premium AND full admin access (the /admin stats
-- dashboard) to one specific account: Duhok.satellite@gmail.com.
--
-- Same idea as 04_grant_premium.sql (Premium) and 02_follows_and_admin.sql
-- (admin), combined here for one account and looked up by email
-- instead of username. Not a real Stripe subscription — this just
-- flips the same flag/row the Stripe webhook would normally set once
-- a real payment succeeds (see src/lib/premium.ts,
-- src/app/api/webhooks/stripe/route.ts).
--
-- Email match is case-insensitive and trims stray spaces (Supabase
-- normally stores emails lowercase anyway, but this avoids a silent
-- 0-rows-updated if it doesn't for some reason).
--
-- Run this once in the Supabase SQL editor. Safe to re-run — every
-- statement here is idempotent (update / upsert).
-- ═══════════════════════════════════════════════════════════════════════

-- Fast-path Premium flag that isPremiumUser() checks first, and admin
-- flag that gates /admin — both in one update.
update public.users
set "isPremiumCached" = true,
    "isAdmin" = true
where id = (
  select id from auth.users
  where lower(trim(email)) = lower(trim('Duhok.satellite@gmail.com'))
);

-- Full Subscription row too, so anything that reads it directly
-- (e.g. the /premium page, /api/premium/status) also sees real,
-- consistent Premium data — a 10-year "MONTH_12" grant, $0 (manual).
insert into public.subscriptions
  (id, "userId", plan, status, "priceUsd", "currentPeriodStart", "currentPeriodEnd", "createdAt", "updatedAt")
select
  gen_random_uuid()::text,
  au.id,
  'MONTH_12',
  'ACTIVE',
  0,
  now(),
  now() + interval '10 years',
  now(),
  now()
from auth.users au
where lower(trim(au.email)) = lower(trim('Duhok.satellite@gmail.com'))
on conflict ("userId") do update
  set plan = 'MONTH_12',
      status = 'ACTIVE',
      "currentPeriodEnd" = now() + interval '10 years',
      "cancelAtPeriodEnd" = false,
      "updatedAt" = now();

-- Verification — this SELECT runs last, so its result is what shows
-- up in the Supabase SQL editor's results pane. If it comes back with
-- ZERO rows, the account with this exact email doesn't exist yet in
-- auth.users (i.e. hasn't signed up) — double check the email/spelling.
select au.email, u.username, u."isPremiumCached", u."isAdmin"
from auth.users au
join public.users u on u.id = au.id
where lower(trim(au.email)) = lower(trim('Duhok.satellite@gmail.com'));
