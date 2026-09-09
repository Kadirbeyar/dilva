-- ═══════════════════════════════════════════════════════════════════════
-- Referral program: a user shares a link (dilva.app/<locale>/signup?ref=
-- <their username>), and once the person who follows it finishes
-- onboarding, both sides get a few days of free Premium — see
-- lib/referral.ts, lib/premium.ts, and /api/profile/complete.
--
-- premiumBonusUntil is its own column (not a fake Subscription/Payment
-- row) specifically so referral bonuses never appear as revenue in the
-- admin dashboard. referredById is a plain self-referencing FK, set
-- once at onboarding and never changed afterward.
--
-- Run this once in the Supabase SQL editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

alter table public.users
  add column if not exists "premiumBonusUntil" timestamptz;

alter table public.users
  add column if not exists "referredById" uuid references public.users(id) on delete set null;

create index if not exists users_referredbyid_idx on public.users ("referredById");

alter type "NotificationType" add value if not exists 'REFERRAL_BONUS_EARNED';
