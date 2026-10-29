import { useEffect } from "react";
import { usePlayer } from "@/store/playerStore";
import { useUi } from "@/store/uiStore";
import { lighten, mix, rgba } from "@/lib/art";
import { PALETTES } from "@/data/catalog";

const FALLBACK = PALETTES.violet;

/**
 * Pushes the active palette into CSS custom properties, and mirrors the UI
 * preferences (glass level, motion, background animation) onto <html> so the
 * stylesheet can react without prop drilling.
 */
export const useTheme = () => {
  const track = usePlayer((s) => s.queue[s.index]);
  const accentMode = useUi((s) => s.accentMode);
  const customAccent = useUi((s) => s.accent);
  const glass = useUi((s) => s.glass);
  const animateBackground = useUi((s) => s.animateBackground);
  const reduceMotion = useUi((s) => s.reduceMotion);

  const palette = track?.palette ?? FALLBACK;
  const accent = accentMode === "custom" ? customAccent : palette.accent;
  const accent2 = accentMode === "custom" ? lighten(customAccent, 0.35) : palette.accent2;
  const base = palette.base;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-2", accent2);
    root.style.setProperty("--accent-soft", rgba(accent, 0.16));
    root.style.setProperty("--accent-glow", rgba(accent, 0.45));
    root.style.setProperty("--accent-line", rgba(accent, 0.28));
    root.style.setProperty("--track-base", base);
    root.style.setProperty("--track-base-soft", mix(base, "#0a0a10", 0.4));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", mix(base, "#05050a", 0.55));
  }, [accent, accent2, base]);

  useEffect(() => {
    document.documentElement.dataset.glass = glass;
    document.documentElement.dataset.motion = reduceMotion ? "reduced" : "full";
    document.documentElement.dataset.animateBg = animateBackground ? "on" : "off";
  }, [glass, reduceMotion, animateBackground]);

  return { palette, accent, accent2 };
};
