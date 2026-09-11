/**
 * Cities/towns inside the Kurdistan Region of Iraq (KRG) — the four
 * officially recognized governorates: Erbil (Hewlêr), Duhok (Dihok),
 * Sulaymaniyah (Slêmanî), and Halabja. Used purely for DISPLAY: when a
 * Dilva user's country is "Iraq" (see lib/countries.ts) but their
 * onboarding-detected city (see onboarding/page.tsx's reverse-geocode
 * lookup) falls inside this region, the feed/profile UI shows
 * "Kurdistan" instead of "Iraq" next to their name — see
 * lib/postLocationLabel.ts.
 *
 * This intentionally does NOT change the stored User.country value
 * itself (still plain "Iraq", matching lib/countries.ts's fixed list)
 * — lib/matching.ts's country filter and everything else that reads
 * User.country keep working exactly as before. It's a label swap in
 * the UI only.
 *
 * Deliberately limited to the KRG's own administrative governorates,
 * not the wider set of Kurdish-populated but federally/disputed
 * territories (Kirkuk, Sinjar, Makhmur, Khanaqin, Tuz Khurmatu, etc.)
 * — those aren't part of the Kurdistan Region as officially
 * constituted, so leaving them out keeps this a factual boundary, not
 * a political claim.
 *
 * City names are whatever a reverse-geocoder (or a user typing their
 * own city) is likely to return — common English transliterations and
 * their usual spelling variants — matched case-insensitively.
 */
export const KURDISTAN_REGION_CITIES: string[] = [
  // Erbil governorate
  "Erbil",
  "Arbil",
  "Hewler",
  "Hawler",
  "Ainkawa",
  "Ankawa",
  "Shaqlawa",
  "Shaklawa",
  "Koya",
  "Koysinjaq",
  "Soran",
  "Rawanduz",
  "Rwandiz",
  "Choman",
  "Mergasur",
  "Khabat",
  "Harir",
  "Diyana",
  "Hiran",
  "Salahaddin",

  // Duhok governorate
  "Duhok",
  "Dohuk",
  "Dahuk",
  "Zakho",
  "Amedi",
  "Amadiya",
  "Akre",
  "Aqrah",
  "Sheikhan",
  "Shekhan",
  "Bardarash",
  "Semel",
  "Simele",
  "Zawita",
  "Sarsang",
  "Batufa",
  "Fayda",
  "Mangesh",
  "Kalak",

  // Sulaymaniyah governorate
  "Sulaymaniyah",
  "Sulaimaniyah",
  "Slemani",
  "As Sulaymaniyah",
  "Ranya",
  "Rania",
  "Chamchamal",
  "Kalar",
  "Kifri",
  "Dukan",
  "Penjwin",
  "Sharbazher",
  "Sharazoor",
  "Said Sadiq",
  "Qaladize",
  "Qala Diza",
  "Darbandikhan",
  "Pshdar",
  "Bazian",

  // Halabja governorate
  "Halabja",
  "Khurmal",
  "Byara",
  "Sirwan",
];

const NORMALIZED = new Set(KURDISTAN_REGION_CITIES.map((c) => c.trim().toLowerCase()));

/** True if `city` is a recognized Kurdistan Region (Iraq) city/town. */
export function isKurdistanRegionCity(city: string | null | undefined): boolean {
  if (!city) return false;
  return NORMALIZED.has(city.trim().toLowerCase());
}
