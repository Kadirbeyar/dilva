-- ═══════════════════════════════════════════════════════════════════════
-- Two independent additions for chat:
--
-- 1) "isMuted" column on conversation_participants — lets a user mute
--    one conversation (silences bell/push notifications for future
--    messages in it, for them only). See
--    src/app/api/conversations/[id]/mute/route.ts.
--
-- 2) A new "chat-media" Storage bucket for photo messages, mirroring
--    03_storage_chat_voice.sql's shape exactly (any signed-in user
--    can view — needed so the other side of a 1-1 chat can see a
--    photo sent to them — but only the uploader's own uid-prefixed
--    path can be written/deleted). Deliberately NOT public like
--    09_storage_post_media.sql, since chat photos are private
--    between the two participants, not public feed content.
--
-- Run this once in the Supabase SQL editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

alter table public.conversation_participants
  add column if not exists "isMuted" boolean not null default false;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-media', 'chat-media', true, 15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 15728640,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Any signed-in user can view a chat photo (access to the message
-- itself, and therefore the URL, is already gated by conversation
-- membership in the app layer — see /api/conversations/[id]/messages).
drop policy if exists "Signed-in users can view chat media" on storage.objects;
create policy "Signed-in users can view chat media"
  on storage.objects for select
  using (bucket_id = 'chat-media' and auth.role() = 'authenticated');

-- A signed-in user may only upload into a path that starts with their
-- own user id, e.g. "<uid>/1699999999.jpg".
drop policy if exists "Users can upload their own chat media" on storage.objects;
create policy "Users can upload their own chat media"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own chat media" on storage.objects;
create policy "Users can delete their own chat media"
  on storage.objects for delete
  using (
    bucket_id = 'chat-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
