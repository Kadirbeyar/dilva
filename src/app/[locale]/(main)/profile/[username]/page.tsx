import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateAge } from "@/lib/age";
import LanguageFlag from "@/components/shared/LanguageFlag";
import RecordVisit from "@/components/profile/RecordVisit";
import FollowButton from "@/components/profile/FollowButton";
import WaveButton from "@/components/profile/WaveButton";
import PostCard, { type FeedPost } from "@/components/feed/PostCard";
import PremiumCrown from "@/components/profile/PremiumCrown";
import { getActivityStreak } from "@/lib/streak";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const t = await getTranslations("profile");

  const profile = await prisma.user.findUnique({
    where: { username },
    include: { languages: { include: { language: true } } },
  });
  if (!profile) notFound();

  const viewer = await getCurrentUser();
  const native = profile.languages.filter((l: (typeof profile.languages)[number]) => l.type === "NATIVE");
  const learning = profile.languages.filter((l: (typeof profile.languages)[number]) => l.type === "LEARNING");

  // Sequential, not Promise.all: Dilva's DB connection goes through
  // Supabase's pooler with connection_limit=1 — firing four queries at
  // once here (on top of the layout's own auth query) doesn't
  // parallelize, it just queues them and risks a pool-timeout (P2024)
  // that fails the whole page render. This is what made "follow"
  // intermittently look broken — the click worked, but re-rendering
  // this page afterward sometimes failed outright.
  const followerCount = await prisma.follow.count({ where: { followingId: profile.id } });
  const followingCount = await prisma.follow.count({ where: { followerId: profile.id } });
  const viewerFollows =
    viewer && viewer.id !== profile.id
      ? await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewer.id, followingId: profile.id } },
        })
      : null;
  // Shown publicly on the profile (not just to the owner) — same
  // computed-on-the-fly streak the nav bar shows for your own account.
  const { streak } = await getActivityStreak(profile.id);
  const rawPosts = await prisma.post.findMany({
    where: { authorId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, isPremiumCached: true },
      },
      language: true,
      _count: { select: { likes: true, comments: true, corrections: true } },
    },
  });

  const posts: FeedPost[] = rawPosts.map((p: (typeof rawPosts)[number]) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {viewer && viewer.username !== username && (
        <RecordVisit visitedUsername={username} />
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            {profile.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
            )}
            {profile.isPremiumCached && <PremiumCrown size="lg" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.displayName || profile.username}</h1>
            <p className="text-gray-500 dark:text-gray-400">
              @{profile.username}
              {profile.birthDate && (
                <span className="ms-2">· {t("yearsOld", { age: calculateAge(profile.birthDate) })}</span>
              )}
            </p>
          </div>
        </div>

        {viewer && viewer.id !== profile.id && (
          <div className="flex items-center gap-2">
            <WaveButton userId={profile.id} />
            <FollowButton username={profile.username} initialFollowing={Boolean(viewerFollows)} />
          </div>
        )}

        {viewer && viewer.id === profile.id && (
          <Link
            href="/settings"
            className="shrink-0 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {t("editProfile")}
          </Link>
        )}
      </div>

      <div className="mt-4 flex items-center gap-5 text-sm">
        <span>
          <span className="font-semibold">{followerCount}</span>{" "}
          <span className="text-gray-500 dark:text-gray-400">{t("followers")}</span>
        </span>
        <span>
          <span className="font-semibold">{followingCount}</span>{" "}
          <span className="text-gray-500 dark:text-gray-400">{t("followingLabel")}</span>
        </span>
        {streak > 0 && (
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 dark:bg-orange-900/20 dark:text-orange-300">
            {t("streak", { count: streak })}
          </span>
        )}
      </div>

      {profile.bio && <p className="mt-4 whitespace-pre-wrap">{profile.bio}</p>}

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">{t("native")}</p>
          <ul className="mt-1 flex flex-col gap-1 text-sm">
            {native.map((l) => (
              <li key={l.id} className="flex items-center gap-1.5">
                <LanguageFlag code={l.languageCode} />
                {l.language.nativeName}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">{t("learning")}</p>
          <ul className="mt-1 flex flex-col gap-1 text-sm">
            {learning.map((l) => (
              <li key={l.id} className="flex items-center gap-1.5">
                <LanguageFlag code={l.languageCode} />
                {l.language.nativeName}
                {l.proficiency ? ` · ${l.proficiency}` : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold">{t("posts")}</h2>
        {posts.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t("noPosts")}</p>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={viewer?.id} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
