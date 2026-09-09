-- ═══════════════════════════════════════════════════════════════════════
-- Web Push notifications: browser push subscriptions, one row per
-- device that granted permission. See lib/webpush.ts (sending),
-- lib/pushClient.ts (subscribing from the browser), public/sw.js (the
-- service worker that shows the notification), and
-- /api/push/subscribe + /api/push/unsubscribe.
--
-- Run this once in the Supabase SQL editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.push_subscriptions (
  id text primary key default gen_random_uuid()::text,
  "userId" uuid not null references public.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  "createdAt" timestamptz not null default now()
);

create index if not exists push_subscriptions_userid_idx on public.push_subscriptions ("userId");
