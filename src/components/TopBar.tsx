import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Download, Search, Settings, SlidersHorizontal, X } from "lucide-react";
import { artistName, searchCatalog } from "@/data/catalog";
import { usePlayer } from "@/store/playerStore";
import { useUi } from "@/store/uiStore";
import Cover from "@/components/Cover";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { toast } from "@/components/Toast";

const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const setSettingsOpen = useUi((s) => s.setSettingsOpen);
  const { canInstall, installed, install } = usePwaInstall();

  useEffect(() => {
    if (location.pathname === "/search") setValue(params.get("q") ?? "");
  }, [location.pathname, params]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (event.key === "/" && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = value.trim().length > 0 ? searchCatalog(value) : null;
  const suggestions = results
    ? [
        ...results.tracks.slice(0, 4).map((t) => ({
          key: t.id,
          title: t.title,
          meta: `Lagu • ${artistName(t.artistId)}`,
          to: `/album/${t.albumId}`,
          palette: t.palette,
          art: t.art,
          round: false,
        })),
        ...results.artists.slice(0, 2).map((a) => ({
          key: a.id,
          title: a.name,
          meta: "Artis",
          to: `/artist/${a.id}`,
          palette: a.palette,
          art: a.art,
          round: true,
        })),
        ...results.playlists.slice(0, 2).map((p) => ({
          key: p.id,
          title: p.title,
          meta: "Playlist",
          to: `/playlist/${p.id}`,
          palette: p.palette,
          art: p.art,
          round: false,
        })),
      ]
    : [];

  const submit = (query: string) => {
    const q = query.trim();
    if (!q) return;
    setFocused(false);
    inputRef.current?.blur();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="topbar">
      <div className="topbar-nav">
        <button type="button" className="icon-btn glassy" onClick={() => navigate(-1)} aria-label="Kembali">
          <ChevronLeft size={18} />
        </button>
        <button type="button" className="icon-btn glassy" onClick={() => navigate(1)} aria-label="Maju">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className={`search-wrap ${focused ? "is-focused" : ""}`}>
        <form
          className="search-field glassy"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            submit(value);
          }}
        >
          <Search size={17} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={value}
            placeholder="Mau dengar apa?"
            aria-label="Cari lagu, artis, atau playlist"
            onChange={(event) => setValue(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 120)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setFocused(false);
                inputRef.current?.blur();
              }
            }}
          />
          {value && (
            <button
              type="button"
              className="search-clear"
              aria-label="Bersihkan pencarian"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setValue("");
                inputRef.current?.focus();
              }}
            >
              <X size={15} />
            </button>
          )}
        </form>

        {focused && suggestions.length > 0 && (
          <div className="search-suggest glass">
            {suggestions.map((item) => (
              <button
                key={`${item.meta}-${item.key}`}
                type="button"
                className="suggest-item"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => submit(item.title)}
              >
                <Cover palette={item.palette} variant={item.art} seed={item.key} size="xs" round={item.round} />
                <span className="suggest-text">
                  <span className="suggest-title">{item.title}</span>
                  <span className="suggest-meta">{item.meta}</span>
                </span>
              </button>
            ))}
            <button
              type="button"
              className="suggest-all"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => submit(value)}
            >
              <Search size={15} /> Tampilkan semua hasil untuk “{value}”
            </button>
          </div>
        )}
      </div>

      <div className="topbar-actions">
        {!installed && (
          <button
            type="button"
            className="ghost-btn hide-sm"
            onClick={async () => {
              const ok = await install();
              if (!ok) toast("Di iOS: Bagikan → “Tambahkan ke Layar Utama”. Di desktop: ikon pasang di address bar.");
            }}
          >
            <Download size={16} />
            <span>{canInstall ? "Pasang app" : "Simpan ke layar"}</span>
          </button>
        )}
        <button
          type="button"
          className="icon-btn glassy hide-xs"
          onClick={() => {
            const state = usePlayer.getState();
            if (state.queue.length === 0) {
              toast("Putar satu lagu dulu untuk membuka antrean.");
              return;
            }
            state.setNowPlayingOpen(true);
          }}
          aria-label="Panel pemutar"
          title="Panel pemutar"
        >
          <SlidersHorizontal size={17} />
        </button>
        <button
          type="button"
          className="icon-btn glassy"
          onClick={() => setSettingsOpen(true)}
          aria-label="Pengaturan tampilan"
          title="Pengaturan tampilan"
        >
          <Settings size={17} />
        </button>
        <button
          type="button"
          className="avatar"
          onClick={() => {
            const state = usePlayer.getState();
            if (state.queue.length) state.setNowPlayingOpen(true);
            else navigate("/library");
          }}
          aria-label="Profil pengguna"
          title="Profil"
        >
          <span>A</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
