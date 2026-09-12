"use client";

import { useEffect } from "react";

/**
 * A casual-user deterrent against opening DevTools / viewing page
 * source — NOT real protection. Please read this before assuming it
 * "hides the code":
 *
 *   - It blocks the common keyboard shortcuts (F12, Ctrl/Cmd+Shift+I/J/C,
 *     Ctrl/Cmd+U) and the right-click context menu.
 *   - Any of these still get past it in seconds: opening DevTools from
 *     the browser's own menu (⋮ → More tools → Developer tools), typing
 *     view-source: in the address bar, using a different browser/device,
 *     or just disabling JavaScript for the page before it loads.
 *   - The browser has to download the full HTML/CSS/JS to render the
 *     page at all — that source is never actually secret, no matter
 *     what a page's JS tries to block. Anything that truly must stay
 *     hidden (API keys, business logic, the database) has to live on
 *     the server, never in this bundle — see this app's API routes,
 *     which is exactly where that already lives.
 *
 * Only active in production, so local development (`npm run dev`)
 * still has normal DevTools access for debugging.
 */
export default function DevToolsGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    function blockKeys(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      const isDevToolsShortcut =
        key === "f12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(key)) ||
        ((e.ctrlKey || e.metaKey) && key === "u");
      if (isDevToolsShortcut) {
        e.preventDefault();
      }
    }
    function blockContextMenu(e: MouseEvent) {
      e.preventDefault();
    }

    document.addEventListener("keydown", blockKeys);
    document.addEventListener("contextmenu", blockContextMenu);
    return () => {
      document.removeEventListener("keydown", blockKeys);
      document.removeEventListener("contextmenu", blockContextMenu);
    };
  }, []);

  return null;
}
