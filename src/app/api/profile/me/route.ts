import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Returns the current user's full profile (for pre-filling the edit-profile / settings form). */
export async function GET() {
  try {
    const user = await requireUser();
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      include: { languages: true },
    });
    return NextResponse.json({ profile });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[profile/me]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
