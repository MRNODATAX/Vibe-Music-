import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Play, Sparkles } from "lucide-react";
import {
  artistName,
  albums,
  artists,
  getAlbum,
  getArtist,
  getPlaylist,
  getTrack,
  homeRows,
  PALETTES,
  playlistTracks,
  playlists,
  tracks,
  type Track,
} from "@/data/catalog";
import { useLibrary } from "@/store/libraryStore";
import { usePlayer } from "@/store/playerStore";
import Cover from "@/components/Cover";
import MediaCard from "@/components/MediaCard";
import Section from "@/components/Section";
import Equalizer from "@/components/Equalizer";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 4) return "Selamat malam";
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
};

const Home = () => {
  const playContext = usePlayer((s) => s.playContext);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const currentId = usePlayer((s) => s.queue[s.index]?.id);
  const { recentTracks } = useLibrary();

  const playTracks = (list: Track[], label: string, contextId: string) => {
    if (list.length === 0) return;
    playContext(list, 0, label, contextId);
  };

  const quickItems = useMemo(() => {
    const recent = recentTracks.map((id) => getTrack(id)).filter((t): t is Track => Boolean(t));
    const seen = new Set<string>();
    const items: { id: string; title: string; to: string; palette: (typeof PALETTES)[keyof typeof PALETTES]; art: Track["art"]; tracks: Track[]; label: string }[] = [];
    recent.forEach((track) => {
      if (seen.has(track.albumId)) return;
      seen.add(track.albumId);
      const album = getAlbum(track.albumId)!;
      items.push({
        id: album.id,
        title: album.title,
        to: `/album/${album.id}`,
        palette: album.palette,
        art: album.art,
        tracks: tracks.filter((t) => t.albumId === album.id),
        label: album.title,
      });
    });
    playlists.slice(0, 8 - items.length).forEach((playlist) => {
      items.push({
        id: playlist.id,
        title: playlist.title,
        to: `/playlist/${playlist.id}`,
        palette: playlist.palette,
        art: playlist.art,
        tracks: playlistTracks(playlist),
        label: playlist.title,
      });
    });
    return items.slice(0, 8);
  }, [recentTracks]);

  const featured = playlists[0];

  const renderCard = (kind: "playlist" | "album" | "artist", id: string) => {
    if (kind === "album") {
      const album = getAlbum(id);
      if (!album) return null;
      const list = tracks.filter((t) => t.albumId === id);
      return (
        <MediaCard
          key={`album-${id}`}
          to={`/album/${id}`}
          title={album.title}
          subtitle={`${album.year} • ${artistName(album.artistId)}`}
          palette={album.palette}
          variant={album.art}
          seed={album.id}
          onPlay={() => playTracks(list, album.title, album.id)}
        />
      );
    }
    if (kind === "artist") {
      const artist = getArtist(id);
      if (!artist) return null;
      const list = tracks.filter((t) => t.artistId === id);
      return (
        <MediaCard
          key={`artist-${id}`}
          to={`/artist/${id}`}
          title={artist.name}
          subtitle="Artis"
          palette={artist.palette}
          variant={artist.art}
          seed={artist.id}
          round
          onPlay={() => playTracks(list, artist.name, artist.id)}
        />
      );
    }
    const playlist = getPlaylist(id);
    if (!playlist) return null;
    return (
      <MediaCard
        key={`playlist-${id}`}
        to={`/playlist/${id}`}
        title={playlist.title}
        subtitle={playlist.description}
        palette={playlist.palette}
        variant={playlist.art}
        seed={playlist.id}
        onPlay={() => playTracks(playlistTracks(playlist), playlist.title, playlist.id)}
      />
    );
  };

  return (
    <div className="page page--home">
      <div className="home-greeting">
        <div>
          <h1>{greeting()}</h1>
          <p>Suasana apa yang kamu cari hari ini?</p>
        </div>
        <div className="home-chips">
          {["Chill", "Fokus", "Senja", "Malam", "Akustik"].map((mood) => (
            <Link key={mood} to={`/search?q=${encodeURIComponent(mood)}`} className="chip chip--ghost">
              {mood}
            </Link>
          ))}
        </div>
      </div>

      <div className="quick-grid">
        {quickItems.map((item) => {
          const active = item.tracks.some((track) => track.id === currentId);
          return (
            <div key={item.id} className={`quick-tile glass ${active ? "is-active" : ""}`}>
              <Link to={item.to} className="quick-link">
                <Cover palette={item.palette} variant={item.art} seed={item.id} size="xs-square" />
                <span className="quick-title">{item.title}</span>
              </Link>
              <button
                type="button"
                className="quick-play"
                aria-label={`Putar ${item.title}`}
                onClick={() => playTracks(item.tracks, item.label, item.id)}
              >
                {active && isPlaying ? <Equalizer /> : <Play size={15} fill="currentColor" />}
              </button>
            </div>
          );
        })}
      </div>

      <section className="feature-banner glass">
        <div className="feature-copy">
          <span className="feature-eyebrow">
            <Sparkles size={14} /> Pilihan Vibe
          </span>
          <h2>{featured.title}</h2>
          <p>{featured.description}</p>
          <div className="feature-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => playTracks(playlistTracks(featured), featured.title, featured.id)}
            >
              <Play size={16} fill="currentColor" /> Putar sekarang
            </button>
            <Link to={`/playlist/${featured.id}`} className="ghost-btn">
              Lihat playlist
            </Link>
          </div>
        </div>
        <Link to={`/playlist/${featured.id}`} className="feature-art">
          <Cover palette={featured.palette} variant={featured.art} seed={featured.id} size="hero" />
        </Link>
      </section>

      {homeRows.map((row) => (
        <Section key={row.id} title={row.title}>
          {row.items.map((id) => renderCard(row.kind, id))}
        </Section>
      ))}

      <Section title="Jelajahi artis baru" subtitle="Dari katalog Vibe Music">
        {artists.slice(0, 8).map((artist) => (
          <MediaCard
            key={artist.id}
            to={`/artist/${artist.id}`}
            title={artist.name}
            subtitle="Artis"
            palette={artist.palette}
            variant={artist.art}
            seed={artist.id}
            round
          />
        ))}
      </Section>

      <Section title="Rilisan terbaru" subtitle="Segar minggu ini">
        {albums
          .slice()
          .sort((a, b) => b.year - a.year)
          .slice(0, 8)
          .map((album) => renderCard("album", album.id))}
      </Section>

      <footer className="page-foot">
        <span>Vibe Music</span>
        <span>Demo katalog fiktif • audio disintesis di perangkat</span>
      </footer>
    </div>
  );
};

export default Home;
