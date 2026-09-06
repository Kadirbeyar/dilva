-- ═══════════════════════════════════════════════════════════════════════
-- Item #12 (Sept 2026 feature list): lets users attach an image OR a
-- video to a Moments post, not just text.
--
-- 1) Adds Post.videoUrl (Post.imageUrl already existed but was never
--    wired up to the composer UI until now).
-- 2) Creates a public "post-media" Storage bucket + policies, same
--    shape as 01_storage_avatars.sql / 03_storage_chat_voice.sql:
--    anyone can view (posts are public), only the owner can upload
--    into their own "<uid>/..." folder.
--
-- Run this once in the Supabase SQL editor, same as the other
-- prisma/sql/*.sql files.
-- ═══════════════════════════════════════════════════════════════════════

alter table public.posts add column if not exists "videoUrl" text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media', 'post-media', true, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 52428800,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];

drop policy if exists "Post media is publicly accessible" on storage.objects;
create policy "Post media is publicly accessible"
  on storage.objects for select
  using (bucket_id = 'post-media');

drop policy if exists "Users can upload their own post media" on storage.objects;
create policy "Users can upload their own post media"
  on storage.objects for insert
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own post media" on storage.objects;
create policy "Users can delete their own post media"
  on storage.objects for delete
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
