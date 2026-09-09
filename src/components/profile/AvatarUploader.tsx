"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compressImage";

/**
 * Lets the signed-in user pick any image from their device and
 * uploads it straight to the Supabase Storage "avatars" bucket
 * (see prisma/sql/01_storage_avatars.sql for the bucket + policies).
 * Calls onUploaded with the resulting public URL — the parent form
 * is responsible for saving that URL via POST /api/profile/complete.
 */
export default function AvatarUploader({
  userId,
  currentUrl,
  onUploaded,
}: {
  userId: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    // Avatars are only ever shown small (a ~112px circle at most), so
    // there's no reason to keep a phone photo's full 3000px+
    // resolution — shrinking it client-side saves the user's upload
    // data and everyone else's data loading it back down.
    const compressed = await compressImage(file, { maxDimension: 800, quality: 0.85 });
    const ext = compressed.name.split(".").pop() || "jpg";
    // Fixed filename per user (not per-upload) so re-uploading just
    // replaces the old avatar instead of accumulating orphaned files.
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, compressed, { upsert: true, cacheControl: "3600" });

    setUploading(false);

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    // Optional moderation hook (see lib/moderation.ts) — a no-op that
    // always reports "safe" unless the admin has configured a
    // provider's API keys. Runs after the upload (moderation vendors
    // need a real https:// URL to fetch), so a flagged image is
    // deleted again rather than never having been stored.
    try {
      const modRes = await fetch("/api/moderation/check-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: publicUrl }),
      });
      const modData = modRes.ok ? await modRes.json() : { safe: true };
      if (modData.safe === false) {
        await supabase.storage.from("avatars").remove([path]);
        setPreview(currentUrl ?? null);
        setError("This photo doesn't meet Dilva's content guidelines — please choose another.");
        return;
      }
    } catch {
      // Moderation check itself failing is not a reason to block the
      // upload — see lib/moderation.ts's fail-open design.
    }

    // Cache-bust so the new image shows immediately even though the
    // path (and therefore URL) is identical to the previous upload.
    const bustedUrl = `${publicUrl}?v=${Date.now()}`;
    onUploaded(bustedUrl);

    // Save it right away instead of waiting for the parent form's own
    // Save button — previously a new photo only reached the database
    // if the whole profile form (username/country/languages/etc.) was
    // also filled in and submitted, which made uploading a picture
    // look like it silently did nothing.
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: bustedUrl }),
      });
      if (!res.ok) {
        setError("Uploaded, but saving it failed — please try again.");
      }
    } catch {
      setError("Uploaded, but saving it failed — please try again.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => inputRef.current?.click()}
        className="group relative h-28 w-28 overflow-hidden rounded-full bg-gray-100 ring-4 ring-white card-shadow dark:bg-gray-700 dark:ring-gray-800"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-3xl text-gray-400">
            🙂
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-medium text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
          {uploading ? "…" : "✎"}
        </span>
      </motion.button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        {uploading ? "…" : preview ? "Change photo" : "Add a photo"}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
