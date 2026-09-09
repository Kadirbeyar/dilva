/**
 * Optional image-moderation hook for avatar/post-photo uploads. Runs
 * AFTER the file is already in Supabase Storage (that's the only way
 * to hand an external API a plain https:// URL to look at, rather
 * than proxying raw bytes through our own serverless function) — if a
 * check comes back unsafe, the caller (see the two Uploader
 * components) deletes the just-uploaded file again.
 *
 * Deliberately fail-open: if no provider is configured, or the
 * provider's API errors/times out/is unreachable, this returns
 * `{ safe: true }` rather than blocking the upload. A misconfigured or
 * temporarily-down moderation vendor should never be able to take
 * photo uploads down for the whole app — the tradeoff this makes is
 * "sometimes an image isn't checked" rather than "sometimes nobody can
 * post a photo".
 *
 * Currently wired up for Sightengine (sightengine.com), which has a
 * free tier (a few hundred checks/month) and a simple REST API — but
 * any provider can be added by writing another branch here; nothing
 * else in the app needs to change. To enable, set in .env / Vercel:
 *   MODERATION_PROVIDER=sightengine
 *   SIGHTENGINE_API_USER=...
 *   SIGHTENGINE_API_SECRET=...
 * Leave MODERATION_PROVIDER unset to disable moderation entirely
 * (every image is treated as safe, exactly like before this feature
 * existed).
 */

export type ModerationResult = { safe: boolean; reason?: string };

// Anything scoring at or above this on a 0-1 scale from Sightengine's
// nudity/offensive/gore models is rejected. Nudity's "sexual_activity"
// and "sexual_display" sub-scores are checked at a stricter threshold
// since those are the highest-consequence false negatives.
const STRICT_THRESHOLD = 0.5;
const LENIENT_THRESHOLD = 0.75;

async function checkWithSightengine(imageUrl: string): Promise<ModerationResult> {
  const apiUser = process.env.SIGHTENGINE_API_USER;
  const apiSecret = process.env.SIGHTENGINE_API_SECRET;
  if (!apiUser || !apiSecret) return { safe: true };

  const params = new URLSearchParams({
    url: imageUrl,
    models: "nudity-2.1,offensive,gore",
    api_user: apiUser,
    api_secret: apiSecret,
  });

  const res = await fetch(`https://api.sightengine.com/1.0/check.json?${params.toString()}`, {
    // Sightengine's own docs recommend a generous timeout — moderation
    // isn't in a user-blocking critical path (see the callers), so
    // this doesn't need to be fast, just bounded.
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Sightengine responded ${res.status}`);

  const data = await res.json();

  const sexualActivity = data?.nudity?.sexual_activity ?? 0;
  const sexualDisplay = data?.nudity?.sexual_display ?? 0;
  const erotica = data?.nudity?.erotica ?? 0;
  const offensive = data?.offensive?.prob ?? 0;
  const gore = data?.gore?.prob ?? 0;

  if (sexualActivity >= STRICT_THRESHOLD || sexualDisplay >= STRICT_THRESHOLD) {
    return { safe: false, reason: "nudity" };
  }
  if (erotica >= LENIENT_THRESHOLD || offensive >= LENIENT_THRESHOLD || gore >= LENIENT_THRESHOLD) {
    return { safe: false, reason: "offensive" };
  }
  return { safe: true };
}

export async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  const provider = process.env.MODERATION_PROVIDER;
  if (!provider) return { safe: true };

  try {
    switch (provider) {
      case "sightengine":
        return await checkWithSightengine(imageUrl);
      default:
        console.error(`[moderation] Unknown MODERATION_PROVIDER "${provider}" — treating as unconfigured`);
        return { safe: true };
    }
  } catch (err) {
    console.error("[moderation] check failed, failing open", err);
    return { safe: true };
  }
}
