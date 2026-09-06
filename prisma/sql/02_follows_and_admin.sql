-- ═══════════════════════════════════════════════════════════════════════
-- Follow system RLS + admin grant.
--
-- IMPORTANT — run this ONLY AFTER you've run `npm run prisma:migrate`
-- (or `npm run prisma:deploy`) so the "follows" table and the
-- users."isAdmin" column already exist. This file just adds Row Level
-- Security policies (Supabase-specific, Prisma doesn't manage these)
-- and grants YOUR account admin access to the /admin stats dashboard.
--
-- Run this once in the Supabase SQL editor, same as
-- 00_auth_trigger.sql and 01_storage_avatars.sql.
-- ═══════════════════════════════════════════════════════════════════════

-- Follows are publicly readable (needed to show follower/following
-- counts and follow buttons on any profile), but a user may only
-- create or delete a follow row where THEY are the follower.
alter table public.follows enable row level security;

drop policy if exists "Follows are publicly readable" on public.follows;
create policy "Follows are publicly readable"
  on public.follows for select
  using (true);

drop policy if exists "Users can follow as themselves" on public.follows;
create policy "Users can follow as themselves"
  on public.follows for insert
  with check (auth.uid() = "followerId");

drop policy if exists "Users can unfollow as themselves" on public.follows;
create policy "Users can unfollow as themselves"
  on public.follows for delete
  using (auth.uid() = "followerId");

-- Grant kadir (kadirbeyar) access to the /admin stats dashboard.
-- If your Dilva username isn't "kadirbeyar", change it below before
-- running — you can check your exact username in Settings, or under
-- your profile page URL (dilva.com/ku/profile/<username>).
update public.users set "isAdmin" = true where username = 'kadirbeyar';
