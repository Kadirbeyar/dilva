# Dilva

هەلبژارتنێن تەکنیکی: **Stripe** (پارەدان) · **LibreTranslate** (وەرگێڕان، بێ‌بەرانبەر/self-hosted) · **OpenStreetMap + Leaflet** (نەخشە، بێ‌بەرانبەر) — وەکو تە هەلبژارت.

پلاتفۆرمەکا فێربوونا زمانان و کۆمەلایەتی، وەک HelloTalk، دگەل زمانێن ڕووکار (UI) یێن **کوردی (بادینی، ب پیتێن عەرەبی)**، **تورکی**، و **ئینگلیزی**. ژێرەڤە ڕێنمایی و پێکهاتەیا تەکنیکی یا پرۆژەیێ هاتییە دیارکرن.

---

## 1. Tech stack

| Layer | Choice |
|---|---|
| Frontend + Backend | Next.js 14 (App Router), TypeScript, Tailwind |
| i18n | next-intl — locales `ku` (RTL, Badini Kurdish), `tr`, `en` |
| Auth + DB | Supabase (Auth + Postgres) |
| ORM | Prisma |
| Realtime chat | Supabase Realtime (Postgres `postgres_changes` on the `messages` table) |
| Payments | Stripe Checkout + Billing (Customer Portal-ready) |
| Translation | LibreTranslate (self-hosted via Docker, or a public instance) |
| Maps ("Nearby", Premium) | OpenStreetMap tiles + Leaflet (`react-leaflet`) |

## 2. Project structure

```
prisma/
  schema.prisma            # full data model (Users, Languages, Subscriptions, Visitors, Chat, Feed...)
  seed.ts                  # seeds the Language reference table
  sql/00_auth_trigger.sql  # keeps public.users in sync with Supabase auth.users

src/
  i18n/                    # next-intl routing/config (ku default+RTL, tr, en)
  messages/{ku,tr,en}.json # UI translation strings
  middleware.ts            # locale routing + Supabase session refresh + protected routes

  lib/
    supabase/{client,server}.ts
    prisma.ts
    auth.ts                # getCurrentUser() / requireUser()
    matching.ts             # ★ language matching engine
    translate.ts             # LibreTranslate client
    plans.ts / stripe.ts / premium.ts   # ★ Premium/subscription core
    geo.ts                   # ★ Haversine "nearby" query

  components/
    layout/                 # nav, language switcher, sign-out
    feed/PostCard.tsx
    chat/ChatWindow.tsx      # Supabase Realtime chat UI + inline translate
    premium/PricingTable.tsx
    map/NearbyMap.tsx        # Leaflet map
    profile/RecordVisit.tsx

  app/
    [locale]/
      page.tsx                       # landing
      (auth)/login, (auth)/signup
      (main)/onboarding               # username + native/target languages
      (main)/feed                     # Moments: posts, likes, comments, corrections
      (main)/matches                  # language matching engine UI
      (main)/chat, (main)/chat/[id]
      (main)/premium                  # pricing + subscription status
      (main)/visitors                 # ★ Premium: who viewed my profile
      (main)/nearby                   # ★ Premium: map of nearby learners
      (main)/profile/[username]
    api/
      profile/complete, profile/location
      languages
      matches
      posts, posts/[id]/{like,comments,corrections}
      conversations, conversations/start, conversations/[id]/messages
      translate
      checkout, subscription/cancel
      webhooks/stripe
      visitors, nearby
```

## 3. Prerequisites

- Node.js ≥ 20, `pnpm` (or npm/yarn)
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account (test mode is fine to start)
- Docker (to self-host LibreTranslate), or access to a public LibreTranslate instance

## 4. Setup

### 4.1 Install

```bash
pnpm install
cp .env.example .env
# fill in every value in .env — see the comments in that file
```

### 4.2 Database (Supabase + Prisma)

1. In your Supabase project, copy the pooled + direct connection strings into `DATABASE_URL` / `DIRECT_URL` in `.env`.
2. Push the schema and generate the client:
   ```bash
   pnpm prisma:migrate     # creates the initial migration + applies it
   pnpm prisma:generate
   pnpm db:seed            # seeds the Language table (ku/tr/en + more)
   ```
