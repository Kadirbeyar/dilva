-- ═══════════════════════════════════════════════════════════════════════
-- Backing table for lib/rateLimit.ts — a fixed-window rate limiter used
-- on post creation and chat message sending, so a single account (or
-- script) can't flood the feed or a conversation. One row per
-- (key, windowStart); the app upserts + reads the count in a single
-- query (INSERT ... ON CONFLICT ... RETURNING), matching the rest of
-- this project's connection_limit=1-friendly style. No FK to users on
-- purpose — the key is a free-form string like "post_create:<uuid>".
--
-- Run this once in the Supabase SQL editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.rate_limits (
  "key" text not null,
  "windowStart" timestamptz not null,
  "count" integer not null default 1,
  primary key ("key", "windowStart")
);

-- Speeds up the opportunistic cleanup delete (WHERE "windowStart" < ...)
-- that lib/rateLimit.ts runs on a small random fraction of calls.
create index if not exists rate_limits_windowstart_idx on public.rate_limits ("windowStart");
