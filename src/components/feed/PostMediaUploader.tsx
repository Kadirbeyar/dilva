"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export type PostMedia = { kind: "image" | "video"; url: string } | null;

const MAX_BYTES = 50 * 1024 * 1024;

/**
 * Lets the post composer attach a single image OR video, uploaded
 * straight to the "post-media" Storage bucket (see
 * prisma/sql/09_storage_post_media.sql). A post carries at most one
 * attachment at a time — picking a new file replaces whatever was
 * selected before.
 */
export default function PostMediaUploader({
  userId,
  media,
  onChange,
}: {
  userId: string;
  media: PostMedia;
  onChange: (media: PostMedia) => void;
}) {
  const t = useTranslations("feed");
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setError(t("mediaTypeError"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("mediaSizeError"));
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() || (isImage ? "jpg" : "mp4");
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("post-media")
      .upload(path, file, { cacheControl: "3600" });

    setUploading(false);

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("post-media").getPublicUrl(path);

    onChange({ kind: isImage ? "image" : "video", url: publicUrl });
  }

  if (media) {
    return (
      <div className="relative mt-2 inline-block">
        {media.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt="" className="max-h-56 rounded-xl object-cover" />
        ) : (
          <video src={media.url} controls className="max-h-56 rounded-xl" />
        )}
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={t("removeMedia")}
          className="absolute -end-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900/80 text-xs text-white shadow"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="mt-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-black/5 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
      >
        {uploading ? "…" : `📷 ${t("addMedia")}`}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
