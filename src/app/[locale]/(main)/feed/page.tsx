"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import PostCard, { type FeedPost } from "@/components/feed/PostCard";
import PostMediaUploader, { type PostMedia } from "@/components/feed/PostMediaUploader";

type Tab = "following" | "explore";

export default function FeedPage() {
  const t = useTranslations("feed");
  // "explore" (everyone, language-filtered) is the default tab rather
  // than "following" — a brand-new account follows nobody yet, so
  // defaulting to "following" would greet them with an empty feed
  // instead of showing them the app actually has content.
  const [tab, setTab] = useState<Tab>("explore");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<PostMedia>(null);
  const [posting, setPosting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  async function loadPosts(scope: Tab) {
    setPostsLoaded(false);
    const res = await fetch(`/api/posts?scope=${scope}`);
    const data = await res.json();
    setPosts(data.posts ?? []);
    setPostsLoaded(true);
  }

  // The signed-in user's own id only affects per-post edit/delete/like
  // UI — it never depends on which tab is active, so it's fetched once.
  useEffect(() => {
    fetch("/api/profile/me")
      .then((r) => r.json())
      .then((d) => setCurrentUserId(d.profile?.id ?? null));
  }, []);

  useEffect(() => {
    loadPosts(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function submitPost() {
    if (!content.trim()) return;
    setPosting(true);
    setPostError(null);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        correctionRequested: true,
        imageUrl: media?.kind === "image" ? media.url : undefined,
        videoUrl: media?.kind === "video" ? media.url : undefined,
      }),
    });
    setPosting(false);
    if (res.ok) {
      setContent("");
      setMedia(null);
      // A brand-new post only ever shows up in Explore (nobody follows
      // themselves) — refreshing "following" would just be a no-op
      // network call.
      if (tab === "explore") loadPosts("explore");
    } else if (res.status === 429) {
      setPostError(t("rateLimited"));
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-2xl font-bold"
      >
        {t("title")}
      </motion.h1>

      <div className="mt-4 flex items-center gap-1 rounded-full border border-black/5 bg-white/70 p-1 dark:border-white/10 dark:bg-gray-800/60">
        {(["following", "explore"] as Tab[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === key ? "text-white" : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            }`}
          >
            {tab === key && (
              <motion.span
                layoutId="feed-tab-pill"
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-brand-600 to-accent-500 shadow-sm shadow-brand-600/25"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            {key === "following" ? t("tabFollowing") : t("tabExplore")}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="card-shadow mt-4 rounded-3xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-gray-800/70 dark:backdrop-blur-xl"
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("composerPlaceholder")}
          rows={3}
          className="w-full resize-none border-none bg-transparent outline-none"
        />
        {currentUserId && (
          <PostMediaUploader userId={currentUserId} media={media} onChange={setMedia} />
        )}
        {postError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{postError}</p>}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">{t("askForCorrections")}</span>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={submitPost}
            disabled={posting || !content.trim()}
            className="rounded-full bg-gradient-to-r from-brand-600 to-accent-500 px-4 py-1.5 text-sm font-medium text-white shadow-md shadow-brand-600/20 disabled:opacity-50"
          >
            {t("post")}
          </motion.button>
        </div>
      </motion.div>

      <div className="mt-6 flex flex-col gap-4">
        {postsLoaded && tab === "following" && posts.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 px-4 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            {t("emptyFollowing")}
          </motion.p>
        ) : (
          <AnimatePresence initial={false}>
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
              >
                <PostCard post={post} currentUserId={currentUserId} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}
