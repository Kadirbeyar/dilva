import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, AuthError } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { getStripePriceId, isValidPlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

const schema = z.object({ plan: z.string() });

/**
 * Creates a Stripe Checkout session for one of the 4 Dilva Premium
 * plans (1/3/6/12 months). The webhook (app/api/webhooks/stripe)
 * is what actually activates Premium once payment succeeds.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { plan } = schema.parse(await req.json());

    if (!isValidPlan(plan)) {
      return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
    }

    // Reuse an existing Stripe customer if we already created one for this user.
    const existingSub = await prisma.subscription.findUnique({ where: { userId: user.id } });
    let customerId = existingSub?.stripeCustomerId ?? undefined;

    if (!customerId) {
      const authUser = await prisma.user.findUnique({ where: { id: user.id } });
      const customer = await stripe.customers.create({
        metadata: { dilvaUserId: user.id },
        name: authUser?.displayName ?? authUser?.username,
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: getStripePriceId(plan), quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium?checkout=cancelled`,
      metadata: { dilvaUserId: user.id, plan },
      subscription_data: {
        metadata: { dilvaUserId: user.id, plan },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[checkout]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
