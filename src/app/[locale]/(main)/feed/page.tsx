"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import PostCard, { type FeedPost } from "@/components/feed/PostCard";
import PostMediaUploader, { type PostMedia } from "@/components/feed/PostMediaUploader";

export default function FeedPage() {
  const t = useTranslations("feed");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<PostMedia>(null);
  const [posting, setPosting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  async function loadPosts() {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data.posts ?? []);
  }

  useEffect(() => {
    // Sequential, not parallel: Dilva's DB connection has connection_limit=1.
    (async () => {
      const meRes = await fetch("/api/profile/me");
      const meData = await meRes.json();
      setCurrentUserId(meData.profile?.id ?? null);
      await loadPosts();
    })();
  }, []);

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
      loadPosts();
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

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="card-shadow mt-4 rounded-2xl bg-white p-4 dark:bg-gray-800"
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
            className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm disabled:opacity-50"
          >
            {t("post")}
          </motion.button>
        </div>
      </motion.div>

      <div className="mt-6 flex flex-col gap-4">
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
      </div>
    </main>
  );
}
