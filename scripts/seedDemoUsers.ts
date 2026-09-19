/**
 * SEEDS ~20-30 DEMO PROFILES — populates the feed/profile pages with
 * realistic-looking Kurdish/Iraqi users so the app doesn't look empty
 * while there are few or no real users yet. Same trick as
 * scripts/loadtest.ts (public.users has no hard FK to auth.users, see
 * prisma/sql/00_auth_trigger.sql), but unlike that script this one
 * does NOT delete what it creates — these rows are meant to stay.
 *
 * Because these accounts have no matching row in Supabase's
 * auth.users, nobody can sign in as them (no email/password exists
 * for them anywhere) — they exist purely as content: profiles, posts,
 * and follows for real visitors to see and browse. Avatars are
 * cartoon-style (DiceBear), not photos of real people, and the seeded
 * email addresses use a non-deliverable @dilva-demo.local domain
 * (never shown publicly — see the `email` field's comment in
 * schema.prisma) so nothing here can be mistaken for, or collide
 * with, a real person's inbox.
 *
 * IMPORTANT: once your app has real users, consider removing or
 * clearly retiring these — a language-exchange app's whole point is
 * to connect people with real other people, and an account that can
 * never reply back is a bad surprise for someone who messages it
 * hoping for a real conversation. Deleting one is a normal
 * `prisma.user.delete({ where: { username } })` — cascades to its
 * posts/follows automatically (see schema.prisma's onDelete: Cascade
 * on every User relation).
 *
 * Run with:  npx tsx scripts/seedDemoUsers.ts [count]
 *   count defaults to 25 (range asked for: 20-30).
 *
 * Same connection_limit=1 pooler constraint as everywhere else in
 * this app (see lib/prisma.ts) — every step below is a single bulk
 * createMany, not a per-row loop, and steps run sequentially, never
 * in parallel.
 */
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

const COUNT = Math.max(20, Math.min(30, Number(process.argv[2] ?? 25)));

// ── Name pools ──────────────────────────────────────────────────
const MALE_FIRST = [
  "Aram", "Dilan", "Rebin", "Zana", "Sherwan", "Sipan", "Bahoz", "Rojhat",
  "Newzad", "Dildar", "Kawa", "Berzan", "Hoshyar", "Shvan", "Ranj",
  "Sarbast", "Rawand", "Rustam", "Zeravan", "Delshad",
];
const FEMALE_FIRST = [
  "Berivan", "Newroz", "Ronahi", "Helin", "Sozdar", "Gulistan", "Nazdar",
  "Shirin", "Avan", "Rojin", "Shilan", "Diman", "Zin", "Baran", "Avesta",
  "Sara", "Rewshen", "Roza", "Hana", "Jiyan",
];
const SURNAMES = [
  "Barwari", "Zebari", "Dosky", "Berwari", "Slevani", "Amedi", "Sharafani",
  "Khoshnaw", "Rekani", "Sinjari", "Botani", "Zaxoyi", "Duhoki", "Akrayi",
  "Kocher", "Hakari",
];

// City + the country label the user actually types on their profile —
// on purpose a realistic mix of "Iraq" and "Kurdistan", since real
// users in this region type either.
const PLACES: { city: string; country: string }[] = [
  { city: "Duhok", country: "Kurdistan" },
  { city: "Zakho", country: "Kurdistan" },
  { city: "Akre", country: "Kurdistan" },
  { city: "Amedi", country: "Kurdistan" },
  { city: "Hewler", country: "Kurdistan" },
  { city: "Sulaymaniyah", country: "Kurdistan" },
  { city: "Koya", country: "Kurdistan" },
  { city: "Duhok", country: "Iraq" },
  { city: "Hewler", country: "Iraq" },
  { city: "Kirkuk", country: "Iraq" },
  { city: "Baghdad", country: "Iraq" },
  { city: "Mosul", country: "Iraq" },
  { city: "Basra", country: "Iraq" },
];

