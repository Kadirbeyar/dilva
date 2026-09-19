/**
 * SEEDS ~20-30 DEMO PROFILES — populates the feed/profile pages with
 * realistic-looking Kurdish & Arabic-speaking Iraqi/Kurdistani users
 * so the app doesn't look empty while there are few or no real users
 * yet. Same trick as scripts/loadtest.ts (public.users has no hard FK
 * to auth.users, see prisma/sql/00_auth_trigger.sql), but unlike that
 * script this one does NOT delete what it creates — these rows are
 * meant to stay (unless you pass --reset, see below).
 *
 * Because these accounts have no matching row in Supabase's
 * auth.users, nobody can sign in as them (no email/password exists
 * for them anywhere) — they exist purely as content: profiles, posts,
 * likes, comments and follows for real visitors to see and browse.
 * Avatars are illustrated (DiceBear), not photos of real people, and
 * the seeded email addresses use a non-deliverable @dilva-demo.local
 * domain (never shown publicly — see the `email` field's comment in
 * schema.prisma) so nothing here can be mistaken for, or collide
 * with, a real person's inbox.
 *
 * Avatar/post images are served from api.dicebear.com and
 * picsum.photos — both must be listed in next.config.js's
 * images.remotePatterns (already added alongside this script) or
 * next/image will refuse to render them.
 *
 * IMPORTANT: once your app has real users, consider removing or
 * clearly retiring these — a language-exchange app's whole point is
 * to connect people with real other people, and an account that can
 * never reply back is a bad surprise for someone who messages it
 * hoping for a real conversation. Deleting one is a normal
 * `prisma.user.delete({ where: { username } })` — cascades to its
 * posts/likes/comments/follows automatically (see schema.prisma's
 * onDelete: Cascade on every User relation).
 *
 * Run with:  npx tsx scripts/seedDemoUsers.ts [count] [--reset]
 *   count   defaults to 25 (range asked for: 20-30)
 *   --reset first deletes every previously-seeded demo user (matched
 *           by the @dilva-demo.local email domain, so it never
 *           touches a real account) before creating a fresh batch —
 *           use this to re-run after a content change instead of
 *           piling up a second batch alongside the first.
 *
 * Same connection_limit=1 pooler constraint as everywhere else in
 * this app (see lib/prisma.ts) — every step below is a single bulk
 * createMany, not a per-row loop, and steps run sequentially, never
 * in parallel.
 */
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const RESET = args.includes("--reset");
const COUNT = Math.max(20, Math.min(30, Number(args.find((a) => /^\d+$/.test(a)) ?? 25)));

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

