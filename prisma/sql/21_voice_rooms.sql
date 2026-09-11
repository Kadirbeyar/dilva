-- ═══════════════════════════════════════════════════════════════════════
-- "Voice Rooms" — small (2-6 person) public, topic-based live-audio
-- rooms. Only room METADATA lives in this table (topic, who hosts it,
-- whether it's still open) — the actual live audio is peer-to-peer
-- WebRTC between participants' browsers, and who is currently inside
-- a room is tracked ephemerally via Supabase Realtime Presence, never
-- written to Postgres. See src/components/voiceRooms/VoiceRoomView.tsx
-- and src/app/api/voice-rooms/*.
--
-- Run this once in the Supabase SQL editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.voice_rooms (
  id text primary key default gen_random_uuid()::text,
  topic varchar(120) not null,
  "hostId" uuid not null references public.users(id) on delete cascade,
  "maxParticipants" integer not null default 6,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "endedAt" timestamptz
);

create index if not exists voice_rooms_active_created_idx
  on public.voice_rooms ("isActive", "createdAt");
