import { countryFlag } from "@/lib/countryFlags";
import { isKurdistanRegionCity } from "@/lib/kurdistanRegion";

export type PostLocationLabel = {
  /** "Kurdistan-Erbil", "Iraq-Basra", "Turkey", etc. */
  text: string;
  /** Emoji flag for a normal country, or "" when isKurdistan (no ISO flag — render KurdistanFlagIcon instead). */
  flagEmoji: string;
  /** True when the Kurdistan-Region override applies — render KurdistanFlagIcon, not flagEmoji. */
  isKurdistan: boolean;
};

/**
 * Builds the small "🇹🇷 Turkey" / "Kurdistan-Erbil" line shown under a
 * user's name in the feed (see PostCard.tsx) and profile header.
 *
 * `country` is always the stored User.country (still plain "Iraq" for
 * everyone there, by design — see lib/kurdistanRegion.ts). When the
 * user's city is a recognized Kurdistan Region town, this swaps the
 * displayed label to "Kurdistan" (with the Kurdistan flag) instead of
 * "Iraq" — a presentation-only override, so matching/filtering
 * elsewhere in the app is unaffected.
 */
export function postLocationLabel(
  country: string | null | undefined,
  city: string | null | undefined
): PostLocationLabel | null {
  if (!country) return null;

  const inKurdistan = country === "Iraq" && isKurdistanRegionCity(city);
  const displayCountry = inKurdistan ? "Kurdistan" : country;
  const text = city ? `${displayCountry}-${city}` : displayCountry;

  return {
    text,
    flagEmoji: inKurdistan ? "" : countryFlag(country),
    isKurdistan: inKurdistan,
  };
}