// Each demo user writes in ONE of these two content languages
// (bio + posts) — mostly Kurdish, with a real Arabic-speaking
// minority mixed in, same as the actual population of Iraq/Kurdistan.
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
const BIOS_AR = [
  "مرحباً، أنا من دهوك. أحب تعلم اللغات والتعرف على أصدقاء جدد 🌍",
  "أبحث عن أصدقاء لتبادل اللغة، خاصة الإنجليزية والتركية.",
  "الموسيقى والسفر واللغات — أشياء أحبها كثيراً. أرحّب بأي تصحيح لكتابتي.",
  "أتعلم الإنجليزية ولا أفوّت أي فرصة للمحادثة، Let's practice together!",
  "أشارك هنا لحظات من حياتي اليومية، صور وقصص قصيرة.",
  "أحب القراءة والسفر، وأتمنى تعلم اللغات مع أصدقاء جدد.",
  "من أربيل، أحب التعرف على ثقافات جديدة وتعلم لغات مختلفة.",
  "طالبة جامعية، أحب اكتشاف ثقافات وأشخاص جدد من مختلف أنحاء العالم.",
  "موظف، في أوقات فراغي أحب القراءة وتعلم لغات جديدة.",
  "أحب الموسيقى كثيراً، وأعمل حالياً على تحسين لغتي الألمانية.",
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
const POST_TEXTS_AR = [
  "يوم جميل اليوم، جولة صغيرة في المدينة القديمة 🌇",
  "تعلّم لغة جديدة أشبه بفتح باب جديد لعالم جديد.",
  "فنجان قهوة مع صديقة اليوم، ونقاش جميل عن اللغات.",
  "من يريد التحدث معي بالعربية أو الكردية؟ 🙌",
  "صورة من رحلة الأسبوع الماضي — مكان جميل جداً.",
  "شاهدت فيلماً بالإنجليزية بدون ترجمة، تمرين جيد للاستماع.",
  "أبحث عن أصدقاء لممارسة اللغات معهم — من مستعد؟",
  "قصة قصيرة من الحياة اليومية، أتمنى أن تعجبكم.",
];

const COMMENTS_KU = [
  "زۆر جوان بوو 👏", "دلخوازە فێر ببم!", "سوپاس بۆ پارڤەکرنێ 🙏",
  "🔥🔥", "ئەز پشتگری دکەم", "خۆزی ئەز ژی ل وێرێ بوومایا",
];
const COMMENTS_AR = [
  "رائع جداً 👏", "بالتوفيق!", "شكراً للمشاركة 🙏",
  "🔥", "أحسنت", "تمنيت لو كنت هناك",
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
  if (RESET) {
    console.log("Resetting: deleting previously-seeded demo users (@dilva-demo.local)...");
    const removed = await prisma.user.deleteMany({
      where: { email: { endsWith: "@dilva-demo.local" } },
    });
    console.log(`  removed ${removed.count} previous demo users.`);
  }

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

    // ~30% of profiles write in Arabic, the rest in Kurdish — a real
    // mix, not a Kurdish-only app.
    const contentLang: "ku" | "ar" = Math.random() < 0.3 ? "ar" : "ku";

    // DiceBear "avataaars" — illustrated, not a photo of a real
    // person, seeded per-username so each demo profile keeps a
    // consistent look across visits. Needs api.dicebear.com listed in
    // next.config.js's images.remotePatterns to actually render.
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
      bio: contentLang === "ar" ? pick(BIOS_AR) : pick(BIOS_KU),
      gender: isMale ? "MALE" : "FEMALE",
      country: place.country,
      city: place.city,
      avatarUrl,
      createdAt,
      contentLang,
    };
  });

  await prisma.user.createMany({
    data: userRows.map(({ contentLang, ...u }) => u),
  });
  console.log(`  ${userRows.length} users created.`);

  console.log("Assigning languages (1 native + 1-2 learning per user)...");
  const languageRows = userRows.flatMap((u) => {
    const native = u.contentLang === "ar" ? "ar" : pick(NATIVE_LANGS);
    const learningPool = LEARNING_LANGS.filter((c) => c !== native);
    const learning = pickSome(learningPool, 1 + Math.round(Math.random()));
    return [
      { userId: u.id, languageCode: native, type: "NATIVE" as const, isPrimary: true },
      ...learning.map((code, idx) => ({
        userId: u.id,
        languageCode: code,
        type: "LEARNING" as const,
        proficiency: pick(PROFICIENCIES),
        isPrimary: idx === 0,
      })),
    ];
  });
  await prisma.userLanguage.createMany({ data: languageRows, skipDuplicates: true });
  console.log(`  ${languageRows.length} language rows created.`);

  console.log("Creating 2-3 posts per user...");
  const postRows = userRows.flatMap((u) => {
    const postCount = 2 + Math.round(Math.random()); // 2 or 3
    const texts = u.contentLang === "ar" ? POST_TEXTS_AR : POST_TEXTS_KU;
    const postLangCode = u.contentLang === "ar" ? "ar" : pick(NATIVE_LANGS);
    return Array.from({ length: postCount }, (_, i) => {
      const hasImage = Math.random() < 0.5;
      return {
        id: randomUUID(),
        authorId: u.id,
        content: pick(texts),
        languageCode: postLangCode,
        imageUrl: hasImage ? `https://picsum.photos/seed/${u.username}-${i}/900/700` : null,
        createdAt: new Date(u.createdAt.getTime() + (i + 1) * 6 * 60 * 60 * 1000),
      };
    });
  });
  await prisma.post.createMany({ data: postRows });
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

  console.log("Adding likes to posts...");
  const likeRows: { postId: string; userId: string }[] = [];
  for (const post of postRows) {
    const likerCount = Math.floor(Math.random() * 9); // 0-8 likes
    const likers = pickSome(
      userIds.filter((id) => id !== post.authorId),
      Math.min(likerCount, userIds.length - 1)
    );
    for (const userId of likers) likeRows.push({ postId: post.id, userId });
  }
  await prisma.like.createMany({ data: likeRows, skipDuplicates: true });
  console.log(`  ${likeRows.length} likes created.`);

  console.log("Adding comments to posts...");
  const commentRows: { postId: string; authorId: string; content: string }[] = [];
  const userLangByI = new Map<string, "ku" | "ar">(userRows.map((u) => [u.id, u.contentLang]));
  for (const post of postRows) {
    const commentCount = Math.floor(Math.random() * 4); // 0-3 comments
    const commenters = pickSome(
      userIds.filter((id) => id !== post.authorId),
      Math.min(commentCount, userIds.length - 1)
    );
    for (const authorId of commenters) {
      const lang = userLangByI.get(authorId) === "ar" ? "ar" : "ku";
      commentRows.push({
        postId: post.id,
        authorId,
        content: lang === "ar" ? pick(COMMENTS_AR) : pick(COMMENTS_KU),
      });
    }
  }
  await prisma.comment.createMany({ data: commentRows });
  console.log(`  ${commentRows.length} comments created.`);

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
