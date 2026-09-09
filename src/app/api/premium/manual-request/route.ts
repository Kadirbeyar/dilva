import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { isValidPlan } from "@/lib/plans";

/** The signed-in user's own latest manual payment request, if any — lets /premium show its status. */
export async function GET() {
  try {
    const user = await requireUser();
    const request = await prisma.manualPaymentRequest.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ request });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[premium/manual-request:GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const schema = z.object({
  plan: z.string(),
  method: z.enum(["BANK_TRANSFER", "CRYPTO", "FIB"]),
  note: z.string().min(3).max(500),
});

/**
 * User says "I already sent the money" — creates a PENDING request an
 * admin reviews from /admin (see /api/admin/manual-payments). Only
 * one open (PENDING) request per user at a time, so someone can't
 * spam a dozen claims while an admin is still reviewing the first.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    if (!isValidPlan(body.plan)) {
      return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
    }

    const existingPending = await prisma.manualPaymentRequest.findFirst({
      where: { userId: user.id, status: "PENDING" },
    });
    if (existingPending) {
      return NextResponse.json({ request: existingPending, alreadyPending: true }, { status: 200 });
    }

    const request = await prisma.manualPaymentRequest.create({
      data: {
        userId: user.id,
        plan: body.plan,
        method: body.method,
        note: body.note,
      },
    });

    return NextResponse.json({ request }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[premium/manual-request:POST]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
