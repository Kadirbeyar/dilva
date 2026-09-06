import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { withinPostEditWindow } from "@/lib/postEditWindow";

const editSchema = z.object({
  content: z.string().min(1).max(2000),
});

type OwnershipError = "not_found" | "forbidden" | "window_expired";

/** Loads a post and checks it can be modified by `userId` right now (author + still within the edit window). */
async function loadOwnedEditablePost(
  id: string,
  userId: string
): Promise<{ post: Awaited<ReturnType<typeof prisma.post.findUnique>>; error: OwnershipError | null }> {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return { post: null, error: "not_found" };
  if (post.authorId !== userId) return { post: null, error: "forbidden" };
  if (!withinPostEditWindow(post.createdAt)) return { post: null, error: "window_expired" };
  return { post, error: null };
}

function errorResponse(error: OwnershipError) {
  if (error === "not_found") return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (error === "forbidden") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ error: "edit_window_expired" }, { status: 403 });
}

/**
 * Edit a Moment's own content. Only the original author may do this,
 * and only within POST_EDIT_WINDOW_MS (5 minutes) of posting — after
 * that the request is rejected server-side even if the button was
 * somehow still visible/clicked client-side.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = editSchema.parse(await req.json());

    const { error } = await loadOwnedEditablePost(id, user.id);
    if (error) return errorResponse(error);

    const updated = await prisma.post.update({
      where: { id },
      data: { content: body.content },
    });

    return NextResponse.json({ post: updated });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[posts/[id]:PATCH]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/**
 * Delete a Moment. Only the original author may do this — but unlike
 * PATCH above, there is NO time limit: an author can always take
 * their own post down, no matter how long ago they posted it (only
 * *editing* the content is time-limited, e.g. so a post can't be
 * silently rewritten after others already corrected it).
 * Comments/likes/corrections on the post cascade-delete at the DB
 * level (see schema.prisma).
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (post.authorId !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[posts/[id]:DELETE]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
