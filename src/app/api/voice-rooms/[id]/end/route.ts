import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

/**
 * Ends a Voice Room — host-only. Marks it inactive so it drops off
 * the list; does not (and cannot) forcibly disconnect participants'
 * WebRTC connections server-side — VoiceRoomView polls/subscribes for
 * this and tears its own connections down client-side when it sees
 * isActive flip to false.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const result = await prisma.voiceRoom.updateMany({
      where: { id, hostId: user.id, isActive: true },
      data: { isActive: false, endedAt: new Date() },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ ended: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[voice-rooms/[id]/end:POST]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
