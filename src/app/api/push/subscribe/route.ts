import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const schema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

/**
 * Saves (or re-saves, if this device already had a row — endpoint is
 * unique) a browser's push subscription against the signed-in user.
 * See lib/pushClient.ts for the browser side of this.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    await prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      // A subscription endpoint is tied to one browser/device, but if
      // someone signs out and a different account signs in on the
      // same device, re-point the existing row at the new user rather
      // than erroring on the unique constraint.
      update: { userId: user.id, p256dh: body.p256dh, auth: body.auth },
      create: { userId: user.id, endpoint: body.endpoint, p256dh: body.p256dh, auth: body.auth },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[push/subscribe]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
