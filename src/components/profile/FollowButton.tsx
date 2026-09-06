"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function FollowButton({
  username,
  initialFollowing,
  onCountChange,
}: {
  username: string;
  initialFollowing: boolean;
  onCountChange?: (followerCount: number) => void;
}) {
  const t = useTranslations("profile");
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    // Optimistic flip — the server call below confirms/corrects it.
    setFollowing((v) => !v);
    try {
      const res = await fetch(`/api/users/${username}/follow`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.following);
        onCountChange?.(data.followerCount);
      } else {
        setFollowing((v) => !v); // revert on failure
      }
    } catch {
      setFollowing((v) => !v);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      onClick={toggle}
      disabled={loading}
      className={`rounded-full px-5 py-1.5 text-sm font-semibold shadow-sm transition disabled:opacity-60 ${
        following
          ? "border border-gray-300 bg-transparent text-gray-700 hover:border-red-300 hover:text-red-600 dark:border-gray-600 dark:text-gray-200 dark:hover:border-red-400 dark:hover:text-red-400"
          : "bg-brand-600 text-white hover:bg-brand-700"
      }`}
    >
      {following ? t("unfollow") : t("follow")}
    </motion.button>
  );
}
