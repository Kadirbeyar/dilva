/**
 * The Kurdistan flag (red / white / green horizontal bands with a
 * 21-ray gold sun) — used wherever the app shows a flag for Kurdish,
 * since Kurdish has no ISO country code and therefore no flag emoji.
 * Drawn as inline SVG rather than an emoji.
 */
export default function KurdistanFlagIcon({ className }: { className?: string }) {
  const rays = Array.from({ length: 21 }, (_, i) => i);
  return (
    <svg
      viewBox="0 0 30 20"
      className={className}
      role="img"
      aria-label="Kurdistan"
    >
      <rect width="30" height="20" fill="#ED1C24" />
      <rect width="30" height="13.33" fill="#FFFFFF" />
      <rect width="30" height="6.67" fill="#00A651" />
      <g transform="translate(15,10)">
        <circle r="3.1" fill="none" stroke="#FDB913" strokeWidth="0.5" />
        {rays.map((i) => {
          const angle = (i * 360) / 21;
          const rad = (angle * Math.PI) / 180;
          const x1 = Math.cos(rad) * 3.4;
          const y1 = Math.sin(rad) * 3.4;
          const x2 = Math.cos(rad) * 4.6;
          const y2 = Math.sin(rad) * 4.6;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#FDB913"
              strokeWidth="0.55"
            />
          );
        })}
      </g>
    </svg>
  );
}