const BIOS_KU = [
  "سلاڤ، ئەز ژ دهۆکێ مه. حەز ژ فێربوونا ئینگلیزی و ئاشنابوونا هەڤالێن نوی دکەم 🌍",
  "خوازیارێ فێربوونا زمانان م، بەتایبەتی تورکی و عەرەبی. با ئێک ژ یێک فێر بین!",
  "موزیک، گەشتیاری و زمان — سێ تشتێن کو ژ دلێ خۆشدڤێن. ئامادەم بۆ چاکسازیا نڤیسینا خۆ.",
  "فێرخوازێ ئینگلیزی م، هەرگیز فرسەندێ گفتوگۆیێ ب دەست نادەم ٭ Let's practice together",
  "ژیانا ڕۆژانە، وێنە و چیرۆکێن کورت — ئەڤە یا ئەز ل ڤێرێ پارڤە دکەم.",
  "حەزژ خواندنێ و گەشتیاریێ دکەم، دلخوازە ب هەڤالان ڕا زمانان فێر ببم.",
  "کوردەکێ دهۆکی مە کو حەز ژ زمانان دکەت — ئێستا ل سەر فرەنسی کار دکەم.",
  "هونەرمەند و خوازیارێ وێنەگرتنێ. ب دلخوازی وێنێن خۆ ل ڤێرێ پارڤە دکەم.",
  "خوینکارێ زانکۆیێ م، ل هەولێرێ دژیم، حەز ژ ناسینا کولتوورێن نوی دکەم.",
  "دەنگبێژ و حەزژ مۆزیکێ، بەلێ نوکە فۆکەسا من ل سەر فێربوونا ئەلمانی یە.",
  "دایکەکا دوو زاروکان، ل دویڤ کاتی بۆ خۆ زمانان فێر دبم — هێڤیدارم هەڤالان ب دەست بینم.",
  "کارمەندێ IT، ل شکەفتێن کاتی حەز ژ خواندنا پەرتووکان و نڤیسینا شیعران دکەم.",
];

const POST_TEXTS_KU = [
  "ئەڤرۆ ڕۆژەکا خۆش بوو، گەشتەکا بچووک بۆ ناڤچەیێ کۆن یێ شارۆچکێ 🌇",
  "فێربوونا زمانەکێ نوی وەکو ڤەکرنا دەرگەیەکا نوی یە بۆ جیهانەکا نوی.",
  "ئەڤرۆ فنجانەکا قاوەیێ ل گەل هەڤالەکێ نڤیساندنێ — گفتوگۆیەکا خۆش بوو دەربارەی زمانان.",
  "کێ دزانیت چەند وشەیێن باشی ل ڤێ ئەپێ فێردبم؟ هەر ڕۆژ وشەیەکا نوی 📖",
  "وێنەیەکێ ژ گەشتا دویندا — شوینەکێ گەلەکی جوان بوو.",
  "پرسیارەک: کێ دخوازیت ب کوردی ب دەگل من گفتوگۆیێ بکەت؟ 🙌",
  "ئەڤشەڤێ فلیمەکێ ب زمانێ ئینگلیزی دیت، بێ ژێرنڤیس — کارەکێ باش بوو بۆ گوهداریێ.",
  "خواستنا هەڤالان بۆ پراکتیزەکرنا زمانان — کێ ئامادەیە؟",
  "چیرۆکەکا کورت ژ ژیانا ڕۆژانە، ب هیڤیا کو یا خۆشحاڵکەر بیت بۆ هەوە.",
  "پارڤەکرنا وێنەیەکێ ژ ژووریا خواندنێ — شوینێ کارێ من یێ خۆشترین.",
];

