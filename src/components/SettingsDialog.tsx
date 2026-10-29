import { useEffect } from "react";
import { Check, Download, RotateCcw, Sparkles, X } from "lucide-react";
import { useUi, type GlassLevel } from "@/store/uiStore";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { toast } from "@/components/Toast";

const ACCENTS = ["#ff5c7a", "#ff8a3d", "#ffd166", "#4ade80", "#3ee0c8", "#5b8cff", "#a78bfa", "#f472b6"];

const SettingsDialog = () => {
  const {
    settingsOpen,
    setSettingsOpen,
    accentMode,
    setAccentMode,
    accent,
    setAccent,
    glass,
    setGlass,
    animateBackground,
    setAnimateBackground,
    reduceMotion,
    setReduceMotion,
  } = useUi();
  const { canInstall, installed, install } = usePwaInstall();

  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen, setSettingsOpen]);

  if (!settingsOpen) return null;

  return (
    <div className="modal-scrim" role="presentation" onClick={() => setSettingsOpen(false)}>
      <div
        className="modal glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-head">
          <div>
            <h2 id="settings-title">Tampilan</h2>
            <p>Personalisasi kaca, warna aksen, dan gerak antarmuka.</p>
          </div>
          <button type="button" className="icon-btn" onClick={() => setSettingsOpen(false)} aria-label="Tutup pengaturan">
            <X size={18} />
          </button>
        </header>

        <section className="setting">
          <div className="setting-head">
            <h3>Warna aksen</h3>
            <span className="setting-hint">{accentMode === "dynamic" ? "Mengikuti sampul lagu" : "Warna pilihanmu"}</span>
          </div>
          <div className="segmented" role="radiogroup" aria-label="Mode warna aksen">
            <button
              type="button"
              role="radio"
              aria-checked={accentMode === "dynamic"}
              className={accentMode === "dynamic" ? "is-active" : ""}
              onClick={() => setAccentMode("dynamic")}
            >
              <Sparkles size={15} /> Dinamis
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={accentMode === "custom"}
              className={accentMode === "custom" ? "is-active" : ""}
              onClick={() => setAccentMode("custom")}
            >
              Kustom
            </button>
          </div>
          {accentMode === "custom" && (
            <div className="swatches">
              {ACCENTS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`swatch ${accent.toLowerCase() === color ? "is-active" : ""}`}
                  style={{ background: color }}
                  aria-label={`Warna ${color}`}
                  aria-pressed={accent.toLowerCase() === color}
                  onClick={() => setAccent(color)}
                >
                  {accent.toLowerCase() === color && <Check size={14} />}
                </button>
              ))}
              <label className="swatch swatch--picker" title="Warna khusus">
                <input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} aria-label="Pilih warna khusus" />
                <span>+</span>
              </label>
            </div>
          )}
        </section>

        <section className="setting">
          <div className="setting-head">
            <h3>Efek kaca</h3>
            <span className="setting-hint">Blur & transparansi panel</span>
          </div>
          <div className="segmented" role="radiogroup" aria-label="Tingkat efek kaca">
            {(["off", "soft", "strong"] as GlassLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={glass === level}
                className={glass === level ? "is-active" : ""}
                onClick={() => setGlass(level)}
              >
                {level === "off" ? "Mati" : level === "soft" ? "Lembut" : "Kuat"}
              </button>
            ))}
          </div>
        </section>

        <section className="setting">
          <label className="check-row">
            <span>
              <strong>Latar animasi</strong>
              <em>Cahaya bergerak mengikuti warna sampul aktif.</em>
            </span>
            <input type="checkbox" checked={animateBackground} onChange={(event) => setAnimateBackground(event.target.checked)} />
            <span className="switch" aria-hidden="true" />
          </label>
          <label className="check-row">
            <span>
              <strong>Kurangi gerakan</strong>
              <em>Mematikan animasi untuk kenyamanan.</em>
            </span>
            <input type="checkbox" checked={reduceMotion} onChange={(event) => setReduceMotion(event.target.checked)} />
            <span className="switch" aria-hidden="true" />
          </label>
        </section>

        <section className="setting">
          <div className="setting-head">
            <h3>Aplikasi</h3>
            <span className="setting-hint">{installed ? "Terpasang" : canInstall ? "Siap dipasang" : "Bisa dipasang dari menu browser"}</span>
          </div>
          <div className="setting-actions">
            <button
              type="button"
              className="ghost-btn"
              onClick={async () => {
                const ok = await install();
                if (!ok) toast("Gunakan menu browser → “Pasang aplikasi” / “Tambahkan ke Layar Utama”.");
              }}
              disabled={installed}
            >
              <Download size={16} /> {installed ? "Sudah terpasang" : "Pasang Vibe Music"}
            </button>
            <button
              type="button"
              className="ghost-btn danger"
              onClick={() => {
                localStorage.removeItem("vibe-music.library");
                localStorage.removeItem("vibe-music.ui");
                localStorage.removeItem("vibe-music.player");
                toast("Data lokal dibersihkan. Memuat ulang…");
                window.setTimeout(() => window.location.reload(), 700);
              }}
            >
              <RotateCcw size={16} /> Reset data lokal
            </button>
          </div>
        </section>

        <footer className="modal-foot">
          <span>Vibe Music 1.0 — PWA glass.</span>
          <span className="modal-foot-dim">Dibuat dengan Web Audio API + React.</span>
        </footer>
      </div>
    </div>
  );
};

export default SettingsDialog;
