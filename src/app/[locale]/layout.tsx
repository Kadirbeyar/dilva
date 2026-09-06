import type { Metadata } from "next";
import { Inter, Vazirmatn } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, LOCALE_DIRECTION, type AppLocale } from "@/i18n/routing";
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
  return {
    title: titles[locale] ?? titles.en,
    description:
      "Dilva connects language learners with native speakers to chat, correct each other's posts, and learn together.",
  };
}

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
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
