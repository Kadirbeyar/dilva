import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const schema = z.object({
  avatarUrl: z.string().url(),
});

/**
 * Saves the avatar URL the instant a Storage upload finishes (see
 * AvatarUploader.tsx). Previously the picture only reached the
 * database when the WHOLE profile/settings form was submitted —
 * uploading a new photo felt like it "didn't take" if the rest of the
 * form wasn't also filled in and saved.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { avatarUrl } = schema.parse(await req.json());

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[profile/avatar]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
