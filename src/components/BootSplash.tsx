import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import Brand from "@/components/Brand";

interface BootSplashProps {
  onDone: () => void;
  /** shorter sequence for repeat visits within the same session */
  quick?: boolean;
}

interface Stage {
  at: number;
  label: string;
}

/** Progress milestones — purely cosmetic copy, timed by the real readiness gate. */
const STAGES: Stage[] = [
  { at: 0, label: "Menyalakan mesin audio" },
  { at: 22, label: "Memuat katalog lagu" },
  { at: 42, label: "Menyiapkan antarmuka kaca" },
  { at: 62, label: "Menyusun antrean & favorit" },
  { at: 82, label: "Menyiapkan mode offline" },
  { at: 96, label: "Hampir siap" },
];

const stageFor = (progress: number) => {
  let current = STAGES[0];
  STAGES.forEach((stage) => {
    if (progress >= stage.at) current = stage;
  });
  return current.label;
};

/**
 * First-paint splash: animated progress that is tied to real readiness
 * (fonts + window load) with a minimum on-screen time, and fully skippable by
 * click, tap, any key or the "Lewati" button.
 */
const BootSplash = ({ onDone, quick = false }: BootSplashProps) => {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const finishedRef = useRef(false);
  const onDoneRef = useRef(onDone);

  onDoneRef.current = onDone;

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setLeaving(true);
    window.setTimeout(() => onDoneRef.current(), 540);
  }, []);

  const skip = useCallback(() => setSkipped(true), []);

  /* ------------------------------------------------------------- skipping */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // let the skip button itself handle Enter/Space, otherwise any key jumps ahead
      if (event.key === "Tab" || event.metaKey || event.ctrlKey || event.altKey) return;
      skip();
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("a")) return; // let the nodata.dev link work
      skip();
    };
    window.addEventListener("keydown", onKey, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [skip]);

  /* -------------------------------------------------------------- progress */
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minimumMs = reduceMotion ? 320 : quick ? 480 : 1250;
    // The rAF timestamp can share a different origin than performance.now()
    // (and is faked in tests), so the first frame becomes the baseline.
    let startedAt: number | null = null;
    let assetsReady = false;
    let raf = 0;
    let completeTimer = 0;
    let cancelled = false;

    const fontsReady =
      "fonts" in document && document.fonts?.ready
        ? document.fonts.ready.then(() => undefined).catch(() => undefined)
        : Promise.resolve();

    const windowLoaded = new Promise<void>((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
    });

    Promise.all([fontsReady, windowLoaded]).then(() => {
      assetsReady = true;
    });

    // Skips jump straight to the end with a short, satisfying catch-up.
    if (skipped) {
      setProgress(100);
      completeTimer = window.setTimeout(finish, reduceMotion ? 80 : 260);
      return () => window.clearTimeout(completeTimer);
    }

    const tick = (now: number) => {
      if (cancelled) return;
      if (startedAt === null) startedAt = now;
      const elapsed = Math.max(0, now - startedAt);
      const progressRatio = Math.min(1, elapsed / minimumMs);
      const timeCeiling = (quick ? 30 : 12) + progressRatio * (quick ? 66 : 82);
      let ceiling = Math.min(96, timeCeiling);
      if (!assetsReady) ceiling = Math.min(ceiling, 88);
      else if (elapsed >= minimumMs) ceiling = 100;

      setProgress((previous) => {
        if (previous >= 100) return 100;
        const step = Math.max(reduceMotion ? 6 : 0.6, (ceiling - previous) * 0.12);
        return Math.max(previous, Math.min(ceiling, previous + step));
      });

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(completeTimer);
    };
  }, [skipped, finish, quick]);

  // complete once we actually reach 100%
  useEffect(() => {
    if (progress < 99.9 || skipped) return;
    const timer = window.setTimeout(finish, 460);
    return () => window.clearTimeout(timer);
  }, [progress, skipped, finish]);

  const rounded = Math.min(100, Math.round(progress));
  const label = rounded >= 100 ? "Siap — selamat mendengarkan" : stageFor(rounded);

  return (
    <div
      className={`boot ${leaving ? "is-leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy={!leaving}
      aria-label="Vibe Music sedang dimuat"
    >
      <div className="boot-aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="boot-card">
        <div className="boot-brand">
          <Brand size="lg" taglineHref="https://nodata.dev" tagline />
        </div>

        <div className="boot-wave" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>

        <div
          className="boot-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={rounded}
          aria-valuetext={`${rounded} persen — ${label}`}
        >
          <div className="boot-bar">
            <span className="boot-bar-fill" style={{ width: `${rounded}%` }}>
              <span className="boot-bar-glint" aria-hidden="true" />
            </span>
          </div>
          <div className="boot-meta">
            <span className="boot-label">{label}</span>
            <span className="boot-percent" aria-hidden="true">
              {rounded}
              <small>%</small>
            </span>
          </div>
        </div>

        <div className="boot-actions">
          <button type="button" className="boot-skip" onClick={skip} disabled={leaving}>
            Lewati <ArrowRight size={14} />
          </button>
          <span className="boot-hint">klik, ketuk, atau tekan tombol apa pun untuk langsung masuk</span>
        </div>
      </div>

      <footer className="boot-foot">
        <span>Vibe Music 1.0</span>
        <span className="boot-dot" aria-hidden="true" />
        <span>
          dibangun oleh{" "}
          <a href="https://nodata.dev" target="_blank" rel="noopener noreferrer">
            nodata.dev
          </a>
        </span>
      </footer>
    </div>
  );
};

export default BootSplash;