const NATIVE_LANGS = ["kmr-badini", "ckb"];
const LEARNING_LANGS = ["en", "tr", "ar", "de", "fr", "es"];
const PROFICIENCIES = ["BEGINNER", "ELEMENTARY", "INTERMEDIATE", "ADVANCED"] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickSome<T>(arr: readonly T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function main() {
  console.log(`Seeding ${COUNT} demo profiles...`);

  const usedUsernames = new Set<string>();
  const userIds: string[] = [];
  const userRows = Array.from({ length: COUNT }, (_, i) => {
    const isMale = i % 2 === 0;
    const first = isMale ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
    const last = pick(SURNAMES);
    const place = pick(PLACES);
    const id = randomUUID();
    userIds.push(id);

    let username = `${slugify(first)}${slugify(last)}`;
    while (usedUsernames.has(username)) {
      username = `${slugify(first)}${slugify(last)}${Math.floor(Math.random() * 1000)}`;
    }
    usedUsernames.add(username);

    // DiceBear "avataaars" — illustrated, not a photo of a real
    // person, seeded per-username so each demo profile keeps a
    // consistent look across visits.
    const avatarUrl = `https://api.dicebear.com/9.x/avataaars/png?seed=${encodeURIComponent(
      username
    )}&backgroundType=gradientLinear`;

    // Spread signup dates over the last ~4 months so the app doesn't
    // look like it launched all 25 accounts in the same second.
    const createdAt = new Date(Date.now() - Math.floor(Math.random() * 120) * 24 * 60 * 60 * 1000);

    return {
      id,
      username,
      email: `${username}@dilva-demo.local`,
      displayName: `${first} ${last}`,
      bio: pick(BIOS_KU),
      gender: isMale ? "MALE" : "FEMALE",
      country: place.country,
      city: place.city,
      avatarUrl,
      createdAt,
    } as const;
  });

  await prisma.user.createMany({ data: userRows as any });
  console.log(`  ${userRows.length} users created.`);

  console.log("Assigning languages (1 native + 1-2 learning per user)...");
  const languageRows = userRows.flatMap((u) => {
    const native = u.country === "Iraq" && Math.random() < 0.3 ? "ckb" : "kmr-badini";
    const learning = pickSome(LEARNING_LANGS, 1 + Math.round(Math.random()));
    return [
      {
        userId: u.id,
        languageCode: native,
        type: "NATIVE" as const,
        isPrimary: true,
      },
      ...learning.map((code, idx) => ({
        userId: u.id,
        languageCode: code,
        type: "LEARNING" as const,
        proficiency: pick(PROFICIENCIES),
        isPrimary: idx === 0,
      })),
    ];
  });
  await prisma.userLanguage.createMany({ data: languageRows as any, skipDuplicates: true });
  console.log(`  ${languageRows.length} language rows created.`);

  console.log("Creating 2-3 posts per user...");
  const postRows = userRows.flatMap((u) => {
    const postCount = 2 + Math.round(Math.random()); // 2 or 3
    return Array.from({ length: postCount }, (_, i) => {
      const hasImage = Math.random() < 0.5;
      return {
        authorId: u.id,
        content: pick(POST_TEXTS_KU),
        imageUrl: hasImage ? `https://picsum.photos/seed/${u.username}-${i}/900/700` : null,
        createdAt: new Date(u.createdAt.getTime() + (i + 1) * 6 * 60 * 60 * 1000),
      };
    });
  });
  await prisma.post.createMany({ data: postRows as any });
  console.log(`  ${postRows.length} posts created.`);

  console.log("Creating follow relationships between the demo users...");
  const followRows: { followerId: string; followingId: string }[] = [];
  for (let i = 0; i < userIds.length; i++) {
    for (let j = i + 1; j < userIds.length; j++) {
      // ~40% of pairs follow each other (both directions) — dense
      // enough to feel like an active little community, not a
      // suspicious full clique where literally everyone follows
      // literally everyone.
      if (Math.random() < 0.4) {
        followRows.push({ followerId: userIds[i], followingId: userIds[j] });
        followRows.push({ followerId: userIds[j], followingId: userIds[i] });
      }
    }
  }
  await prisma.follow.createMany({ data: followRows, skipDuplicates: true });
  console.log(`  ${followRows.length} follow rows created.`);

  console.log("\nDone. Demo usernames:");
  console.log(userRows.map((u) => u.username).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
