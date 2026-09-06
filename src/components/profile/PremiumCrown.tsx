/**
 * Small gold-crown badge shown on a Premium user's avatar — pinned to
 * the wrapping element, which must be `position: relative`. Used on
 * the public profile page, Matches/search cards, and the chat list.
 */
export default function PremiumCrown({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "h-7 w-7 text-sm" : size === "md" ? "h-5 w-5 text-xs" : "h-4 w-4 text-[10px]";
  return (
    <span
      title="Premium"
      className={`absolute -right-1 -top-1 flex ${dims} items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 shadow ring-2 ring-white dark:ring-gray-800`}
    >
      👑
    </span>
  );
}
