"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

/** One-tap HelloTalk-style "👋" greeting — see /api/conversations/wave. */
export default function WaveButton({ userId }: { userId: string }) {
  const t = useTranslations("common");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "cooldown">("idle");

  async function wave() {
    if (status === "sending" || status === "sent") return;
    setStatus("sending");
    const res = await fetch("/api/conversations/wave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUserId: userId }),
    });
    if (res.ok) {
      setStatus("sent");
    } else if (res.status === 429) {
      setStatus("cooldown");
    } else {
      setStatus("idle");
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      onClick={wave}
      disabled={status === "sending" || status === "sent"}
      title={status === "sent" ? t("waveSent") : status === "cooldown" ? t("alreadyWaved") : t("wave")}
      className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-semibold shadow-sm transition disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800"
    >
      {status === "sent" || status === "cooldown" ? "✓ 👋" : "👋"}
    </motion.button>
  );
}
