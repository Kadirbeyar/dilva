import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

/** Cancels the user's subscription at the end of the current billing period. */
export async function POST() {
  try {
    const user = await requireUser();
    const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });

    if (!sub?.stripeSubscriptionId) {
      return NextResponse.json({ error: "no_active_subscription" }, { status: 404 });
    }

    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.subscription.update({
      where: { userId: user.id },
      data: { cancelAtPeriodEnd: true },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[subscription/cancel]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
