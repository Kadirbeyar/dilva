import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { enforceRateLimit, RateLimitError } from "@/lib/rateLimit";

const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
  languageCode: z.string().optional(),
  imageUrl: z.string().url().optional(),
  // A post carries at most one attachment — the composer only ever
  // lets a user pick an image OR a video, never both at once.
  videoUrl: z.string().url().optional(),
  correctionRequested: z.boolean().optional(),
});

/**
 * Feed listing — newest first, cursor-paginated.
 *
 * Only shows posts in a language the viewer actually cares about: one
 * they're NATIVE in (so they can read/correct) or LEARNING (so they
 * can practice) — mirrors the same native/learning overlap the
 * matching engine uses (see lib/matching.ts). Posts with no language
 * tag are treated as general and always shown. A viewer with no
 * languages set yet (fresh signup) sees everything rather than an
 * empty feed.
 */
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const take = Math.min(Number(searchParams.get("take") ?? 20), 50);

    const myLanguages = await prisma.userLanguage.findMany({
      where: { userId: user.id },
      select: { languageCode: true },
    });
    const myCodes = myLanguages.map((l: (typeof myLanguages)[number]) => l.languageCode);

    const posts = await prisma.post.findMany({
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      where:
        myCodes.length > 0
          ? { OR: [{ languageCode: null }, { languageCode: { in: myCodes } }] }
          : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isPremiumCached: true,
            country: true,
            city: true,
          },
        },
        language: true,
        _count: { select: { likes: true, comments: true, corrections: true } },
      },
    });

    return NextResponse.json({
      posts,
      nextCursor: posts.length === take ? posts[posts.length - 1].id : null,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[posts:GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/** Create a new Moment post. */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    // Max 8 posts per 10 minutes per account — generous for a real
    // person posting updates, but enough to stop a script from
    // flooding the feed. Checked after auth (so it's keyed per-account,
    // not per-IP) but before the DB write it's protecting.
    await enforceRateLimit(`post_create:${user.id}`, 8, 600);
    const body = createPostSchema.parse(await req.json());

    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        content: body.content,
        languageCode: body.languageCode,
        imageUrl: body.imageUrl,
        videoUrl: body.videoUrl,
        correctionRequested: body.correctionRequested ?? true,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isPremiumCached: true,
            country: true,
            city: true,
          },
        },
        language: true,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: "rate_limited", retryAfterSeconds: err.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(err.retryAfterSeconds) } }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[posts:POST]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
