import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError, ForbiddenError } from "@/lib/auth";
import { PLAN_CATALOGUE } from "@/lib/plans";

const schema = z.object({ action: z.enum(["approve", "reject"]) });

/**
 * Admin approves or rejects one manual payment claim.
 *
 * Approving does exactly what the Stripe webhook does for a real
 * payment (see app/api/webhooks/stripe/route.ts's syncSubscriptionFromStripe):
 * upsert Subscription as ACTIVE for the claimed plan, record a
 * Payment, and flip User.isPremiumCached — so every other part of the
 * app (the /premium page, requirePremium() gates, etc.) treats it
 * identically to a Stripe payment, no special-casing needed.
 *
 * Sequential awaits throughout, not Promise.all — same
 * connection_limit=1 pooler constraint as everywhere else in this app.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { action } = schema.parse(await req.json());

    const request = await prisma.manualPaymentRequest.findUnique({ where: { id } });
    if (!request) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "already_reviewed" }, { status: 409 });
    }

    if (action === "reject") {
      const updated = await prisma.manualPaymentRequest.update({
        where: { id },
        data: { status: "REJECTED", reviewedAt: new Date(), reviewedById: admin.id },
      });
      await prisma.notification.create({
        data: {
          userId: request.userId,
          type: "MANUAL_PAYMENT_REJECTED",
          data: { manualPaymentRequestId: id },
        },
      });
      return NextResponse.json({ request: updated });
    }

    // action === "approve"
    const { months, priceUsd } = PLAN_CATALOGUE[request.plan];
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + months);

    const subscription = await prisma.subscription.upsert({
      where: { userId: request.userId },
      create: {
        userId: request.userId,
        plan: request.plan,
        status: "ACTIVE",
        priceUsd,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        plan: request.plan,
        status: "ACTIVE",
        priceUsd,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
    });

    await prisma.user.update({
      where: { id: request.userId },
      data: { isPremiumCached: true },
    });

    await prisma.payment.create({
      data: {
        userId: request.userId,
        subscriptionId: subscription.id,
        amountUsd: priceUsd,
        status: "SUCCEEDED",
      },
    });

    await prisma.notification.create({
      data: {
        userId: request.userId,
        type: "SUBSCRIPTION_ACTIVATED",
        data: { plan: request.plan, subscriptionId: subscription.id },
      },
    });

    const updated = await prisma.manualPaymentRequest.update({
      where: { id },
      data: { status: "APPROVED", reviewedAt: now, reviewedById: admin.id },
    });

    return NextResponse.json({ request: updated });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[admin/manual-payments/[id]:PATCH]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
