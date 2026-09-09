import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, AuthError } from "@/lib/auth";
import { moderateImage } from "@/lib/moderation";

const schema = z.object({ url: z.string().url() });

/**
 * Called by AvatarUploader/PostMediaUploader right after a photo lands
 * in Supabase Storage, before it's attached to a profile or post. See
 * lib/moderation.ts for the actual check and its fail-open behaviour —
 * this route just requires a signed-in caller and forwards the URL.
 */
export async function POST(req: Request) {
  try {
    await requireUser();
    const { url } = schema.parse(await req.json());
    const result = await moderateImage(url);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[moderation/check-image]", err);
    // Fail open here too — a bug in this route shouldn't be able to
    // block every photo upload in the app.
    return NextResponse.json({ safe: true });
  }
}
