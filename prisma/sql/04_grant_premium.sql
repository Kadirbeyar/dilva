-- ═══════════════════════════════════════════════════════════════════════
-- Manually grants Dilva Premium to one account, for testing — same
-- idea as the admin grant in 02_follows_and_admin.sql. This is NOT a
-- real Stripe subscription; it just flips the same flag/row the
-- Stripe webhook would normally set once a real payment succeeds
-- (see src/lib/premium.ts, src/app/api/webhooks/stripe/route.ts).
--
-- Change the email below if you want to grant a different account,
-- then run this once in the Supabase SQL editor.
-- ═══════════════════════════════════════════════════════════════════════

-- Fast-path flag that isPremiumUser() checks first.
update public.users
set "isPremiumCached" = true
where id = (select id from auth.users where email = 'qq@gmail.com');

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
where au.email = 'qq@gmail.com'
on conflict ("userId") do update
  set plan = 'MONTH_12',
      status = 'ACTIVE',
      "currentPeriodEnd" = now() + interval '10 years',
      "cancelAtPeriodEnd" = false,
      "updatedAt" = now();
