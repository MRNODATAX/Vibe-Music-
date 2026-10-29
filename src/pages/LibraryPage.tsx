import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Plus } from "lucide-react";
import {
  albums,
  artists,
  formatCount,
  getPlaylist,
  PALETTES,
  playlistTracks,
  tracks,
  type Track,
} from "@/data/catalog";
import { useLibrary } from "@/store/libraryStore";
import { usePlayer } from "@/store/playerStore";
import Cover from "@/components/Cover";
import MediaCard from "@/components/MediaCard";
import { toast } from "@/components/Toast";

type Tab = "playlist" | "artis" | "album";

const LibraryPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("playlist");
  const {
    playlists,
    likedTracks,
    followedArtists,
    savedAlbums,
    createPlaylist,
  } = useLibrary();
  const playContext = usePlayer((s) => s.playContext);

  const playList = (list: Track[], label: string, id: string) => {
    if (list.length) playContext(list, 0, label, id);
  };

  return (
    <div className="page page--library">
      <div className="page-heading page-heading--row">
        <div>
          <h1>Perpustakaan</h1>
          <p>Playlist, artis, dan album yang kamu simpan di perangkat ini.</p>
        </div>
        <button
          type="button"
          className="primary-btn"
          onClick={() => {
            const id = createPlaylist(`Playlist Saya #${playlists.length + 1}`);
            toast("Playlist baru dibuat");
            navigate(`/playlist/${id}`);
          }}
        >
          <Plus size={16} /> Playlist baru
        </button>
      </div>

      <div className="segmented segmented--tabs" role="tablist" aria-label="Bagian perpustakaan">
        {(["playlist", "artis", "album"] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            className={tab === item ? "is-active" : ""}
            onClick={() => setTab(item)}
          >
            {item === "playlist" ? "Playlist" : item === "artis" ? "Artis" : "Album"}
          </button>
        ))}
      </div>

      {tab === "playlist" && (
        <>
          <section className="liked-banner glass">
            <div className="liked-banner-art">
              <Heart size={34} fill="currentColor" />
            </div>
            <div className="liked-banner-text">
              <h2>Lagu yang disukai</h2>
              <p>{likedTracks.length} lagu tersimpan</p>
            </div>
            <button type="button" className="ghost-btn" onClick={() => navigate("/liked")}>
              Buka
            </button>
          </section>

          <div className="card-grid">
            {playlists.map((playlist, index) => (
              <MediaCard
                key={playlist.id}
                to={`/playlist/${playlist.id}`}
                title={playlist.title}
                subtitle={`Playlist • ${playlist.trackIds.length} lagu`}
                palette={PALETTES[["violet", "cyan", "rose", "amber", "mint", "indigo"][index % 6] as keyof typeof PALETTES]}
                variant="bloom"
                seed={playlist.id}
                badge="Milikmu"
                onPlay={() =>
                  playList(
                    playlist.trackIds.map((id) => tracks.find((t) => t.id === id)!).filter(Boolean),
                    playlist.title,
                    playlist.id,
                  )
                }
              />
            ))}
            {[0, 1, 2, 3].map((offset) => {
              const curated = [
                "vibe-harian",
                "neon-drive",
                "lofi-senja",
                "fokus-total",
                "chill-malam",
                "akustik-pagi",
              ][(playlists.length + offset) % 6];
              const playlist = getPlaylist(curated);
              if (!playlist) return null;
              return (
                <MediaCard
                  key={`${playlist.id}-${offset}`}
                  to={`/playlist/${playlist.id}`}
                  title={playlist.title}
                  subtitle={`Playlist • ${playlist.trackIds.length} lagu`}
                  palette={playlist.palette}
                  variant={playlist.art}
                  seed={`${playlist.id}-${offset}`}
                  onPlay={() => playList(playlistTracks(playlist), playlist.title, playlist.id)}
                />
              );
            })}
          </div>
        </>
      )}

      {tab === "artis" && (
        <div className="card-grid card-grid--artists">
          {followedArtists.length === 0 && <p className="empty-note">Belum mengikuti artis. Tekan “Ikuti” di halaman artis.</p>}
          {artists
            .filter((artist) => followedArtists.includes(artist.id))
            .map((artist) => (
              <MediaCard
                key={artist.id}
                to={`/artist/${artist.id}`}
                title={artist.name}
                subtitle={`${formatCount(artist.monthlyListeners)} pendengar bulanan`}
                palette={artist.palette}
                variant={artist.art}
                seed={artist.id}
                round
                onPlay={() => playList(tracks.filter((t) => t.artistId === artist.id), artist.name, artist.id)}
              />
            ))}
        </div>
      )}

      {tab === "album" && (
        <div className="card-grid">
          {savedAlbums.length === 0 && <p className="empty-note">Belum ada album tersimpan. Simpan dari halaman album.</p>}
          {albums
            .filter((album) => savedAlbums.includes(album.id))
            .map((album) => (
              <MediaCard
                key={album.id}
                to={`/album/${album.id}`}
                title={album.title}
                subtitle={`${album.year} • Album`}
                palette={album.palette}
                variant={album.art}
                seed={album.id}
                onPlay={() => playList(tracks.filter((t) => t.albumId === album.id), album.title, album.id)}
              />
            ))}
        </div>
      )}

      <section className="library-cta glass">
        <Cover palette={PALETTES.indigo} variant="orbit" seed="cta-install" size="md" />
        <div>
          <h2>Bawa Vibe Music ke layar utama</h2>
          <p>Pasang sebagai aplikasi agar bisa dibuka tanpa browser dan tetap jalan saat offline.</p>
        </div>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => toast("Gunakan menu browser → “Pasang aplikasi” / “Tambahkan ke Layar Utama”.")}
        >
          Cara memasang
        </button>
      </section>
    </div>
  );
};

export default LibraryPage;
