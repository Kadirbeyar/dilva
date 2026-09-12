import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Baseline security headers sent on every response. Deliberately NOT
// including a Content-Security-Policy here: this app talks to
// Supabase (Realtime websockets + Storage), Stripe, web push, and a
// translation API, and a CSP that's even slightly wrong fails SILENTLY
// in production (a blocked request just never happens — no visible
// error) — the kind of bug that's very hard to track down without a
// full manual test pass against the live deploy. Worth doing as its
// own careful follow-up, not bundled in here.
//
// Permissions-Policy explicitly ALLOWS microphone (Voice Rooms) and
// geolocation (Nearby) for this origin — the common copy-pasted
// version of this header blocks everything by default, which would
// silently break both of those features.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(self), payment=(self)",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
