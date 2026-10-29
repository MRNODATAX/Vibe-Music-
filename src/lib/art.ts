import type { ArtVariant, Palette } from "@/data/catalog";

/* -------------------------------------------------------------------------- */
/*  Colour helpers                                                             */
/* -------------------------------------------------------------------------- */

export const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = Number.parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

export const rgba = (hex: string, alpha: number) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const mix = (a: string, b: string, weight = 0.5) => {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const w = Math.min(1, Math.max(0, weight));
  const toHex = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return `#${toHex(r1 + (r2 - r1) * w)}${toHex(g1 + (g2 - g1) * w)}${toHex(b1 + (b2 - b1) * w)}`;
};

export const lighten = (hex: string, amount = 0.2) => mix(hex, "#ffffff", amount);
export const darken = (hex: string, amount = 0.2) => mix(hex, "#000000", amount);

export const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const readableOn = (hex: string) => (luminance(hex) > 0.55 ? "#101014" : "#ffffff");

/* -------------------------------------------------------------------------- */
/*  Background recipes                                                         */
/* -------------------------------------------------------------------------- */

/**
 * A CSS `background` value used for large blurred backdrops (hero headers and
 * the "under main view" layer). Mirrors Glassify's approach of building the
 * backdrop from the current artwork rather than a flat colour.
 */
export const artGradient = (palette: Palette, variant: ArtVariant = "mesh"): string => {
  const { base, accent, accent2 } = palette;
  const common = [
    `radial-gradient(120% 90% at 12% 8%, ${rgba(accent, 0.85)} 0%, transparent 58%)`,
    `radial-gradient(110% 90% at 88% 12%, ${rgba(accent2, 0.6)} 0%, transparent 62%)`,
    `radial-gradient(120% 120% at 50% 108%, ${rgba(accent, 0.5)} 0%, transparent 70%)`,
  ];
  const variants: Record<ArtVariant, string[]> = {
    mesh: common,
    bloom: [
      `radial-gradient(60% 55% at 50% 48%, ${rgba(accent2, 0.9)} 0%, ${rgba(accent, 0.45)} 38%, transparent 70%)`,
      `radial-gradient(100% 90% at 90% 100%, ${rgba(accent, 0.65)} 0%, transparent 65%)`,
      `radial-gradient(90% 80% at 0% 0%, ${rgba(accent2, 0.35)} 0%, transparent 60%)`,
    ],
    waves: [
      `repeating-linear-gradient(115deg, ${rgba(accent, 0.36)} 0px, ${rgba(accent, 0.36)} 26px, transparent 26px, transparent 62px)`,
      `radial-gradient(90% 80% at 20% 100%, ${rgba(accent2, 0.7)} 0%, transparent 70%)`,
      `radial-gradient(90% 80% at 90% 10%, ${rgba(accent, 0.6)} 0%, transparent 65%)`,
    ],
    rings: [
      `repeating-radial-gradient(circle at 62% 42%, ${rgba(accent, 0.5)} 0px, ${rgba(accent, 0.5)} 3px, transparent 3px, transparent 34px)`,
      `radial-gradient(70% 70% at 62% 42%, ${rgba(accent2, 0.65)} 0%, transparent 70%)`,
      `radial-gradient(100% 100% at 0% 100%, ${rgba(accent, 0.55)} 0%, transparent 65%)`,
    ],
    grid: [
      `repeating-linear-gradient(0deg, ${rgba(accent, 0.28)} 0px, ${rgba(accent, 0.28)} 1px, transparent 1px, transparent 30px)`,
      `repeating-linear-gradient(90deg, ${rgba(accent, 0.28)} 0px, ${rgba(accent, 0.28)} 1px, transparent 1px, transparent 30px)`,
      `radial-gradient(90% 80% at 50% 110%, ${rgba(accent2, 0.75)} 0%, transparent 70%)`,
    ],
    orbit: [
      `radial-gradient(38% 38% at 68% 32%, ${rgba(accent2, 0.95)} 0%, ${rgba(accent, 0.5)} 45%, transparent 72%)`,
      `radial-gradient(120% 90% at 50% 120%, ${rgba(accent, 0.6)} 0%, transparent 68%)`,
      `conic-gradient(from 200deg at 30% 70%, ${rgba(accent2, 0.3)}, transparent 55%)`,
    ],
  };
  return `${variants[variant].join(", ")}, ${base}`;
};

/** Deterministic pseudo-random in [0,1) from a string seed. */
export const seeded = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
};

/** Small deterministic integer sequence from a string seed. */
export const seededSeries = (seed: string, count: number) =>
  Array.from({ length: count }, (_, i) => seeded(`${seed}-${i}`));
