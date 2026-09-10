import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError, ForbiddenError } from "@/lib/auth";

/**
 * Admin-only user lookup for the "manage Premium by hand" panel (see
 * components/admin/UserPremiumPanel.tsx). Matches on username OR
 * displayName, case-insensitive. Requires at least 2 characters so a
 * blank/one-letter query never dumps a big chunk of the user table.
 */
export async function GET(req: Request) {
  try {
    await requireAdmin();

    const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 15,
      orderBy: { username: "asc" },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isPremiumCached: true,
        premiumBonusUntil: true,
        subscription: {
          select: { plan: true, status: true, currentPeriodEnd: true },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/users/search:GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
