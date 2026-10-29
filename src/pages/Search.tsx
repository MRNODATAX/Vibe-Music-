import { useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Play, SearchX, X } from "lucide-react";
import {
  artistName,
  formatCount,
  genres,
  searchCatalog,
  tracks as allTracks,
  type Track,
} from "@/data/catalog";
import { useLibrary } from "@/store/libraryStore";
import { usePlayer } from "@/store/playerStore";
import Cover from "@/components/Cover";
import MediaCard from "@/components/MediaCard";
import Section from "@/components/Section";
import TrackList from "@/components/TrackList";
import { artGradient } from "@/lib/art";

const Search = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const query = params.get("q") ?? "";
  const playContext = usePlayer((s) => s.playContext);
  const { recentSearches, pushSearch, clearRecentSearches } = useLibrary();

  const results = useMemo(() => searchCatalog(query), [query]);

  useEffect(() => {
    if (query.trim().length > 2) pushSearch(query.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const featuredArtist = results.artists[0];
  const featuredPlaylist = results.playlists[0];
  const topTracks = results.tracks.slice(0, 5);

  const playList = (list: Track[], label: string, id: string) => {
    if (list.length) playContext(list, 0, label, id);
  };

  if (!query.trim()) {
    return (
      <div className="page page--search">
        <div className="page-heading">
          <h1>Jelajahi semua</h1>
          <p>Cari berdasarkan genre, suasana hati, atau artis.</p>
        </div>

        <div className="genre-grid">
          {genres.map((genre) => (
            <Link
              key={genre.id}
              to={`/search?q=${encodeURIComponent(genre.title)}`}
              className="genre-card"
              style={{ ["--genre-bg" as string]: artGradient(genre.palette, genre.art) }}
            >
              <span className="genre-title">{genre.title}</span>
              <span className="genre-art" aria-hidden="true">
                <Cover palette={genre.palette} variant={genre.art} seed={genre.id} size="sm" />
              </span>
            </Link>
          ))}
        </div>

        {recentSearches.length > 0 && (
          <section className="recent-searches">
            <div className="shelf-head">
              <h2 className="shelf-title">Pencarian terakhir</h2>
              <button type="button" className="shelf-more" onClick={clearRecentSearches}>
                Bersihkan
              </button>
            </div>
            <div className="search-chips">
              {recentSearches.map((item) => (
                <Link key={item} to={`/search?q=${encodeURIComponent(item)}`} className="chip chip--ghost">
                  {item}
                  <X size={13} />
                </Link>
              ))}
            </div>
          </section>
        )}

        <Section title="Populer di Vibe Music" subtitle="Paling banyak diputar minggu ini">
          {allTracks
            .slice()
            .sort((a, b) => b.plays - a.plays)
            .slice(0, 8)
            .map((track) => (
              <MediaCard
                key={track.id}
                to={`/album/${track.albumId}`}
                title={track.title}
                subtitle={artistName(track.artistId)}
                palette={track.palette}
                variant={track.art}
                seed={track.id}
                onPlay={() => playList([track], track.title, track.id)}
              />
            ))}
        </Section>
      </div>
    );
  }

  const empty = results.tracks.length + results.albums.length + results.artists.length + results.playlists.length === 0;

  if (empty) {
    return (
      <div className="page">
        <div className="empty-state">
          <SearchX size={40} />
          <h1>Tidak ada hasil untuk “{query}”</h1>
          <p>Coba kata kunci lain, atau jelajahi genre yang tersedia.</p>
          <Link to="/search" className="ghost-btn">
            Kembali ke jelajah
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--search-results">
      <div className="page-heading">
        <h1>
          Hasil untuk <span>“{query}”</span>
        </h1>
      </div>

      <div className="search-top">
        {(featuredArtist || featuredPlaylist) && (
          <section className="top-result glass">
            <h2 className="shelf-title">Hasil teratas</h2>
            {featuredArtist ? (
              <Link to={`/artist/${featuredArtist.id}`} className="top-result-card">
                <Cover palette={featuredArtist.palette} variant={featuredArtist.art} seed={featuredArtist.id} size="lg" round />
                <div>
                  <span className="top-result-kind">Artis</span>
                  <h3>{featuredArtist.name}</h3>
                  <p>{featuredArtist.bio}</p>
                </div>
              </Link>
            ) : featuredPlaylist ? (
              <Link to={`/playlist/${featuredPlaylist.id}`} className="top-result-card">
                <Cover palette={featuredPlaylist.palette} variant={featuredPlaylist.art} seed={featuredPlaylist.id} size="lg" />
                <div>
                  <span className="top-result-kind">Playlist</span>
                  <h3>{featuredPlaylist.title}</h3>
                  <p>{featuredPlaylist.description}</p>
                </div>
              </Link>
            ) : null}
            <button
              type="button"
              className="play-btn top-result-play"
              aria-label="Putar hasil teratas"
              onClick={() => {
                if (featuredArtist) {
                  playList(allTracks.filter((t) => t.artistId === featuredArtist.id), featuredArtist.name, featuredArtist.id);
                } else if (featuredPlaylist) {
                  playList(
                    featuredPlaylist.trackIds.map((id) => allTracks.find((t) => t.id === id)!).filter(Boolean),
                    featuredPlaylist.title,
                    featuredPlaylist.id,
                  );
                }
              }}
            >
              <Play size={20} fill="currentColor" />
            </button>
          </section>
        )}

        <section className="top-songs glass">
          <h2 className="shelf-title">Lagu</h2>
          <TrackList
            tracks={topTracks}
            contextLabel={`Hasil pencarian “${query}”`}
            contextId={`search-${query}`}
            showAlbum={false}
            showCover
            header={false}
          />
        </section>
      </div>

      {results.artists.length > 0 && (
        <Section title="Artis">
          {results.artists.map((artist) => (
            <MediaCard
              key={artist.id}
              to={`/artist/${artist.id}`}
              title={artist.name}
              subtitle={`${formatCount(artist.followers)} pengikut`}
              palette={artist.palette}
              variant={artist.art}
              seed={artist.id}
              round
              onPlay={() =>
                playList(
                  allTracks.filter((t) => t.artistId === artist.id),
                  artist.name,
                  artist.id,
                )
              }
            />
          ))}
        </Section>
      )}

      {results.albums.length > 0 && (
        <Section title="Album">
          {results.albums.map((album) => (
            <MediaCard
              key={album.id}
              to={`/album/${album.id}`}
              title={album.title}
              subtitle={`${album.year} • ${artistName(album.artistId)}`}
              palette={album.palette}
              variant={album.art}
              seed={album.id}
              onPlay={() =>
                playList(
                  allTracks.filter((t) => t.albumId === album.id),
                  album.title,
                  album.id,
                )
              }
            />
          ))}
        </Section>
      )}

      {results.playlists.length > 0 && (
        <Section title="Playlist">
          {results.playlists.map((playlist) => (
            <MediaCard
              key={playlist.id}
              to={`/playlist/${playlist.id}`}
              title={playlist.title}
              subtitle={playlist.description}
              palette={playlist.palette}
              variant={playlist.art}
              seed={playlist.id}
              onPlay={() =>
                playList(
                  playlist.trackIds.map((id) => allTracks.find((t) => t.id === id)!).filter(Boolean),
                  playlist.title,
                  playlist.id,
                )
              }
            />
          ))}
        </Section>
      )}

      {results.tracks.length > 5 && (
        <section className="result-block">
          <h2 className="shelf-title">Lagu lainnya</h2>
          <TrackList
            tracks={results.tracks.slice(5)}
            contextLabel={`Hasil pencarian “${query}”`}
            contextId={`search-${query}`}
            showAlbum
          />
        </section>
      )}

      <div className="result-actions">
        <button type="button" className="ghost-btn" onClick={() => navigate("/search")}>
          Kembali ke jelajah
        </button>
      </div>
    </div>
  );
};

export default Search;
