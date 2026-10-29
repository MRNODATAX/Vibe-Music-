import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ChevronsLeft,
  ChevronsRight,
  Download,
  Heart,
  Home,
  LibraryBig,
  Plus,
  Search,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import { albums, artists, getPlaylist, playlists as curatedPlaylists, PALETTES } from "@/data/catalog";
import { useLibrary } from "@/store/libraryStore";
import { useUi } from "@/store/uiStore";
import Brand from "@/components/Brand";
import Cover from "@/components/Cover";
import { toast } from "@/components/Toast";
import { usePwaInstall } from "@/hooks/usePwaInstall";

type Filter = "playlist" | "artis" | "album";

const Sidebar = () => {
  const navigate = useNavigate();
  const collapsed = useUi((s) => s.sidebarCollapsed);
  const toggleSidebar = useUi((s) => s.toggleSidebar);
  const setSettingsOpen = useUi((s) => s.setSettingsOpen);
  const { playlists, likedTracks, followedArtists, savedAlbums, createPlaylist } = useLibrary();
  const [filter, setFilter] = useState<Filter>("playlist");
  const [query, setQuery] = useState("");
  const { canInstall, installed, install } = usePwaInstall();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (filter === "artis") {
      return artists
        .filter((a) => followedArtists.includes(a.id))
        .filter((a) => !q || a.name.toLowerCase().includes(q))
        .map((a) => ({ id: a.id, title: a.name, meta: "Artis", to: `/artist/${a.id}` }));
    }
    if (filter === "album") {
      return albums
        .filter((a) => savedAlbums.includes(a.id))
        .filter((a) => !q || a.title.toLowerCase().includes(q))
        .map((a) => ({ id: a.id, title: a.title, meta: "Album", to: `/album/${a.id}` }));
    }
    const user = playlists
      .filter((p) => !q || p.title.toLowerCase().includes(q))
      .map((p) => ({ id: p.id, title: p.title, meta: `Playlist • ${p.trackIds.length} lagu`, to: `/playlist/${p.id}` }));
    const curated = curatedPlaylists
      .filter((p) => !q || p.title.toLowerCase().includes(q))
      .slice(0, 4)
      .map((p) => ({ id: p.id, title: p.title, meta: `Playlist • ${p.trackIds.length} lagu`, to: `/playlist/${p.id}` }));
    return [...user, ...curated];
  }, [filter, query, playlists, followedArtists, savedAlbums]);

  const onCreate = () => {
    const id = createPlaylist(`Playlist Saya #${playlists.length + 1}`);
    toast("Playlist baru dibuat");
    navigate(`/playlist/${id}`);
  };

  const renderCover = (id: string, index: number) => {
    const playlist = playlists.find((p) => p.id === id);
    if (playlist) {
      return (
        <Cover
          palette={PALETTES[["violet", "cyan", "rose", "amber", "mint", "indigo"][index % 6] as keyof typeof PALETTES]}
          variant="bloom"
          seed={playlist.id}
          size="xs"
        />
      );
    }
    const curated = curatedPlaylists.find((p) => p.id === id) ?? getPlaylist(id);
    if (curated) return <Cover palette={curated.palette} variant={curated.art} seed={curated.id} size="xs" />;
    const album = albums.find((a) => a.id === id);
    if (album) return <Cover palette={album.palette} variant={album.art} seed={album.id} size="xs" />;
    const artist = artists.find((a) => a.id === id);
    if (artist) return <Cover palette={artist.palette} variant={artist.art} seed={artist.id} size="xs" round />;
    return <Cover palette={PALETTES.violet} variant="bloom" seed={id} size="xs" />;
  };

  return (
    <aside className={`sidebar glass ${collapsed ? "is-collapsed" : ""}`} aria-label="Navigasi utama">
      <div className="sidebar-top">
        <NavLink to="/" className="brand-link" aria-label="Vibe Music, ke Beranda">
          <Brand compact={collapsed} />
        </NavLink>
        <button
          type="button"
          className="icon-btn collapse-btn"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>

      <nav className="side-nav">
        <NavLink to="/" end className={({ isActive }) => `side-link ${isActive ? "is-active" : ""}`}>
          <Home size={20} />
          <span>Beranda</span>
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `side-link ${isActive ? "is-active" : ""}`}>
          <Search size={20} />
          <span>Cari</span>
        </NavLink>
        <NavLink to="/library" className={({ isActive }) => `side-link ${isActive ? "is-active" : ""}`}>
          <LibraryBig size={20} />
          <span>Perpustakaan</span>
        </NavLink>
      </nav>

      <div className="library">
        <div className="library-head">
          <span className="library-title">
            <LibraryBig size={17} />
            <span>Koleksi kamu</span>
          </span>
          <button type="button" className="icon-btn" onClick={onCreate} aria-label="Buat playlist" title="Buat playlist">
            <Plus size={18} />
          </button>
        </div>

        <div className="library-chips" role="tablist" aria-label="Filter koleksi">
          {(["playlist", "artis", "album"] as Filter[]).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={filter === item}
              className={`chip ${filter === item ? "is-active" : ""}`}
              onClick={() => setFilter(item)}
            >
              {item === "playlist" ? "Playlist" : item === "artis" ? "Artis" : "Album"}
            </button>
          ))}
        </div>

        <label className="library-search">
          <Search size={15} />
          <input
            type="search"
            value={query}
            placeholder="Cari di koleksi"
            aria-label="Cari di koleksi"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="library-scroll">
          <ul className="library-list">
            <li>
              <NavLink to="/liked" className="library-item">
                <span className="liked-cover">
                  <Heart size={16} fill="currentColor" />
                </span>
                <span className="library-item-text">
                  <span className="library-item-title">Lagu yang disukai</span>
                  <span className="library-item-meta">Playlist • {likedTracks.length} lagu</span>
                </span>
              </NavLink>
            </li>
            {filtered.map((item, index) => (
              <li key={`${filter}-${item.id}`}>
                <NavLink to={item.to} className="library-item">
                  {renderCover(item.id, index)}
                  <span className="library-item-text">
                    <span className="library-item-title">{item.title}</span>
                    <span className="library-item-meta">{item.meta}</span>
                  </span>
                </NavLink>
              </li>
            ))}
            {filtered.length === 0 && filter !== "playlist" && (
              <li className="library-empty">
                <User size={16} /> Belum ada {filter} yang disimpan.
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="sidebar-foot">
        {!installed && (
          <button
            type="button"
            className="install-btn"
            onClick={async () => {
              const ok = await install();
              if (!ok) toast("Gunakan menu browser → “Pasang aplikasi” untuk memasang Vibe Music.");
            }}
          >
            <Download size={16} />
            <span>Pasang aplikasi</span>
            {!canInstall && <Sparkles size={14} className="install-hint" />}
          </button>
        )}
        <button type="button" className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Pengaturan" title="Pengaturan">
          <Settings size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
