"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Shows only the Dilva logo, full-screen, for a couple of seconds
 * right when the app opens — mounted once in the root layout (not a
 * per-page component) so it appears on a cold load/app-open (e.g.
 * from the iPhone Home Screen icon) but never again on normal
 * in-app navigation between pages, since Next.js doesn't remount the
 * root layout for those.
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[999] flex items-center justify-center"
          style={{ background: "#0c0c13" }}
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-gradient text-5xl font-extrabold tracking-tight sm:text-6xl"
          >
            Dilva
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
