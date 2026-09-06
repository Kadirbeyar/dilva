import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

/**
 * Notifications list — newest first, cursor-paginated. Always also
 * returns `unreadCount` so the NavBar bell badge and the full
 * notifications page can share one endpoint.
 */
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const take = Math.min(Number(searchParams.get("take") ?? 20), 50);

    // Sequential, not Promise.all: Dilva's DB connection goes through
    // Supabase's pooler with connection_limit=1, so firing these at
    // once doesn't parallelize anyway — it just queues both requests
    // and makes pool-timeout errors more likely under load.
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
    });
    const unreadCount = await prisma.notification.count({ where: { userId: user.id, isRead: false } });

    // Most notification types carry a `fromUserId` (or `visitorId`) in
    // their `data` JSON — batch-fetch those users once so the UI can
    // show a name/avatar instead of a bare id.
    const actorIds = new Set<string>();
    for (const n of notifications) {
      const d = n.data as Record<string, unknown> | null;
      const actorId = (d?.fromUserId ?? d?.visitorId) as string | undefined;
      if (actorId) actorIds.add(actorId);
    }
    const actors = actorIds.size
      ? await prisma.user.findMany({
          where: { id: { in: [...actorIds] } },
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        })
      : [];
    const actorById = new Map(actors.map((a: (typeof actors)[number]) => [a.id, a]));

    return NextResponse.json({
      notifications: notifications.map((n: (typeof notifications)[number]) => {
        const d = n.data as Record<string, unknown> | null;
        const actorId = (d?.fromUserId ?? d?.visitorId) as string | undefined;
        return { ...n, fromUser: actorId ? actorById.get(actorId) ?? null : null };
      }),
      unreadCount,
      nextCursor: notifications.length === take ? notifications[notifications.length - 1].id : null,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[notifications:GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const patchSchema = z.object({
  // Mark specific notifications as read, or omit `ids` (and set
  // `all: true`) to mark everything read at once.
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const { ids, all } = patchSchema.parse(await req.json());

    if (all) {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    } else if (ids && ids.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: ids }, userId: user.id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[notifications:PATCH]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
