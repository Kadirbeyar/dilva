/**
 * Seeds the Language reference table.
 * Run with: npm run db:seed  (or `npx tsx prisma/seed.ts`)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// The three UI languages (ku/tr/en) are always first — every other
// language here is available as a nativeLanguage / targetLanguage
// choice for language-exchange matching, same as HelloTalk's catalogue.
// This list intentionally covers the world's major languages so any
// two users, anywhere, can find each other — flags for these are
// rendered on the frontend (see src/lib/languageFlags.ts), not stored
// here, so this table never needs a migration to add one.
const languages = [
  { code: "kmr-badini", name: "Kurdish (Badini)", nativeName: "کوردی (بادینی)", isRtl: true },
  { code: "ckb", name: "Kurdish (Sorani)", nativeName: "کوردیی سۆرانی", isRtl: true },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", isRtl: false },
  { code: "en", name: "English", nativeName: "English", isRtl: false },
  { code: "ar", name: "Arabic", nativeName: "العربية", isRtl: true },
  { code: "fa", name: "Persian", nativeName: "فارسی", isRtl: true },
  { code: "es", name: "Spanish", nativeName: "Español", isRtl: false },
  { code: "fr", name: "French", nativeName: "Français", isRtl: false },
  { code: "de", name: "German", nativeName: "Deutsch", isRtl: false },
  { code: "it", name: "Italian", nativeName: "Italiano", isRtl: false },
  { code: "ru", name: "Russian", nativeName: "Русский", isRtl: false },
  { code: "ja", name: "Japanese", nativeName: "日本語", isRtl: false },
  { code: "ko", name: "Korean", nativeName: "한국어", isRtl: false },
  { code: "zh", name: "Chinese (Mandarin)", nativeName: "中文", isRtl: false },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", isRtl: false },
  { code: "ur", name: "Urdu", nativeName: "اردو", isRtl: true },
  { code: "pt", name: "Portuguese", nativeName: "Português", isRtl: false },

  // ── Europe ──────────────────────────────────────────────
  { code: "nl", name: "Dutch", nativeName: "Nederlands", isRtl: false },
  { code: "sv", name: "Swedish", nativeName: "Svenska", isRtl: false },
  { code: "no", name: "Norwegian", nativeName: "Norsk", isRtl: false },
  { code: "da", name: "Danish", nativeName: "Dansk", isRtl: false },
  { code: "fi", name: "Finnish", nativeName: "Suomi", isRtl: false },
  { code: "pl", name: "Polish", nativeName: "Polski", isRtl: false },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", isRtl: false },
  { code: "cs", name: "Czech", nativeName: "Čeština", isRtl: false },
  { code: "sk", name: "Slovak", nativeName: "Slovenčina", isRtl: false },
  { code: "ro", name: "Romanian", nativeName: "Română", isRtl: false },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", isRtl: false },
  { code: "bg", name: "Bulgarian", nativeName: "Български", isRtl: false },
  { code: "sr", name: "Serbian", nativeName: "Српски", isRtl: false },
  { code: "hr", name: "Croatian", nativeName: "Hrvatski", isRtl: false },
  { code: "bs", name: "Bosnian", nativeName: "Bosanski", isRtl: false },
  { code: "sl", name: "Slovenian", nativeName: "Slovenščina", isRtl: false },
  { code: "sq", name: "Albanian", nativeName: "Shqip", isRtl: false },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", isRtl: false },
  { code: "he", name: "Hebrew", nativeName: "עברית", isRtl: true },
  { code: "lt", name: "Lithuanian", nativeName: "Lietuvių", isRtl: false },
  { code: "lv", name: "Latvian", nativeName: "Latviešu", isRtl: false },
  { code: "et", name: "Estonian", nativeName: "Eesti", isRtl: false },
  { code: "is", name: "Icelandic", nativeName: "Íslenska", isRtl: false },
  { code: "ga", name: "Irish", nativeName: "Gaeilge", isRtl: false },
  { code: "cy", name: "Welsh", nativeName: "Cymraeg", isRtl: false },
  { code: "ca", name: "Catalan", nativeName: "Català", isRtl: false },
  { code: "eu", name: "Basque", nativeName: "Euskara", isRtl: false },
  { code: "gl", name: "Galician", nativeName: "Galego", isRtl: false },

  // ── Africa ──────────────────────────────────────────────
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans", isRtl: false },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", isRtl: false },
  { code: "am", name: "Amharic", nativeName: "አማርኛ", isRtl: false },
  { code: "ha", name: "Hausa", nativeName: "Hausa", isRtl: false },
  { code: "yo", name: "Yoruba", nativeName: "Yorùbá", isRtl: false },
  { code: "ig", name: "Igbo", nativeName: "Igbo", isRtl: false },
  { code: "zu", name: "Zulu", nativeName: "isiZulu", isRtl: false },
  { code: "so", name: "Somali", nativeName: "Soomaali", isRtl: false },
  { code: "mg", name: "Malagasy", nativeName: "Malagasy", isRtl: false },

  // ── South & Southeast Asia ──────────────────────────────
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", isRtl: false },
  { code: "th", name: "Thai", nativeName: "ไทย", isRtl: false },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", isRtl: false },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", isRtl: false },
  { code: "tl", name: "Filipino", nativeName: "Filipino", isRtl: false },
  { code: "km", name: "Khmer", nativeName: "ខ្មែរ", isRtl: false },
  { code: "lo", name: "Lao", nativeName: "ລາວ", isRtl: false },
  { code: "my", name: "Burmese", nativeName: "မြန်မာ", isRtl: false },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", isRtl: false },
  { code: "si", name: "Sinhala", nativeName: "සිංහල", isRtl: false },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", isRtl: false },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", isRtl: false },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", isRtl: false },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", isRtl: false },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", isRtl: false },
  { code: "mr", name: "Marathi", nativeName: "मराठी", isRtl: false },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", isRtl: false },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", isRtl: false },

  // ── Central & West Asia ─────────────────────────────────
  { code: "ps", name: "Pashto", nativeName: "پښتو", isRtl: true },
  { code: "prs", name: "Dari", nativeName: "دری", isRtl: true },
  { code: "az", name: "Azerbaijani", nativeName: "Azərbaycan", isRtl: false },
  { code: "uz", name: "Uzbek", nativeName: "Oʻzbek", isRtl: false },
  { code: "kk", name: "Kazakh", nativeName: "Қазақ", isRtl: false },
  { code: "ky", name: "Kyrgyz", nativeName: "Кыргызча", isRtl: false },
  { code: "mn", name: "Mongolian", nativeName: "Монгол", isRtl: false },
  { code: "ka", name: "Georgian", nativeName: "ქართული", isRtl: false },
  { code: "hy", name: "Armenian", nativeName: "Հայերեն", isRtl: false },

  // ── Other ───────────────────────────────────────────────
  { code: "yue", name: "Cantonese", nativeName: "粵語", isRtl: false },
  { code: "ht", name: "Haitian Creole", nativeName: "Kreyòl Ayisyen", isRtl: false },
];

async function main() {
  for (const lang of languages) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: lang,
      create: lang,
    });
  }
  console.log(`Seeded ${languages.length} languages.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
