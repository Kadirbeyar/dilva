-- ═══════════════════════════════════════════════════════════════════════
-- Manual (non-Stripe) Premium payments: a fast-to-launch stopgap so
-- Dilva can start selling Premium TODAY to users Stripe can't reach
-- (Iraq and much of the world), while a real local gateway
-- (PayTabs/Qi Card) is still being set up. Flow:
--
--   1) /premium shows bank/Qi Card + crypto details (admin-editable,
--      see manualPaymentBankInfo/manualPaymentCryptoInfo below).
--   2) User sends the money themselves, then submits a
--      ManualPaymentRequest ("I paid — here's who it's from / the tx
--      hash") — status PENDING.
--   3) Admin checks it against what actually arrived and approves or
--      rejects from /admin. Approving does exactly what the Stripe
--      webhook does for a real payment (upsert Subscription, create a
--      Payment row, flip users.isPremiumCached) — see
--      src/app/api/admin/manual-payments/[id]/route.ts.
--
-- Same convention as every other file here (no prisma/migrations
-- history — schema changes are applied by hand). Run this once in the
-- Supabase SQL editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

do $$
begin
  create type "ManualPaymentMethod" as enum ('BANK_TRANSFER', 'CRYPTO');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type "ManualPaymentStatus" as enum ('PENDING', 'APPROVED', 'REJECTED');
exception
  when duplicate_object then null;
end $$;

-- New value on the existing NotificationType enum, for when an admin
-- rejects a manual payment request (approval reuses the existing
-- SUBSCRIPTION_ACTIVATED value instead — same message either way).
alter type "NotificationType" add value if not exists 'MANUAL_PAYMENT_REJECTED';

alter table public.app_settings
  add column if not exists "manualPaymentBankInfo" text,
  add column if not exists "manualPaymentCryptoInfo" text;

create table if not exists public.manual_payment_requests (
  id text primary key default gen_random_uuid()::text,
  "userId" uuid not null references public.users(id) on delete cascade,
  plan "SubscriptionPlan" not null,
  method "ManualPaymentMethod" not null,
  note text not null,
  status "ManualPaymentStatus" not null default 'PENDING',
  "reviewedAt" timestamptz,
  "reviewedById" uuid references public.users(id) on delete set null,
  "createdAt" timestamptz not null default now()
);

create index if not exists manual_payment_requests_status_idx on public.manual_payment_requests (status);
create index if not exists manual_payment_requests_userid_idx on public.manual_payment_requests ("userId");
