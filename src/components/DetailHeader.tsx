import type { ReactNode } from "react";
import type { ArtVariant, Palette } from "@/data/catalog";
import { artGradient } from "@/lib/art";
import Cover from "@/components/Cover";

interface DetailHeaderProps {
  kind: string;
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  palette: Palette;
  variant?: ArtVariant;
  seed: string;
  round?: boolean;
  children?: ReactNode;
  inlineCover?: ReactNode;
}

/** Shared hero used by playlist, album, artist and liked pages. */
const DetailHeader = ({
  kind,
  title,
  description,
  meta,
  palette,
  variant,
  seed,
  round,
  children,
  inlineCover,
}: DetailHeaderProps) => (
  <header className="detail-header" style={{ ["--hero-bg" as string]: artGradient(palette, variant) }}>
    <div className="detail-header-glow" aria-hidden="true" />
    <div className="detail-art">
      {inlineCover ?? <Cover palette={palette} variant={variant} seed={seed} size="xl" round={round} />}
    </div>
    <div className="detail-info">
      <span className="detail-kind">{kind}</span>
      <h1 className={`detail-title ${title.length > 26 ? "is-long" : ""}`}>{title}</h1>
      {description && <p className="detail-desc">{description}</p>}
      {meta && <div className="detail-meta">{meta}</div>}
      {children && <div className="detail-actions">{children}</div>}
    </div>
  </header>
);

export default DetailHeader;
