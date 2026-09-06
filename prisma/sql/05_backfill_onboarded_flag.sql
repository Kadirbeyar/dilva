-- ═══════════════════════════════════════════════════════════════════════
-- One-time backfill: middleware.ts now force-redirects any signed-in
-- user whose Supabase session lacks user_metadata.onboarded = true to
-- /onboarding, from anywhere else in the app (see src/middleware.ts
-- and POST /api/profile/complete, which sets that flag going
-- forward). Run this ONCE so accounts that already finished onboarding
-- BEFORE this change don't get bounced back to a blank onboarding form
-- on their next visit.
--
-- A user counts as "already onboarded" here if they picked a real
-- username (not the 'user_XXXXXXXX' placeholder the signup trigger
-- assigns — see 00_auth_trigger.sql), set a country, and have at
-- least one NATIVE and one LEARNING language on file.
-- ═══════════════════════════════════════════════════════════════════════

update auth.users u
set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('onboarded', true)
from public.users pu
where pu.id = u.id
  and pu.username !~ '^user_[0-9a-f]{8}$'
  and pu.country is not null
  and exists (
    select 1 from public.user_languages ul
    where ul."userId" = pu.id and ul.type = 'NATIVE'
  )
  and exists (
    select 1 from public.user_languages ul
    where ul."userId" = pu.id and ul.type = 'LEARNING'
  );
