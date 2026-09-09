import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const schema = z.object({ endpoint: z.string().url() });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { endpoint } = schema.parse(await req.json());

    // Scoped to the caller's own id as well as the endpoint, purely as
    // defense in depth — an endpoint is already effectively
    // unguessable, but there's no reason this couldn't also double as
    // "delete my subscription by endpoint, and only mine".
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[push/unsubscribe]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
