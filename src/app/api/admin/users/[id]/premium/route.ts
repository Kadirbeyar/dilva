import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError, ForbiddenError } from "@/lib/auth";
import { PLAN_CATALOGUE, isValidPlan } from "@/lib/plans";

const schema = z.object({
  action: z.enum(["grant", "cancel"]),
  plan: z.string().optional(),
});

/**
 * Admin hand-grants or hand-cancels Premium for a specific user — for
 * the people who reach out on WhatsApp/etc. because they can't use any
 * of the payment methods on /premium (see ManualPaymentForm's WhatsApp
 * fallback link) and get set up manually instead. See
 * components/admin/UserPremiumPanel.tsx for the admin UI.
 *
 * Sequential awaits, not Promise.all — same connection_limit=1 pooler
 * constraint as every other multi-query admin route in this app.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: userId } = await params;
    const body = schema.parse(await req.json());

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (body.action === "grant") {
      if (!body.plan || !isValidPlan(body.plan)) {
        return NextResponse.json({ error: "validation_error" }, { status: 400 });
      }
      const plan = body.plan;
      const { months, priceUsd } = PLAN_CATALOGUE[plan];
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + months);

      // Deliberately does NOT create a Payment record — this is a free,
      // admin-granted Premium period (no money actually changed hands
      // through Dilva), same reasoning as the referral bonus in
      // lib/referral.ts never creating one either.
      const subscription = await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan,
          status: "ACTIVE",
          priceUsd,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        update: {
          plan,
          status: "ACTIVE",
          priceUsd,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { isPremiumCached: true },
      });

      await prisma.notification.create({
        data: {
          userId,
          type: "SUBSCRIPTION_ACTIVATED",
          data: { plan, subscriptionId: subscription.id, grantedByAdmin: true },
        },
      });

      return NextResponse.json({
        user: { isPremiumCached: true, premiumBonusUntil: null },
        subscription: {
          plan: subscription.plan,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
      });
    }

    // action === "cancel" — cuts off BOTH a real/granted subscription
    // and any active referral bonus, so "cancel Premium" from the
    // admin panel always actually means no more Premium access,
    // whichever of the two was granting it.
    const existing = await prisma.subscription.findUnique({ where: { userId } });
    let subscription = existing;
    if (existing) {
      subscription = await prisma.subscription.update({
        where: { userId },
        data: { status: "CANCELED", cancelAtPeriodEnd: true },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isPremiumCached: false, premiumBonusUntil: null },
    });

    return NextResponse.json({
      user: {
        isPremiumCached: updatedUser.isPremiumCached,
        premiumBonusUntil: updatedUser.premiumBonusUntil,
      },
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
    });
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
    console.error("[admin/users/[id]/premium:POST]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
