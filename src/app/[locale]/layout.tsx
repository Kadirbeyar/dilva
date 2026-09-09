import type { Metadata, Viewport } from "next";
import { Inter, Vazirmatn } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, LOCALE_DIRECTION, type AppLocale } from "@/i18n/routing";
import SplashScreen from "@/components/layout/SplashScreen";
import "../globals.css";

// Inter for ltr (en/tr) content, Vazirmatn for rtl (ku, Arabic-script)
// content — a modern geometric face with full Kurdish/Arabic coverage
// and weights that actually look good at UI sizes, unlike most system
// Arabic-script fallbacks.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});
const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-kurdish",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Reuses the same NEXT_PUBLIC_APP_URL the Stripe checkout flow already
// needs (see src/app/api/checkout/route.ts) rather than introducing a
// second "what's our domain" env var. Falls back to a placeholder so
// builds never crash without it set, but a real deploy MUST set
// NEXT_PUBLIC_APP_URL (Vercel project → Settings → Environment
// Variables) to the real production domain — otherwise the absolute
// URLs below (og:image, canonical links) point at the wrong place
// when a Dilva link is shared on WhatsApp, Telegram, Twitter/X, etc.
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://dilva.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    ku: "Dilva — فێربوونا زمانان و هاڤاڵێن زمانی",
    tr: "Dilva — Dil Öğren, Dil Partneri Bul",
    en: "Dilva — Learn Languages, Meet Native Speakers",
  };
  const descriptions: Record<string, string> = {
    ku: "Dilva تە دگەهینیته کەسێن خودان زمانێ دایکی یێ تو فێر دبی، دا پێکڤه بئخڤن، بنڤیسن و هەڤدو ڕاست بکەن.",
    tr: "Dilva, dil öğrenenleri anadili konuşanlarla buluşturur — sohbet edin, birbirinizin gönderilerini düzeltin ve birlikte öğrenin.",
    en: "Dilva connects language learners with native speakers to chat, correct each other's posts, and learn together.",
  };
  const title = titles[locale] ?? titles.en;
  const description = descriptions[locale] ?? descriptions.en;
  const url = `${SITE_URL}/${locale}`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: url,
      languages: { ku: `${SITE_URL}/ku`, tr: `${SITE_URL}/tr`, en: `${SITE_URL}/en` },
    },
    // Lets the site be "installed" — on iPhone: Safari → Share → Add
    // to Home Screen — so it opens full-screen with its own icon, no
    // browser chrome, exactly like a real app. No App Store / Xcode
    // / Apple Developer account needed for this; it's the quickest
    // way to try Dilva as an app on a single iPhone for testing.
    manifest: "/manifest.json",
    icons: {
      icon: "/icon-192.png",
      apple: "/apple-touch-icon.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Dilva",
    },
    // Controls the preview card shown when a Dilva link is pasted
    // into WhatsApp, Telegram, Instagram DMs, Twitter/X, Facebook,
    // etc. — without this every share just showed a bare link, no
    // image or description, which looks unfinished/untrustworthy.
    openGraph: {
      title,
      description,
      url,
      siteName: "Dilva",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Dilva" }],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0c0c13",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) {
    notFound();
  }

  const dir = LOCALE_DIRECTION[locale as AppLocale];
  const messages = await getMessages();

  return (
    <html lang={locale} dir={dir} className={`dark ${inter.variable} ${vazirmatn.variable}`}>
      <head>
        {/* Dark is the default theme. This runs before paint so a
            visitor who previously chose light mode doesn't see a
            flash of dark before ThemeToggle's effect can react —
            see components/layout/ThemeToggle.tsx. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('dilva-theme')==='light'){document.documentElement.classList.remove('dark')}}catch(e){}",
          }}
        />
      </head>
      <body className={dir === "rtl" ? "font-kurdish" : "font-latin"}>
        <NextIntlClientProvider messages={messages}>
          <SplashScreen />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
