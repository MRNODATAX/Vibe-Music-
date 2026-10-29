import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import type { ArtVariant, Palette } from "@/data/catalog";
import Cover from "@/components/Cover";

interface MediaCardProps {
  to: string;
  title: string;
  subtitle?: string;
  palette: Palette;
  variant?: ArtVariant;
  seed: string;
  round?: boolean;
  onPlay?: () => void;
  badge?: string;
}

const MediaCard = ({ to, title, subtitle, palette, variant, seed, round, onPlay, badge }: MediaCardProps) => (
  <article className="card">
    <div className={`card-art ${round ? "is-round" : ""}`}>
      <Link to={to} aria-label={title}>
        <Cover palette={palette} variant={variant} seed={seed} size="fill" round={round} />
      </Link>
      {badge && <span className="card-badge">{badge}</span>}
      {onPlay && (
        <button
          type="button"
          className="card-play"
          aria-label={`Putar ${title}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onPlay();
          }}
        >
          <Play size={18} fill="currentColor" />
        </button>
      )}
    </div>
    <Link to={to} className="card-text">
      <span className="card-title">{title}</span>
      {subtitle && <span className="card-sub">{subtitle}</span>}
    </Link>
  </article>
);

export default MediaCard;
