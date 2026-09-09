import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Language } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { onlineWhere } from "@/lib/presence";
import { getAppSettings } from "@/lib/appSettings";
import RadioSettingsForm from "@/components/admin/RadioSettingsForm";
import BroadcastForm from "@/components/admin/BroadcastForm";
import ReportedPostsPanel, { type ReportedPost } from "@/components/admin/ReportedPostsPanel";
import ManualPaymentSettingsForm from "@/components/admin/ManualPaymentSettingsForm";
import ManualPaymentsPanel, { type ManualPaymentRequestItem } from "@/components/admin/ManualPaymentsPanel";

export default async function AdminPage() {
  const t = await getTranslations("admin");
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) notFound();

  // Sequential, not Promise.all: Dilva's DB connection goes through
  // Supabase's pooler with connection_limit=1, so firing all seven at
  // once doesn't parallelize — it just queues them and risks a
  // pool-timeout (P2024) that fails the whole admin dashboard.
  const totalUsers = await prisma.user.count();
  const onlineNow = await prisma.user.count({ where: onlineWhere() });
  const totalPosts = await prisma.post.count();
  const totalComments = await prisma.comment.count();
  const totalFollows = await prisma.follow.count();
  const byCountryRaw = await prisma.user.groupBy({
    by: ["country"],
    _count: { _all: true },
    orderBy: { _count: { country: "desc" } },
  });
  const byLanguageRaw = await prisma.userLanguage.groupBy({
    by: ["languageCode"],
    where: { type: "NATIVE" },
    _count: { _all: true },
    orderBy: { _count: { languageCode: "desc" } },
  });

  const languages = await prisma.language.findMany({
    where: { code: { in: byLanguageRaw.map((l: { languageCode: string }) => l.languageCode) } },
  });
  const languageMeta = new Map(languages.map((l: Language) => [l.code, l]));

  const openReportsRaw = await prisma.report.findMany({
    where: { status: "OPEN", postId: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      reporter: { select: { username: true, displayName: true } },
      post: {
        select: {
          id: true,
          content: true,
          author: { select: { username: true, displayName: true } },
        },
      },
    },
  });
  const reportedPosts: ReportedPost[] = openReportsRaw
    .filter((r: (typeof openReportsRaw)[number]) => r.post)
    .map((r: (typeof openReportsRaw)[number]) => ({
      reportId: r.id,
      reason: r.reason,
      details: r.details,
      createdAt: r.createdAt.toISOString(),
      reporter: r.reporter,
      post: r.post!,
    }));

  const appSettings = await getAppSettings();

  const manualPaymentsRaw = await prisma.manualPaymentRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { username: true, displayName: true, avatarUrl: true } },
    },
  });
  const manualPayments: ManualPaymentRequestItem[] = manualPaymentsRaw.map(
    (r: (typeof manualPaymentsRaw)[number]) => ({
      id: r.id,
      plan: r.plan,
      method: r.method,
      note: r.note,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      user: r.user,
    })
  );

  const byCountry = byCountryRaw.map((row: { country: string | null; _count: { _all: number } }) => ({
    country: row.country,
    count: row._count._all,
  }));
  const byLanguage = byLanguageRaw.map((row: { languageCode: string; _count: { _all: number } }) => ({
    code: row.languageCode,
    nativeName: languageMeta.get(row.languageCode)?.nativeName ?? row.languageCode,
    count: row._count._all,
  }));

  const summaryCards = [
    { label: t("totalUsers"), value: totalUsers },
    { label: t("onlineNow"), value: onlineNow },
    { label: t("totalPosts"), value: totalPosts },
    { label: t("totalComments"), value: totalComments },
    { label: t("totalFollows"), value: totalFollows },
  ];

  const maxCountryCount = Math.max(1, ...byCountry.map((c) => c.count));
  const maxLanguageCount = Math.max(1, ...byLanguage.map((l) => l.count));

  return (
    <main className="relative mx-auto max-w-4xl px-4 py-8">
      <div className="bg-mesh" aria-hidden="true" />

      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-gray-600 dark:text-gray-300">{t("subtitle")}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="card-shadow rounded-2xl bg-white p-4 text-center dark:bg-gray-800"
          >
            <p className="text-2xl font-bold text-gradient">{card.value}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="card-shadow rounded-2xl bg-white p-5 dark:bg-gray-800">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t("byCountry")}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {byCountry.map((row) => (
              <li key={row.country ?? "unknown"} className="flex items-center gap-2 text-sm">
                <span className="w-24 shrink-0 truncate text-gray-700 dark:text-gray-200">
                  {row.country || t("unknownCountry")}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <span
                    className="block h-full rounded-full bg-brand-600"
                    style={{ width: `${(row.count / maxCountryCount) * 100}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-end font-medium text-gray-600 dark:text-gray-300">
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-shadow rounded-2xl bg-white p-5 dark:bg-gray-800">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t("byLanguage")}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {byLanguage.map((row) => (
              <li key={row.code} className="flex items-center gap-2 text-sm">
                <span className="w-24 shrink-0 truncate text-gray-700 dark:text-gray-200">
                  {row.nativeName}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <span
                    className="block h-full rounded-full bg-brand-600"
                    style={{ width: `${(row.count / maxLanguageCount) * 100}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-end font-medium text-gray-600 dark:text-gray-300">
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ReportedPostsPanel initialReports={reportedPosts} />
        <RadioSettingsForm initialUrl={appSettings.radioStreamUrl} initialLabel={appSettings.radioLabel} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ManualPaymentsPanel initialRequests={manualPayments} />
        <ManualPaymentSettingsForm
          initialBankInfo={appSettings.manualPaymentBankInfo}
          initialCryptoInfo={appSettings.manualPaymentCryptoInfo}
        />
      </div>

      <div className="mt-6">
        <BroadcastForm />
      </div>
    </main>
  );
}
