/**
 * Matches a country name returned by a reverse-geocoding lookup (the
 * browser's GPS coordinates resolved to a country) against Dilva's
 * fixed WORLD_COUNTRIES list (see lib/countries.ts) — used at signup
 * to enforce that the country a new user picks is the one they are
 * actually physically in (item #9 of the Sept 2026 feature list).
 *
 * Reverse-geocoding services don't all return the exact same English
 * short name Dilva's <select> uses ("Ivory Coast" vs "Côte d'Ivoire",
 * "Czech Republic" vs "Czechia", etc.), so this normalizes common
 * variants before comparing. This is a best-effort mapping, not an
 * exhaustive ISO-3166 table — it covers the countries most likely to
 * come back spelled differently.
 */
import { WORLD_COUNTRIES } from "./countries";

const ALIASES: Record<string, string> = {
  "united states of america": "United States",
  usa: "United States",
  "u.s.a.": "United States",
  "u.s.": "United States",
  "united states": "United States",
  uk: "United Kingdom",
  "u.k.": "United Kingdom",
  "great britain": "United Kingdom",
  "great britain and northern ireland": "United Kingdom",
  "russian federation": "Russia",
  "south korea": "South Korea",
  "republic of korea": "South Korea",
  "korea, republic of": "South Korea",
  korea: "South Korea",
  "north korea": "North Korea",
  "korea, democratic people's republic of": "North Korea",
  "democratic people's republic of korea": "North Korea",
  "czech republic": "Czech Republic",
  czechia: "Czech Republic",
  "ivory coast": "Ivory Coast",
  "côte d'ivoire": "Ivory Coast",
  "cote d'ivoire": "Ivory Coast",
  "cote divoire": "Ivory Coast",
  "democratic republic of the congo": "Congo (DRC)",
  "dr congo": "Congo (DRC)",
  "congo-kinshasa": "Congo (DRC)",
  "congo, the democratic republic of the": "Congo (DRC)",
  "republic of the congo": "Congo (Brazzaville)",
  "congo-brazzaville": "Congo (Brazzaville)",
  congo: "Congo (Brazzaville)",
  "myanmar (burma)": "Myanmar",
  burma: "Myanmar",
  "eswatini (swaziland)": "Eswatini",
  swaziland: "Eswatini",
  macedonia: "North Macedonia",
  "republic of north macedonia": "North Macedonia",
  "cape verde": "Cabo Verde",
  "east timor": "Timor-Leste",
  "micronesia, federated states of": "Micronesia",
  "federated states of micronesia": "Micronesia",
  vatican: "Vatican City",
  "holy see": "Vatican City",
  "state of palestine": "Palestine",
  "palestinian territories": "Palestine",
  "palestinian territory": "Palestine",
  "syrian arab republic": "Syria",
  "iran, islamic republic of": "Iran",
  "islamic republic of iran": "Iran",
  "lao people's democratic republic": "Laos",
  "brunei darussalam": "Brunei",
  "bolivia (plurinational state of)": "Bolivia",
  "plurinational state of bolivia": "Bolivia",
  "tanzania, united republic of": "Tanzania",
  "united republic of tanzania": "Tanzania",
  "moldova, republic of": "Moldova",
  "republic of moldova": "Moldova",
  "venezuela (bolivarian republic of)": "Venezuela",
  "bolivarian republic of venezuela": "Venezuela",
  "viet nam": "Vietnam",
  "cabo verde": "Cabo Verde",
  eswatini: "Eswatini",
};

function normalize(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/^the\s+/, "")
    .replace(/\s+/g, " ");
}

const EXACT_BY_NORMALIZED = new Map(WORLD_COUNTRIES.map((c) => [normalize(c), c]));

/**
 * Resolves a raw country name (as returned by a reverse-geocoding
 * API) to the matching entry in WORLD_COUNTRIES, or null if nothing
 * in the fixed list corresponds to it.
 */
export function resolveToWorldCountry(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const n = normalize(raw);
  if (EXACT_BY_NORMALIZED.has(n)) return EXACT_BY_NORMALIZED.get(n)!;
  if (ALIASES[n]) return ALIASES[n];
  return null;
}

/** True if the two country names refer to the same WORLD_COUNTRIES entry. */
export function countriesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ra = resolveToWorldCountry(a) ?? a;
  const rb = resolveToWorldCountry(b) ?? b;
  return normalize(ra) === normalize(rb);
}
