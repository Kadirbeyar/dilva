import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError, ForbiddenError } from "@/lib/auth";

/** Admin-only queue of manual (bank/crypto) Premium payment claims, pending first. */
export async function GET() {
  try {
    await requireAdmin();

    const requests = await prisma.manualPaymentRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { username: true, displayName: true, avatarUrl: true } },
      },
    });

    // Prisma can't express "PENDING first" as a DB-level enum sort
    // without a raw CASE query — with at most 100 rows, a stable JS
    // sort on the already-fetched page is simpler and just as correct.
    const pendingFirst = [...requests].sort((a, b) =>
      a.status === b.status ? 0 : a.status === "PENDING" ? -1 : b.status === "PENDING" ? 1 : 0
    );

    return NextResponse.json({ requests: pendingFirst });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/manual-payments:GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
