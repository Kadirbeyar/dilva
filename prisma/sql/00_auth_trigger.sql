-- ═══════════════════════════════════════════════════════════════════════
-- Keeps public.users in sync with Supabase's auth.users.
-- Run this once in the Supabase SQL editor AFTER your first
-- `prisma migrate deploy` (i.e. after the "users" table exists).
--
-- Why: Supabase Auth owns auth.users (email, password hash, etc).
-- Dilva's own profile data (username, languages, bio...) lives in
-- public.users, keyed by the SAME uuid. We insert a bare-bones row
-- the instant someone signs up so foreign keys never dangle; the
-- app then walks the user through /onboarding to pick their real
-- username, native/target languages, etc. (see
-- src/app/api/profile/complete/route.ts).
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, username, "createdAt", "updatedAt")
  values (
    new.id,
    -- temporary unique placeholder username; user picks their real one
    -- during onboarding (see POST /api/profile/complete)
    'user_' || substr(new.id::text, 1, 8),
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- Optional but recommended: enable Row Level Security and allow each
-- user to read/update only their own row, while public profile fields
-- (username, displayName, avatarUrl, bio, languages, country/city —
-- i.e. everything EXCEPT precise lat/lng) stay readable by any
-- authenticated user, which is what the feed / matching / chat need.
alter table public.users enable row level security;

create policy "Users are publicly readable"
  on public.users for select
  using (true);

create policy "Users can update their own row"
  on public.users for update
  using (auth.uid() = id);
