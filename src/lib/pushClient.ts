"use client";

/**
 * Browser-side half of Web Push: registers public/sw.js, asks for
 * notification permission, and subscribes/unsubscribes with the
 * PushManager. The actual sending happens server-side (lib/webpush.ts)
 * whenever something notification-worthy happens (a new chat message,
 * an admin broadcast).
 */

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Current permission/subscription state, without prompting the user. */
export async function getPushStatus(): Promise<"unsupported" | "denied" | "subscribed" | "unsubscribed"> {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";

  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    return sub ? "subscribed" : "unsubscribed";
  } catch {
    return "unsubscribed";
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Full opt-in flow: registers the service worker, prompts for
 * notification permission (a no-op if already granted), subscribes
 * with the VAPID public key, and saves the subscription server-side.
 * Returns false (without throwing) for anything short of success — a
 * declined permission prompt is a normal outcome, not an error.
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // The DOM lib's BufferSource type and Uint8Array's own generic
      // ArrayBufferLike parameter disagree across TS/lib versions even
      // though this is exactly the shape the Push API expects at
      // runtime — cast rather than fight the type checker over it.
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource,
    });
  }

  const json = sub.toJSON();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    }),
  });
  return res.ok;
}

/** Unsubscribes this device from push, both in the browser and on the server. */
export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;

  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  }).catch(() => {});
}
