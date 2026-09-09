// Dilva service worker — exists ONLY for Web Push (no offline-caching
// / app-shell logic here on purpose, so it can't ever serve a stale
// version of the app; the PWA installability in /install works
// without a service worker at all).

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = { title: "Dilva", body: "" };
  try {
    payload = event.data.json();
  } catch {
    payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Dilva", {
      body: payload.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: payload.url || "/" },
    })
  );
});

// Clicking the notification focuses an already-open Dilva tab if one
// exists (and navigates it), otherwise opens a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
