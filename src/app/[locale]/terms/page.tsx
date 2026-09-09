import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TERMS } from "@/lib/legal-content";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const doc = TERMS[(locale as AppLocale) ?? "en"] ?? TERMS.en;
  return { title: `${doc.title} — Dilva` };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const doc = TERMS[(locale as AppLocale) ?? "en"] ?? TERMS.en;
  const tc = await getTranslations({ locale, namespace: "common" });

  return (
    <main className="relative mx-auto max-w-2xl px-6 py-10">
      <div className="bg-mesh" aria-hidden="true" />

      <Link href="/" className="text-lg font-extrabold text-gradient">
        Dilva
      </Link>

      <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">{doc.title}</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {locale === "ku" ? "دویماهیک نویکری: " : locale === "tr" ? "Son güncelleme: " : "Last updated: "}
        {doc.updated}
      </p>

      <article className="card-shadow mt-6 flex flex-col gap-6 rounded-3xl bg-white p-7 dark:bg-gray-800">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{section.heading}</h2>
            {section.body.map((p, i) => (
              <p key={i} className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {p}
              </p>
            ))}
          </section>
        ))}
      </article>

      <Link
        href="/"
        className="mt-6 inline-block text-sm font-medium text-brand-700 underline dark:text-brand-300"
      >
        {tc("back")}
      </Link>
    </main>
  );
}
