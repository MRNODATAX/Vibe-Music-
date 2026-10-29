import { useId } from "react";
import type { ArtVariant, Palette } from "@/data/catalog";
import { darken, lighten, rgba, seeded, seededSeries } from "@/lib/art";

interface CoverArtProps {
  palette: Palette;
  variant?: ArtVariant;
  seed: string;
  className?: string;
  /** Render decorative-only (no img role) */
  decorative?: boolean;
}

/**
 * Vector artwork generated from the item's palette + variant.
 * Keeps the app dependency-free and lets every card share the same
 * glassmorphic visual language.
 */
const CoverArt = ({ palette, variant = "mesh", seed, className, decorative }: CoverArtProps) => {
  const uid = useId().replace(/[:]/g, "");
  const { base, accent, accent2 } = palette;
  const rand = (i: number) => seeded(`${seed}-${i}`);
  const series = seededSeries(seed, 8);

  const bg = `bg-${uid}`;
  const glow = `glow-${uid}`;
  const line = `line-${uid}`;
  const blur = `blur-${uid}`;

  const defs = (
    <defs>
      <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={lighten(base, 0.12)} />
        <stop offset="52%" stopColor={base} />
        <stop offset="100%" stopColor={darken(base, 0.35)} />
      </linearGradient>
      <radialGradient id={glow} cx={0.3 + rand(1) * 0.5} cy={0.25 + rand(2) * 0.5} r="0.85">
        <stop offset="0%" stopColor={accent2} stopOpacity="0.95" />
        <stop offset="60%" stopColor={accent} stopOpacity="0.35" />
        <stop offset="100%" stopColor={accent} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={line} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={accent2} stopOpacity="0.9" />
        <stop offset="100%" stopColor={accent} stopOpacity="0.45" />
      </linearGradient>
      <filter id={blur} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="10" />
      </filter>
    </defs>
  );

  let shapes: React.ReactNode = null;

  switch (variant) {
    case "bloom":
      shapes = (
        <g>
          <circle cx={88} cy={34} r={40} fill={`url(#${glow})`} />
          {series.slice(0, 4).map((s, i) => (
            <circle
              key={i}
              cx={40 + s * 46}
              cy={30 + series[(i + 3) % 8] * 60}
              r={8 + s * 26}
              fill="none"
              stroke={`url(#${line})`}
              strokeWidth={0.8 + s}
              opacity={0.55 - i * 0.08}
            />
          ))}
          <circle cx={58} cy={62} r={22} fill={rgba(accent2, 0.2)} />
          <circle cx={58} cy={62} r={9} fill={accent2} opacity={0.85} />
        </g>
      );
      break;
    case "waves":
      shapes = (
        <g>
          <circle cx={78} cy={30} r={34} fill={`url(#${glow})`} opacity={0.9} />
          {series.slice(0, 6).map((s, i) => {
            const y = 52 + i * 9 + s * 4;
            return (
              <path
                key={i}
                d={`M-10 ${y} C 24 ${y - 16 - s * 10}, 52 ${y + 18}, 86 ${y - 4} S 124 ${y - 14}, 138 ${y + 6}`}
                fill="none"
                stroke={`url(#${line})`}
                strokeWidth={1.2 + (1 - i / 6)}
                strokeLinecap="round"
                opacity={0.65 - i * 0.07}
              />
            );
          })}
        </g>
      );
      break;
    case "rings":
      shapes = (
        <g>
          <circle cx={64} cy={56} r={44} fill={`url(#${glow})`} opacity={0.75} />
          {series.map((s, i) => (
            <circle
              key={i}
              cx={86 - s * 8}
              cy={56 - s * 6}
              r={8 + i * 8}
              fill="none"
              stroke={i % 2 === 0 ? accent2 : accent}
              strokeWidth={0.7}
              opacity={0.55 - i * 0.05}
            />
          ))}
          <circle cx={44 + rand(3) * 40} cy={30 + rand(4) * 50} r={3.2} fill={accent2} />
        </g>
      );
      break;
    case "grid":
      shapes = (
        <g>
          <rect width="120" height="120" fill={`url(#${glow})`} opacity={0.55} />
          <g opacity={0.5}>
            {Array.from({ length: 9 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 15} x2="120" y2={i * 15} stroke={accent} strokeWidth={0.5} opacity={0.5} />
            ))}
            {Array.from({ length: 9 }, (_, i) => (
              <line key={`v${i}`} x1={i * 15} y1="0" x2={i * 15} y2="120" stroke={accent} strokeWidth={0.5} opacity={0.35} />
            ))}
          </g>
          <circle cx={86} cy={38} r={16} fill={accent2} opacity={0.9} filter={`url(#${blur})`} />
          <path d="M0 96 L120 62" stroke={accent2} strokeWidth={2} opacity={0.8} />
        </g>
      );
      break;
    case "orbit":
      shapes = (
        <g>
          <circle cx={92} cy={26} r={38} fill={`url(#${glow})`} />
          {series.slice(0, 3).map((s, i) => (
            <ellipse
              key={i}
              cx="60"
              cy="60"
              rx={48 - i * 9}
              ry={18 + i * 7}
              fill="none"
              stroke={i === 1 ? accent2 : accent}
              strokeWidth={0.9}
              opacity={0.5 - i * 0.08}
              transform={`rotate(${-24 + i * 26 + s * 12} 60 60)`}
            />
          ))}
          <circle cx={60} cy={60} r={15} fill={accent2} opacity={0.92} />
          <circle cx={60} cy={60} r={15} fill="none" stroke="white" strokeOpacity={0.25} strokeWidth={0.8} />
          <circle cx={102} cy={44} r={4} fill={accent2} />
        </g>
      );
      break;
    case "mesh":
    default:
      shapes = (
        <g filter={`url(#${blur})`}>
          <circle cx={30 + rand(1) * 30} cy={28 + rand(2) * 30} r={34} fill={accent} opacity={0.9} />
          <circle cx={86 - rand(3) * 26} cy={40 + rand(4) * 30} r={30} fill={accent2} opacity={0.7} />
          <circle cx={64 + rand(5) * 20} cy={96 - rand(6) * 20} r={28} fill={accent} opacity={0.5} />
          <rect x="0" y="52" width="120" height="18" fill={lighten(accent, 0.2)} opacity={0.35} />
        </g>
      );
  }

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : `Sampul ${variant}`}
      preserveAspectRatio="xMidYMid slice"
    >
      {defs}
      <rect width="120" height="120" fill={`url(#${bg})`} />
      {shapes}
      <rect width="120" height="120" fill="url(#vg)" opacity="0.18" />
      <defs>
        <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default CoverArt;
