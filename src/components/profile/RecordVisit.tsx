"use client";

import { useEffect } from "react";

/** Fires the visitor-tracking call once when a profile page is opened. */
export default function RecordVisit({ visitedUsername }: { visitedUsername: string }) {
  useEffect(() => {
    fetch("/api/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitedUsername }),
    }).catch(() => {});
  }, [visitedUsername]);

  return null;
}
