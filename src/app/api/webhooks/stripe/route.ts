import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PLAN_CATALOGUE, isValidPlan } from "@/lib/plans";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

// Stripe webhooks need the raw request body to verify the signature —
// do NOT parse it as JSON before calling constructEvent.
export const runtime = "nodejs";

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
      return "CANCELED";
    case "incomplete_expired":
      return "EXPIRED";
    default:
      return "INCOMPLETE";
  }
}

async function syncSubscriptionFromStripe(stripeSub: Stripe.Subscription) {
  const dilvaUserId = stripeSub.metadata?.dilvaUserId;
  if (!dilvaUserId) {
    console.warn("[stripe webhook] subscription missing dilvaUserId metadata", stripeSub.id);
    return;
  }

  const planMeta = stripeSub.metadata?.plan;
  const plan: SubscriptionPlan = isValidPlan(planMeta ?? "") ? (planMeta as SubscriptionPlan) : "MONTH_1";
  const status = mapStripeStatus(stripeSub.status);

  const subscription = await prisma.subscription.upsert({
    where: { userId: dilvaUserId },
    create: {
      userId: dilvaUserId,
      plan,
      status,
      priceUsd: PLAN_CATALOGUE[plan].priceUsd,
      stripeCustomerId: stripeSub.customer as string,
      stripeSubscriptionId: stripeSub.id,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
    update: {
      plan,
      status,
      stripeSubscriptionId: stripeSub.id,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
  });

  const isActive = status === "ACTIVE" || status === "TRIALING";
  await prisma.user.update({
    where: { id: dilvaUserId },
    data: { isPremiumCached: isActive },
  });

  if (isActive) {
    await prisma.notification.create({
      data: {
        userId: dilvaUserId,
        type: "SUBSCRIPTION_ACTIVATED",
        data: { plan, subscriptionId: subscription.id },
      },
    });
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[stripe webhook] signature verification failed", err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const dilvaUserId = session.metadata?.dilvaUserId;
        const plan = session.metadata?.plan;

        if (dilvaUserId && session.subscription) {
          const stripeSub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          // Make sure the metadata we need is on the subscription too
          // (subscription_data.metadata at creation normally covers this).
          if (!stripeSub.metadata?.dilvaUserId) {
            await stripe.subscriptions.update(stripeSub.id, {
              metadata: { dilvaUserId, plan: plan ?? "" },
            });
            stripeSub.metadata = { ...stripeSub.metadata, dilvaUserId, plan: plan ?? "" };
          }
          await syncSubscriptionFromStripe(stripeSub);

          if (session.payment_status === "paid" && isValidPlan(plan ?? "")) {
            await prisma.payment.create({
              data: {
                userId: dilvaUserId,
                amountUsd: PLAN_CATALOGUE[plan as SubscriptionPlan].priceUsd,
                status: "SUCCEEDED",
                stripeCheckoutSessionId: session.id,
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        await syncSubscriptionFromStripe(event.data.object as Stripe.Subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSub = event.data.object as Stripe.Subscription;
        const dilvaUserId = stripeSub.metadata?.dilvaUserId;
        if (dilvaUserId) {
          await prisma.subscription.update({
            where: { userId: dilvaUserId },
            data: { status: "CANCELED" },
          });
          await prisma.user.update({
            where: { id: dilvaUserId },
            data: { isPremiumCached: false },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const dilvaUserId = invoice.subscription_details?.metadata?.dilvaUserId;
        if (dilvaUserId) {
          await prisma.subscription.update({
            where: { userId: dilvaUserId },
            data: { status: "PAST_DUE" },
          });
        }
        break;
      }

      default:
        // Unhandled event types are fine to ignore.
        break;
    }
  } catch (err) {
    console.error(`[stripe webhook] failed handling ${event.type}`, err);
    return NextResponse.json({ error: "handler_error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
