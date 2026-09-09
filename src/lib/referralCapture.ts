const STORAGE_KEY = "dilva_ref";

/**
 * Call once from a client page's effect (landing page, signup page) to
 * remember a `?ref=<username>` link. Deliberately reads
 * window.location.search directly instead of next/navigation's
 * useSearchParams, so callers don't need a <Suspense> boundary just
 * for this — a referral code is a nice-to-have, not worth the extra
 * ceremony.
 *
 * A user can land on the referral link, browse around, and only sign
 * up later — so this is stashed in localStorage (not just read at
 * signup time) and picked up by the onboarding page whenever
 * onboarding actually finishes. Never overwrites an already-stored
 * code with an empty one, so navigating to a ref-less page afterward
 * doesn't erase it.
 */
export function captureReferralFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && ref.trim()) {
      window.localStorage.setItem(STORAGE_KEY, ref.trim());
    }
  } catch {
    // Private browsing / storage disabled — referral capture is best
    // effort, never worth blocking or erroring the page over.
  }
}

/** Reads back whatever referral code was captured, if any. */
export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Called once onboarding succeeds (whether or not a code was actually applied). */
export function clearStoredReferralCode(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore — nothing to clean up if storage isn't available.
  }
}
