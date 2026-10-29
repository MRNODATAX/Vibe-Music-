import { useParams } from "react-router-dom";
import { BadgeCheck, Play, Shuffle, UserCheck, UserPlus } from "lucide-react";
import {
  albumsOfArtist,
  artistName,
  formatCount,
  getArtist,
  tracksOfArtist,
} from "@/data/catalog";
import { useLibrary } from "@/store/libraryStore";
import { usePlayer } from "@/store/playerStore";
import Cover from "@/components/Cover";
import DetailHeader from "@/components/DetailHeader";
import MediaCard from "@/components/MediaCard";
import Section from "@/components/Section";
import TrackList from "@/components/TrackList";
import { toast } from "@/components/Toast";
import NotFound from "@/pages/NotFound";

const ArtistPage = () => {
  const { id = "" } = useParams();
  const artist = getArtist(id);
  const { followedArtists, toggleFollow } = useLibrary();
  const playContext = usePlayer((s) => s.playContext);

  if (!artist) return <NotFound />;

  const list = tracksOfArtist(id);
  const popular = list.slice(0, 5);
  const albums = albumsOfArtist(id);
  const following = followedArtists.includes(id);
  const related = followedArtists.filter((artistId) => artistId !== id);

  return (
    <div className="page page--detail page--artist">
      <DetailHeader
        kind={artist.verified ? "Artis terverifikasi" : "Artis"}
        title={artist.name}
        description={artist.bio}
        palette={artist.palette}
        variant={artist.art}
        seed={artist.id}
        round
        meta={
          <>
            <span className="meta-strong">{formatCount(artist.monthlyListeners)} pendengar bulanan</span>
            <span className="meta-dot" />
            <span>{formatCount(artist.followers)} pengikut</span>
            {artist.verified && (
              <>
                <span className="meta-dot" />
                <span className="meta-verified">
                  <BadgeCheck size={15} /> Terverifikasi
                </span>
              </>
            )}
          </>
        }
      >
        <button
          type="button"
          className="play-btn play-btn--xl"
          onClick={() => list.length && playContext(list, 0, artist.name, artist.id)}
          aria-label={`Putar ${artist.name}`}
        >
          <Play size={22} fill="currentColor" />
        </button>
        <button
          type="button"
          className="icon-btn glassy"
          onClick={() => {
            if (!list.length) return;
            const state = usePlayer.getState();
            if (!state.shuffle) state.toggleShuffle();
            playContext(list, Math.floor(Math.random() * list.length), artist.name, artist.id);
          }}
          aria-label="Acak lagu artis"
          title="Acak"
        >
          <Shuffle size={18} />
        </button>
        <button
          type="button"
          className={`ghost-btn ${following ? "is-following" : ""}`}
          onClick={() => {
            toggleFollow(id);
            toast(following ? `Berhenti mengikuti ${artist.name}` : `Mengikuti ${artist.name}`);
          }}
        >
          {following ? <UserCheck size={16} /> : <UserPlus size={16} />}
          {following ? "Mengikuti" : "Ikuti"}
        </button>
      </DetailHeader>

      <div className="detail-body">
        <section className="artist-popular">
          <h2 className="shelf-title">Populer</h2>
          <TrackList
            tracks={popular}
            contextLabel={artist.name}
            contextId={artist.id}
            showAlbum
            showCover
            showPlays
            header={false}
          />
        </section>

        {albums.length > 0 && (
          <Section title="Diskografi" subtitle={`${albums.length} rilisan`}>
            {albums.map((album) => (
              <MediaCard
                key={album.id}
                to={`/album/${album.id}`}
                title={album.title}
                subtitle={`${album.year} • ${album.type === "album" ? "Album" : album.type === "ep" ? "EP" : "Single"}`}
                palette={album.palette}
                variant={album.art}
                seed={album.id}
                onPlay={() => playContext(tracksOfArtist(artist.id).filter((t) => t.albumId === album.id), 0, album.title, album.id)}
              />
            ))}
          </Section>
        )}

        {related.length > 0 && (
          <Section title="Artis yang kamu ikuti">
            {related.map((artistId) => {
              const other = getArtist(artistId);
              if (!other) return null;
              return (
                <MediaCard
                  key={other.id}
                  to={`/artist/${other.id}`}
                  title={other.name}
                  subtitle="Artis"
                  palette={other.palette}
                  variant={other.art}
                  seed={other.id}
                  round
                />
              );
            })}
          </Section>
        )}

        <section className="artist-about glass">
          <h2>Tentang {artist.name}</h2>
          <p>{artist.bio}</p>
          <dl>
            <div>
              <dt>Pendengar bulanan</dt>
              <dd>{artist.monthlyListeners.toLocaleString("id-ID")}</dd>
            </div>
            <div>
              <dt>Total lagu di Vibe</dt>
              <dd>{list.length}</dd>
            </div>
            <div>
              <dt>Rilisan</dt>
              <dd>{albums.length}</dd>
            </div>
          </dl>
          <div className="artist-about-art">
            <Cover palette={artist.palette} variant={artist.art} seed={`${artist.id}-about`} size="md" round />
          </div>
          <span className="sr-only">{artistName(artist.id)}</span>
        </section>
      </div>
    </div>
  );
};

export default ArtistPage;
