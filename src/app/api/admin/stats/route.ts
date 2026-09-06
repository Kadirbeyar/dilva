import { NextResponse } from "next/server";
import type { Language } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError, ForbiddenError } from "@/lib/auth";
import { onlineWhere } from "@/lib/presence";

export async function GET() {
  try {
    await requireAdmin();

    // Sequential, not Promise.all: Dilva's DB connection goes through
    // Supabase's pooler with connection_limit=1, so firing all seven at
    // once doesn't parallelize — it just queues them and risks a
    // pool-timeout (P2024) that fails the whole dashboard.
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

    // Attach human-readable language names in one extra query rather
    // than N+1ing — the languages table is tiny (a few dozen rows).
    const languages = await prisma.language.findMany({
      where: { code: { in: byLanguageRaw.map((l: { languageCode: string }) => l.languageCode) } },
    });
    const languageName = new Map(languages.map((l: Language) => [l.code, l]));

    const byCountry = byCountryRaw.map((row: { country: string | null; _count: { _all: number } }) => ({
      country: row.country ?? null,
      count: row._count._all,
    }));

    const byLanguage = byLanguageRaw.map((row: { languageCode: string; _count: { _all: number } }) => ({
      code: row.languageCode,
      name: languageName.get(row.languageCode)?.name ?? row.languageCode,
      nativeName: languageName.get(row.languageCode)?.nativeName ?? row.languageCode,
      count: row._count._all,
    }));

    return NextResponse.json({
      totalUsers,
      onlineNow,
      totalPosts,
      totalComments,
      totalFollows,
      byCountry,
      byLanguage,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/stats]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
