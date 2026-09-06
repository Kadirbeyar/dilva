/**
 * Chat message translation.
 *
 * Two backends, picked automatically:
 *
 * 1. LibreTranslate (self-hosted or a paid hosted instance) — used
 *    whenever LIBRETRANSLATE_URL is set. Better quality, no per-call
 *    rate limits, and its "ku" model covers Kurdish reasonably well.
 *    https://github.com/LibreTranslate/LibreTranslate
 *
 * 2. MyMemory (https://mymemory.translated.net) — the default when no
 *    LIBRETRANSLATE_URL is configured. Free, keyless, works with zero
 *    setup, which is why it's the fallback here (previously the
 *    fallback was `http://localhost:5000`, a URL that has never
 *    existed on Vercel, so translation was 100% broken with no config
 *    at all). Trade-off: rate-limited (a few thousand words/day per
 *    IP) and its Kurdish quality is unverified/likely rougher than
 *    LibreTranslate's dedicated model. For a production-quality bar,
 *    set LIBRETRANSLATE_URL (+ LIBRETRANSLATE_API_KEY if needed) to a
 *    real LibreTranslate/Google/DeepL-backed endpoint instead.
 */

const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL;
const LIBRETRANSLATE_API_KEY = process.env.LIBRETRANSLATE_API_KEY || undefined;

const MYMEMORY_URL = "https://api.mymemory.translated.net/get";

export class TranslateError extends Error {}

async function translateWithLibreTranslate(text: string, target: string, source: string): Promise<string> {
  const res = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source,
      target,
      format: "text",
      ...(LIBRETRANSLATE_API_KEY ? { api_key: LIBRETRANSLATE_API_KEY } : {}),
    }),
    // Chat needs this fast — fail rather than hang the UI.
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new TranslateError(`LibreTranslate error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { translatedText: string };
  return data.translatedText;
}

async function translateWithMyMemory(text: string, target: string, source: string): Promise<string> {
  // MyMemory has no real auto-detect; "autodetect" is the documented
  // magic value that comes closest. Quality suffers when the actual
  // source language is unknown — this is inherent to a free, keyless
  // service, not something more retrying fixes.
  const langpair = `${source === "auto" ? "autodetect" : source}|${target}`;
  const url = `${MYMEMORY_URL}?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    throw new TranslateError(`MyMemory error ${res.status}`);
  }

  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
    responseStatus?: number | string;
    responseDetails?: string;
  };

  // MyMemory returns HTTP 200 even for its own internal failures
  // (rate limit, bad langpair, etc.) — the real status is inside the
  // body, so this has to be checked explicitly or failures would look
  // like a successful (garbage) translation instead of an error.
  const status = Number(data.responseStatus ?? 200);
  if (status !== 200 || !data.responseData?.translatedText) {
    throw new TranslateError(`MyMemory error: ${data.responseDetails ?? "no translation returned"}`);
  }

  return data.responseData.translatedText;
}

/**
 * Translates `text` into `target`. `source` can be "auto" to let the
 * backend detect the source language (best-effort on MyMemory — see
 * above).
 */
export async function translateText(text: string, target: string, source = "auto"): Promise<string> {
  if (!text.trim()) return "";

  if (LIBRETRANSLATE_URL) {
    return translateWithLibreTranslate(text, target, source);
  }
  return translateWithMyMemory(text, target, source);
}

/** Maps Dilva's UI/content language codes to the translation backend's ISO codes. */
export function toLibreTranslateCode(dilvaCode: string): string {
  const map: Record<string, string> = {
    "kmr-badini": "ku", // Kurdish (both LibreTranslate and MyMemory's providers key Kurdish as "ku")
    ckb: "ku",
  };
  return map[dilvaCode] ?? dilvaCode;
}
