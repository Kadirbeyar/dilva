import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

/**
 * Toggle blocking the given username (by the signed-in user). Blocking
 * is already ENFORCED elsewhere (findNearbyUsers/lib/geo.ts,
 * findLanguagePartners/lib/matching.ts, and starting a new
 * conversation — see /api/conversations/start) — this route is what
 * actually lets a user create that Block row in the first place, and
 * messages/route.ts additionally re-checks it on every send so an
 * EXISTING conversation goes silent too, not just new ones.
 *
 * A block also removes any Follow relationship between the two
 * people, in both directions — staying "followed by" or "following"
 * someone you've just blocked (or been blocked by) doesn't make
 * sense, and would still surface their name in followers/following
 * lists.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await requireUser();
    const { username } = await params;

    const target = await prisma.user.findUnique({ where: { username } });
    if (!target) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (target.id === user.id) {
      return NextResponse.json({ error: "cannot_block_self" }, { status: 400 });
    }

    const existing = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: target.id } },
    });

    if (existing) {
      await prisma.block.delete({ where: { id: existing.id } });
      return NextResponse.json({ blocked: false });
    }

    await prisma.block.create({ data: { blockerId: user.id, blockedId: target.id } });
    // Sequential, not Promise.all — same connection_limit=1 pooler
    // constraint as everywhere else in this codebase.
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: user.id, followingId: target.id },
          { followerId: target.id, followingId: user.id },
        ],
      },
    });

    return NextResponse.json({ blocked: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[users/block]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
