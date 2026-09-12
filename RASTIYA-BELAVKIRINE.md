# ڕێبەرێ ئامادەکرنا Dilva بۆ بەلاڤکرنا گشتی

## ١. TURN Server بۆ ژوورا دەنگی (گرنگترین تشتێ ماییە)

بێ ڤێ خزمەتگوزاریێ، هندەک کەسان (بایاخ یێن ل سەر ئینتەرنێتا مۆبایلێ) دێ دەنگ قەت نەبینن ناڤ ژوورا دەنگی.

**پێنگاڤ:**

1. بچۆرە سەر [metered.ca](https://www.metered.ca/tools/openrelay/) و هژمارەکا خۆرایی چێبکە.
2. ل داشبۆردێ، بچۆرە بەشێ **"TURN Server"** → **"TURN Credentials"** → **"Add Credential"**.
3. دێ ژمارەکا **Username** و **Password** بۆ تە دروست ببیت — ڤان تومار بکە.
4. ناڤێ ژێرناڤا خۆ (subdomain) یێ ل لایێ چەپێ داشبۆردێ ببینە (بۆ نموونە: "dilva" — دێ ببیتە `dilva.metered.live`).
5. ل Vercel، بچۆرە پرۆژەیا خۆ → **Settings** → **Environment Variables**، و ڤان سئ گۆهۆرینان زیاد بکە:
   ```
   METERED_TURN_SUBDOMAIN=dilva
   METERED_TURN_USERNAME=<وا Username یا تە>
   METERED_TURN_PASSWORD=<وا Password یا تە>
   ```
6. پرۆژەیێ ژ نوی deploy بکە (یان ل Vercel → Deployments → سئ خالان → Redeploy).

هژمارا خۆرایی (Free) یا metered.ca گەلەک باشە بۆ دەستپێکرنێ.

---

## ٢. Email یا پشتراستکرنێ (Supabase)

بۆ ژمارەکا مەزن ژ بکارهێنەران، ئیمەیلا خۆرایا Supabase (کێم-کارایە، ژمارەکا سنووردار ل رۆژێ). باشترە:

1. ل Supabase Dashboard → **Authentication** → **Email Templates** → **SMTP Settings**.
2. SMTP یا خۆ یا تایبەت زیاد بکە (وەکو: Resend, SendGrid, Postmark, Brevo — گشتیان خزمەتگوزارییا خۆرایی هەیە بۆ دەستپێکرنێ).

---

## ٣. Stripe — گواستنا بۆ دراهیا راستەقینە (Live Mode)

1. ل Stripe Dashboard، سویچا **"Test mode"** بگۆهۆرە بۆ **"Live mode"**.
2. کلیلێن نوی یێن Live (`sk_live_...`, `pk_live_...`) وەربگرە.
3. Price ID یێن پلانێن Premium ژ نوی ل Live mode چێبکە (ژ بەر کو Test و Live جودان).
4. Webhook یا Stripe ل Live mode ژ نوی ئامادە بکە (Dashboard → Developers → Webhooks) و `STRIPE_WEBHOOK_SECRET` یا نوی وەربگرە.
5. ڤان هەمیان ل Vercel Environment Variables دابنە.

---

## ٤. دۆمەین و HTTPS

1. دۆمەینێ خۆ (وەکو dilva.com) ل Vercel → Settings → Domains زیاد بکە.
2. `NEXT_PUBLIC_APP_URL` ل Vercel بگۆهۆرە بۆ ئەڤ دۆمەینا راستەقینە (بێ HTTPS، لینکێن ناڤ ئیمەیل و پۆستان دێ خەلەت بن).

---

## ٥. لیستا Environment Variables یا تومام (بۆ پشکنین ل Vercel)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `STRIPE_SECRET_KEY` (live)
- `STRIPE_WEBHOOK_SECRET` (live)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (live)
- `STRIPE_PRICE_1_MONTH` / `3_MONTHS` / `6_MONTHS` / `12_MONTHS` (live)
- `LIBRETRANSLATE_URL`
- `NEXT_PUBLIC_APP_URL` (دۆمەینا راستەقینە)
- `APP_SECRET`
- `METERED_TURN_SUBDOMAIN` / `METERED_TURN_USERNAME` / `METERED_TURN_PASSWORD` (نوی — بەشێ ١)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` (ئارەزوومەندە، بۆ push notifications)

---

## ٦. تشتێن نوی یێن هاتنە زیادکرن ڤی جارێ (کۆد)

- **جهێ بیرکرنا پاسوۆردی** — `/forgot-password` و `/reset-password`، ب ڕێکا ئیمەیلا Supabase.
- **پاراستنا لۆگین/ساینئپ ژ زیادبوونا هەوڵان** (rate limiting) — نوکە کەسەک ناشێت هزاران جاران هەوڵ بدەت.
- **ژناڤبرنا هژمارێ (Delete Account)** — ل Settings، ل ژێر "ناڤچا مەترسیدار". بکارهێنەر پێدڤیە ناڤێ خۆ بنڤیسیت دا پشتراست بکەت.
- **پەرەکا خەلەتیێ (Error Page)** — ئەگەر تشتەک ل ئەپلیکەیشنێ خەلەت بچیت، نوکە بکارهێنەر پەرەکا ڕازاوە دبینیت (نە پەرەکا سپی یا Next.js).

---

*ئەڤ فایلە ژ لایێ Claude ڤە هاتیە ئامادەکرن — پشتی هەر گۆهۆرینێ، فایلێ ژ نوی بخوینە دا هەر ئامادەیی نوی ببینی.*
