-- ═══════════════════════════════════════════════════════════════════════
-- Adds FIB (First Iraqi Bank app transfer) as its own manual payment
-- method, alongside the existing bank/Qi Card transfer and crypto
-- options — see prisma/sql/11_manual_payments.sql for the original
-- manual-payment system this extends.
--
-- Run this once in the Supabase SQL editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

alter type "ManualPaymentMethod" add value if not exists 'FIB';

alter table public.app_settings
  add column if not exists "manualPaymentFibInfo" text;
