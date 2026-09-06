import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError, ForbiddenError } from "@/lib/auth";

/** Admin: dismiss a report without removing anything (post was fine). */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.report.update({ where: { id }, data: { status: "DISMISSED" } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/reports/[id]:PATCH]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/**
 * Admin: remove the reported post (cascade-deletes its comments/
 * likes/corrections/reports) and mark every open report about it
 * RESOLVED. This is the fast "take it down" action for e.g. sexual
 * content reports.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const report = await prisma.report.findUnique({ where: { id }, select: { postId: true } });
    if (!report?.postId) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Resolve sibling open reports about the same post first — once
    // the post is deleted, the postId foreign key cascade would wipe
    // them out instead of leaving a resolved audit trail.
    await prisma.report.updateMany({
      where: { postId: report.postId, status: "OPEN" },
      data: { status: "RESOLVED" },
    });
    await prisma.post.delete({ where: { id: report.postId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/reports/[id]:DELETE]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
