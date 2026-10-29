import { useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SectionProps {
  title: string;
  subtitle?: string;
  moreTo?: string;
  children: ReactNode;
}

/** Horizontally scrolling shelf with desktop arrows, like a streaming home row. */
const Section = ({ title, subtitle, moreTo, children }: SectionProps) => {
  const scroller = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(280, el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section className="shelf">
      <div className="shelf-head">
        <div>
          <h2 className="shelf-title">{title}</h2>
          {subtitle && <p className="shelf-sub">{subtitle}</p>}
        </div>
        <div className="shelf-actions">
          {moreTo && (
            <Link to={moreTo} className="shelf-more">
              Tampilkan semua
            </Link>
          )}
          <button type="button" className="icon-btn shelf-arrow hide-sm" onClick={() => scroll(-1)} aria-label="Geser ke kiri">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="icon-btn shelf-arrow hide-sm" onClick={() => scroll(1)} aria-label="Geser ke kanan">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="shelf-scroller" ref={scroller}>
        {children}
      </div>
    </section>
  );
};

export default Section;
