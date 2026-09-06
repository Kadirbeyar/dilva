-- ═══════════════════════════════════════════════════════════════════════
-- Seeds a "Dilva Team" system account used only as the SENDER identity
-- for admin broadcast messages (see /api/admin/broadcast and
-- components/admin/BroadcastForm.tsx) — the "send one message to
-- every user, shown as coming from the Dilva team" feature.
--
-- This row has NO matching row in auth.users (nobody can log into
-- it — there's no login flow that could even reach it) and there's
-- no foreign key from public.users to auth.users enforcing one either
-- (see 00_auth_trigger.sql: that link is maintained by a trigger, not
-- a constraint), so a normal manual insert here is safe. Because it's
-- just an ordinary row in "users", every existing feature (chat,
-- notifications, avatar-initial fallback) already knows how to
-- display it correctly with zero special-casing in the app code —
-- it will simply show up as a person named "Dilva Team".
--
-- The id below is fixed and referenced directly from application
-- code (see src/lib/systemAccounts.ts) — do not change it.
-- Run this once in the Supabase SQL editor.
-- ═══════════════════════════════════════════════════════════════════════

insert into public.users (
  id, username, "displayName", bio, "isAdmin", "createdAt", "updatedAt"
)
values (
  '00000000-0000-0000-0000-000000000001',
  'dilva_team',
  'Dilva Team',
  'Official messages from the Dilva team.',
  false,
  now(),
  now()
)
on conflict (id) do update set
  username = excluded.username,
  "displayName" = excluded."displayName",
  bio = excluded.bio;
