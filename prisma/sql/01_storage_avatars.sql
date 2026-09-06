-- ═══════════════════════════════════════════════════════════════════════
-- Creates a public "avatars" Storage bucket and the policies that let
-- each signed-in user upload/replace/delete ONLY their own avatar
-- (path must start with their own auth uid), while anyone can view
-- any avatar (needed for the feed/matching/chat to show pictures).
--
-- Run this once in the Supabase SQL editor, same as the other
-- prisma/sql/*.sql files.
-- ═══════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Anyone (even signed-out visitors) can view avatars — they're public
-- profile pictures shown throughout the app.
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- A signed-in user may only upload into a path that starts with their
-- own user id, e.g. "<uid>/avatar.jpg" — see AvatarUploader.tsx.
drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
