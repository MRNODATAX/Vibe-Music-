interface BrandProps {
  compact?: boolean;
  className?: string;
}

/** Vibe Music wordmark: glassy orb with a waveform, no external asset. */
const Brand = ({ compact, className }: BrandProps) => (
  <span className={`brand ${className ?? ""}`} aria-label="Vibe Music">
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" width="100%" height="100%">
        <defs>
          <linearGradient id="brand-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent-2)" />
            <stop offset="60%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="#6a3cff" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="10" fill="url(#brand-bg)" />
        <rect width="32" height="32" rx="10" fill="url(#brand-sheen)" />
        <defs>
          <linearGradient id="brand-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="55%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g stroke="#0b0710" strokeOpacity="0.72" strokeWidth="2.1" strokeLinecap="round">
          <path d="M8 19.5V13" />
          <path d="M12.5 22V10" />
          <path d="M16 20.5v-9" />
          <path d="M19.5 23V9" />
          <path d="M24 18.5v-5" />
        </g>
      </svg>
    </span>
    {!compact && (
      <span className="brand-word">
        Vibe<span>Music</span>
      </span>
    )}
  </span>
);

export default Brand;
