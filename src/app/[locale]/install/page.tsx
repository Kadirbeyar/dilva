"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  if (isIos) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

/**
 * A shareable link (e.g. dilva.app/install) that walks a visitor straight
 * into installing the PWA on their phone: an in-page "Install" button on
 * Android (via the beforeinstallprompt event), and visual Share -> Add to
 * Home Screen steps on iOS, since Apple doesn't allow triggering that
 * prompt from JS. Detects an already-installed app and offers to open it
 * instead of showing install instructions again.
 */
export default function InstallPage() {
  const t = useTranslations("install");
  const [platform, setPlatform] = useState<Platform>("other");
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    function onAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setInstalling(false);
    if (outcome === "accepted") setDeferredPrompt(null);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — not worth surfacing an error for.
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-hidden px-6 py-14">
      <div className="bg-mesh" aria-hidden="true" />
      <span className="text-4xl font-extrabold tracking-tight text-gradient">Dilva</span>

      {installed ? (
        <section className="mt-10 max-w-sm text-center">
          <h1 className="text-2xl font-bold">{t("alreadyInstalledTitle")}</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">{t("alreadyInstalledDesc")}</p>
          <Link
            href="/nearby"
            className="mt-7 inline-block rounded-full bg-brand-600 px-8 py-3.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            {t("openButton")}
          </Link>
        </section>
      ) : platform === "android" ? (
        <section className="mt-10 w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold">{t("androidTitle")}</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">{t("androidDesc")}</p>
          {deferredPrompt ? (
            <button
              onClick={handleInstallClick}
              disabled={installing}
              className="mt-7 inline-block rounded-full bg-brand-600 px-8 py-3.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60"
            >
              {installing ? t("installing") : t("androidInstallButton")}
            </button>
          ) : (
            <div className="mt-7 rounded-2xl border border-gray-200 p-5 text-start dark:border-gray-700">
              <p className="font-semibold">{t("androidFallbackTitle")}</p>
              <ol className="mt-2 list-inside list-decimal space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                <li>{t("androidFallbackStep1")}</li>
                <li>{t("androidFallbackStep2")}</li>
                <li>{t("androidFallbackStep3")}</li>
              </ol>
            </div>
          )}
        </section>
      ) : platform === "ios" ? (
        <section className="mt-10 w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold">{t("iosTitle")}</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">{t("iosDesc")}</p>
          <div className="mt-7 space-y-4 rounded-2xl border border-gray-200 p-5 text-start dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/40">
                <ShareIcon />
              </span>
              <p className="text-sm text-gray-700 dark:text-gray-200">{t("iosStep1")}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/40">
                <PlusSquareIcon />
              </span>
              <p className="text-sm text-gray-700 dark:text-gray-200">{t("iosStep2")}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg dark:bg-brand-900/40">
                ✅
              </span>
              <p className="text-sm text-gray-700 dark:text-gray-200">{t("iosStep3")}</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-10 w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold">{t("desktopTitle")}</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">{t("desktopDesc")}</p>
          <button
            onClick={handleCopyLink}
            className="mt-7 inline-block rounded-full bg-brand-600 px-8 py-3.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            {copied ? t("linkCopied") : t("copyLinkButton")}
          </button>
        </section>
      )}

      <Link
        href="/"
        className="mt-12 text-sm font-medium text-gray-500 underline-offset-4 hover:underline dark:text-gray-400"
      >
        {t("backToSite")}
      </Link>
    </main>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-brand-700 dark:stroke-brand-300" strokeWidth="2">
      <path d="M12 3v12" strokeLinecap="round" />
      <path d="M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusSquareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-brand-700 dark:stroke-brand-300" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  );
}

// Minimal ambient type for the non-standard beforeinstallprompt event (not in lib.dom.d.ts).
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
