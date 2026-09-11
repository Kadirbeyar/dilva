-- ═══════════════════════════════════════════════════════════════════════
-- Gives the "Dilva Team" system account (seeded in
-- 10_dilva_team_broadcast.sql, id fixed in src/lib/systemAccounts.ts)
-- the app icon as its avatar, so broadcast messages in Chat show the
-- Dilva logo instead of a blank/initial-letter avatar.
--
-- Points at /icon-512.png, a same-origin path already served from the
-- public/ folder (used for the PWA manifest icon) — no Supabase
-- Storage upload needed, and it works the same way any other
-- avatarUrl already does (every avatar <img> in the app just uses
-- this value directly as `src`).
--
-- Run this once in the Supabase SQL editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

update public.users
set "avatarUrl" = '/icon-512.png'
where id = '00000000-0000-0000-0000-000000000001';
