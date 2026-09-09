/**
 * Small blue "verified" checkmark shown right next to a Premium user's
 * name — the Facebook/Instagram-style badge, as opposed to PremiumCrown
 * (the gold crown pinned to the avatar photo). Meant to sit inline
 * immediately after a displayName/username wherever one is rendered:
 * feed posts, comments, chat, profile, matches, the nav bar, nearby,
 * visitors. Purely presentational — callers decide when to render it
 * (typically `{user.isPremiumCached && <VerifiedBadge />}`).
 */
export default function VerifiedBadge({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <svg
      viewBox="0 0 20 20"
      role="img"
      aria-label="Premium"
      className={`ms-1 inline-block ${dims} shrink-0 align-middle`}
    >
      <title>Premium</title>
      <circle cx="10" cy="10" r="10" fill="#3b82f6" />
      <path
        d="M6 10.3 8.6 12.9 14 7.3"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
