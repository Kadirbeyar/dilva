-- ═══════════════════════════════════════════════════════════════════════
-- Makes "Nearby" visibility mandatory instead of an opt-in toggle: as
-- of this version, any user who already has coordinates on file is
-- always discoverable on the map (see nearby/page.tsx, which no
-- longer shows an on/off switch, and profile/complete/route.ts, which
-- now sets isLocationVisible = true automatically for every NEW
-- onboarding). This one-time backfill applies the same rule
-- retroactively to accounts that onboarded before this change and
-- had chosen to keep their location hidden.
--
-- Run this once in the Supabase SQL editor, same as the other
-- prisma/sql/*.sql files. Safe to re-run — it's a no-op the second
-- time (every matching row is already isLocationVisible = true).
-- ═══════════════════════════════════════════════════════════════════════

update public.users
set "isLocationVisible" = true
where latitude is not null
  and longitude is not null
  and "isLocationVisible" = false;
