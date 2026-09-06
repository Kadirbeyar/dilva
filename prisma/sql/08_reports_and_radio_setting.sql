-- ═══════════════════════════════════════════════════════════════════════
-- Two small additions to schema.prisma that need matching DDL, same
-- as every other prisma/sql/*.sql file in this project (there is no
-- prisma/migrations history — schema changes are applied by hand):
--
-- 1) Lets a Report be about a specific POST (e.g. "this post has
--    sexual/porn content"), not just a whole account — needed for the
--    admin "reported posts" review queue at /admin.
-- 2) A tiny one-row app_settings table for the floating radio player's
--    stream URL, so it can be changed from the admin dashboard without
--    a redeploy.
--
-- Run this once in the Supabase SQL editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

alter table public.reports
  add column if not exists "postId" text references public.posts(id) on delete cascade;

create index if not exists reports_postid_idx on public.reports ("postId");

create table if not exists public.app_settings (
  id text primary key default 'singleton',
  "radioStreamUrl" text,
  "radioLabel" text,
  "updatedAt" timestamptz not null default now()
);

-- The app always reads/writes the one row with id = 'singleton'.
insert into public.app_settings (id)
values ('singleton')
on conflict (id) do nothing;