3. Open the Supabase SQL editor and run **`prisma/sql/00_auth_trigger.sql`**. This keeps `public.users` in sync with `auth.users`: the moment someone signs up, a bare-bones profile row is created (placeholder username), and `/onboarding` lets them pick their real username + languages. It also enables Row Level Security with a sensible public-read / own-row-write policy.

### 4.3 Enable Realtime for chat

In the Supabase SQL editor:

```sql
alter publication supabase_realtime add table messages;
```

(Table → Database → Replication in the dashboard works too.) This is what makes `ChatWindow.tsx`'s `postgres_changes` subscription actually receive new messages live.

### 4.4 Stripe

1. Create one Product ("Dilva Premium") with **4 recurring Prices**, matching the plan list in `src/lib/plans.ts`:
   - 1 month — $10
   - 3 months — $25
   - 6 months — $42
   - 12 months — $80
2. Copy each Price ID into `.env` (`STRIPE_PRICE_1_MONTH`, etc.) and your secret/publishable keys.
3. For local development, forward webhooks with the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   and copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`. In production, add a webhook endpoint in the Stripe Dashboard pointing at `https://yourdomain.com/api/webhooks/stripe`, listening at least for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
4. Note: Stripe's own supported-country list applies to where your Stripe **account** is registered, not where your users pay from — check `https://stripe.com/global` if you're setting up the account from Iraq/Kurdistan Region, since direct Stripe accounts aren't available everywhere. A Merchant-of-Record alternative (Lemon Squeezy, Paddle) is a drop-in swap for `src/lib/stripe.ts` + the checkout/webhook routes if needed later.

### 4.5 LibreTranslate

Self-host with Docker:

```bash
docker run -d -p 5000:5000 libretranslate/libretranslate
```

Set `LIBRETRANSLATE_URL=http://localhost:5000`. **Caveat:** LibreTranslate's language model coverage does not include Kurdish as of this writing — chat/post translation will work for tr↔en and most major languages, but Kurdish (Badini/Sorani) may not be supported by the underlying Argos Translate models. `src/lib/translate.ts` isolates this in one place; swapping in another engine (or a Kurdish-specific model, e.g. via Helsinki-NLP OPUS-MT) later only touches that file.

### 4.6 Run

```bash
pnpm dev
```

Visit `http://localhost:3000` (redirects to `/ku`, the default locale).

## 5. How the core systems work

- **Matching engine** (`src/lib/matching.ts`): for the signed-in user, finds people whose NATIVE language is one of the user's LEARNING languages, and who are LEARNING one of the user's NATIVE languages. Mutual matches (both directions) rank above one-directional ones.
- **Premium gating** (`src/lib/premium.ts`): `requirePremium(userId)` throws unless the user has an ACTIVE/TRIALING subscription with a non-expired period. `User.isPremiumCached` is a denormalized flag the Stripe webhook keeps in sync, so hot paths don't need to join `Subscription` on every request.
- **Nearby** (`src/lib/geo.ts`): plain-SQL Haversine distance query — no PostGIS extension required. Only users with `isLocationVisible = true` are ever returned to others.
- **Profile Visitors**: every profile view POSTs to `/api/visitors` (deduplicated per day). Free users see only the count; Premium users see the full identified list.
- **i18n / RTL**: `src/i18n/routing.ts` defines `ku` (RTL) / `tr` / `en`. `app/[locale]/layout.tsx` sets `<html dir="rtl">` automatically when the active locale is `ku`.

## 6. What's intentionally left as a next step

This is a complete, working foundation, not a finished production app. Before shipping you'll still want: file uploads for avatars/chat media (Supabase Storage is already allow-listed in `next.config.mjs`), push notifications, an admin/moderation dashboard for the `Report`/`Block` tables, rate limiting on the API routes, and a Stripe Customer Portal link for self-service plan changes (`stripe.billingPortal.sessions.create`, one call in a new route next to `subscription/cancel`).
