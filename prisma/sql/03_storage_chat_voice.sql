-- ═══════════════════════════════════════════════════════════════════════
-- Creates a public "chat-voice" Storage bucket and the policies that
-- let each signed-in user upload voice messages (path must start
-- with their own auth uid), while any signed-in user can listen to
-- one (needed so the OTHER side of the conversation can play it back
-- — see components/chat/ChatWindow.tsx).
--
-- Run this once in the Supabase SQL editor, same as the other
-- prisma/sql/*.sql files (00_auth_trigger.sql, 01_storage_avatars.sql,
-- 02_follows_and_admin.sql).
-- ═══════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-voice', 'chat-voice', true, 10485760,
  array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'];

-- Any signed-in user can listen to a voice message someone sent them
-- (playback happens straight from the public URL stored on the
-- Message row — access to the message itself is already gated by
-- conversation membership in the app layer).
drop policy if exists "Signed-in users can play chat voice messages" on storage.objects;
create policy "Signed-in users can play chat voice messages"
  on storage.objects for select
  using (bucket_id = 'chat-voice' and auth.role() = 'authenticated');

-- A signed-in user may only upload into a path that starts with their
-- own user id, e.g. "<uid>/1699999999.webm".
drop policy if exists "Users can upload their own voice messages" on storage.objects;
create policy "Users can upload their own voice messages"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-voice'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own voice messages" on storage.objects;
create policy "Users can delete their own voice messages"
  on storage.objects for delete
  using (
    bucket_id = 'chat-voice'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
