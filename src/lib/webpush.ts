import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:qader.doski41@gmail.com";

const configured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
if (configured) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!);
}

export type PushPayload = {
  title: string;
  body: string;
  /** Path (e.g. "/chat/abc123") opened when the notification is clicked — see public/sw.js. */
  url?: string;
};

/**
 * Sends a Web Push notification to every device `userId` has
 * subscribed from. A no-op (silently) when VAPID keys aren't
 * configured — see .env.example / the deploy notes — so shipping this
 * feature never requires touching every call site again once keys are
 * added later.
 *
 * Sending itself talks to Google/Mozilla/etc.'s push services, not our
 * own DB, so those requests run in parallel; the one DB write this
 * does (dropping subscriptions the push service reports as gone) is a
 * single deleteMany, not a per-row query, so it stays friendly to the
 * connection_limit=1 pooler like everything else in this codebase.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!configured) return;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const deadEndpoints: string[] = [];

  await Promise.all(
    subs.map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // Push service confirms this subscription no longer exists
          // (uninstalled, site data cleared, etc.) — safe to forget.
          deadEndpoints.push(sub.endpoint);
        } else {
          console.error("[webpush] send failed", status, err);
        }
      }
    })
  );

  if (deadEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: deadEndpoints } } });
  }
}

/**
 * Same as sendPushToUser, but for many recipients at once (the admin
 * broadcast). Runs per-user sequentially rather than
 * Promise.all-across-everyone, since each call already does its own
 * findMany — fanning ALL of those out in parallel against a
 * connection_limit=1 pool would just queue up and risk a timeout on a
 * broadcast to a large user base.
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  if (!configured) return;
  for (const userId of userIds) {
    await sendPushToUser(userId, payload);
  }
}

export const isPushConfigured = configured;
