import CoverArt from "@/components/CoverArt";
import type { ArtVariant, Palette } from "@/data/catalog";

interface CoverProps {
  palette: Palette;
  variant?: ArtVariant;
  seed: string;
  size?: "xs" | "xs-square" | "sm" | "md" | "lg" | "xl" | "hero" | "fill";
  round?: boolean;
  className?: string;
  playing?: boolean;
}

/** Square artwork wrapper that handles radii, shadows and the "playing" state. */
const Cover = ({ palette, variant, seed, size = "md", round, className, playing }: CoverProps) => (
  <span
    className={`cover cover--${size} ${round ? "cover--round" : ""} ${playing ? "is-playing" : ""} ${className ?? ""}`}
    style={{ ["--cover-accent" as string]: palette.accent }}
  >
    <CoverArt palette={palette} variant={variant} seed={seed} decorative />
    <span className="cover-sheen" aria-hidden="true" />
  </span>
);

export default Cover;
