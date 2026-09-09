/**
 * Client-side image resize/compress, run in the browser before an
 * avatar or post photo ever reaches Supabase Storage. Phones routinely
 * produce 8-12MB photos at 4000px+ wide — uploading those as-is wastes
 * the user's mobile data on the way up, and everyone else's data
 * loading the feed afterward. This shrinks the pixel dimensions and
 * re-encodes as JPEG at a reasonable quality, entirely with the
 * browser's own Canvas API (no extra dependency, no CDN script).
 *
 * Deliberately skips GIFs (canvas re-encoding would flatten an
 * animation to its first frame) and anything that isn't a raster image
 * canvas can decode — those are returned unchanged, so a caller can
 * always just use the result the same way it would have used the
 * original file.
 */
export async function compressImage(
  file: File,
  { maxDimension = 1600, quality = 0.82 }: { maxDimension?: number; quality?: number } = {}
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));

    // Already small enough, and already a web-friendly format — no
    // point re-encoding (that can only add a generation of JPEG
    // artifacts for zero size benefit).
    if (scale === 1 && file.size < 400 * 1024 && file.type !== "image/png") {
      bitmap.close();
      return file;
    }

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) return file;

    // Re-encoding sometimes comes out larger than the source (already
    // heavily-compressed JPEGs, mostly) — in that case just keep the
    // original rather than "compressing" it into something bigger.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    // createImageBitmap/canvas can fail on some exotic formats or in
    // rare browser conditions — fail open and upload the original
    // rather than blocking the user's post/avatar entirely.
    return file;
  }
}
