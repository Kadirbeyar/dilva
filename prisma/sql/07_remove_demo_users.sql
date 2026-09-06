-- ═══════════════════════════════════════════════════════════════════════
-- Permanently deletes every FAKE/demo account and everything they
-- created (posts, comments, likes, follows, corrections — all
-- cascade-delete automatically via the foreign keys in schema.prisma).
--
-- "Fake" here means: a public.users row with NO matching auth.users
-- row. That's exactly what prisma/seed-demo.ts (now removed from the
-- codebase — it is no longer run automatically or by any npm script)
-- created: ~30 demo personas that exist only in public.users, with no
-- real Supabase Auth account behind them, so nobody could ever sign in
-- as them. Any REAL account always has a matching auth.users row, so
-- this can never delete a real user.
--
-- Run this once in the Supabase SQL editor. Safe to re-run (it will
-- simply find 0 rows the second time).
-- ═══════════════════════════════════════════════════════════════════════

-- See what would be deleted before actually deleting it.
select u.id, u.username, u."displayName", u.country
from public.users u
left join auth.users au on au.id = u.id
where au.id is null;

-- The actual deletion. Posts/comments/likes/follows/corrections/
-- messages/conversations authored by these accounts cascade-delete
-- with them (onDelete: Cascade in schema.prisma).
delete from public.users u
where u.id in (
  select u2.id
  from public.users u2
  left join auth.users au on au.id = u2.id
  where au.id is null
);
