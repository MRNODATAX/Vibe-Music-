import { Link, useParams } from "react-router-dom";
import { Check, Download, Heart, Play, Share2 } from "lucide-react";
import {
  artistName,
  formatLongDuration,
  getAlbum,
  getArtist,
  totalDuration,
  tracksOfAlbum,
  tracksOfArtist,
} from "@/data/catalog";
import { useLibrary } from "@/store/libraryStore";
import { usePlayer } from "@/store/playerStore";
import DetailHeader from "@/components/DetailHeader";
import Menu from "@/components/Menu";
import MediaCard from "@/components/MediaCard";
import Section from "@/components/Section";
import TrackList from "@/components/TrackList";
import Cover from "@/components/Cover";
import { toast } from "@/components/Toast";
import NotFound from "@/pages/NotFound";

const AlbumPage = () => {
  const { id = "" } = useParams();
  const album = getAlbum(id);
  const { savedAlbums, toggleSavedAlbum } = useLibrary();
  const playContext = usePlayer((s) => s.playContext);

  if (!album) return <NotFound />;

  const artist = getArtist(album.artistId);
  const list = tracksOfAlbum(id);
  const saved = savedAlbums.includes(id);
  const total = totalDuration(list);
  const more = tracksOfArtist(album.artistId).filter((t) => t.albumId !== id).slice(0, 6);

  return (
    <div className="page page--detail">
      <DetailHeader
        kind={album.type === "album" ? "Album" : album.type === "ep" ? "EP" : "Single"}
        title={album.title}
        description={album.description}
        palette={album.palette}
        variant={album.art}
        seed={album.id}
        meta={
          <>
            <Link to={`/artist/${album.artistId}`} className="meta-strong meta-link">
              {artistName(album.artistId)}
            </Link>
            <span className="meta-dot" />
            <span>{album.year}</span>
            <span className="meta-dot" />
            <span>{list.length} lagu</span>
            <span className="meta-dot" />
            <span>{formatLongDuration(total)}</span>
          </>
        }
      >
        <button
          type="button"
          className="play-btn play-btn--xl"
          onClick={() => list.length && playContext(list, 0, album.title, album.id)}
          aria-label={`Putar ${album.title}`}
        >
          <Play size={22} fill="currentColor" />
        </button>
        <button
          type="button"
          className={`icon-btn glassy ${saved ? "is-on" : ""}`}
          onClick={() => {
            toggleSavedAlbum(id);
            toast(saved ? "Album dihapus dari koleksi" : "Album disimpan ke koleksi");
          }}
          aria-label={saved ? "Hapus dari koleksi" : "Simpan ke koleksi"}
          aria-pressed={saved}
        >
          {saved ? <Check size={18} /> : <Heart size={18} />}
        </button>
        <Menu
          items={[
            {
              label: "Tambah semua ke antrean",
              icon: Download,
              onSelect: () => {
                list.forEach((track) => usePlayer.getState().addToQueue(track));
                toast("Album ditambahkan ke antrean");
              },
            },
            {
              label: "Salin tautan album",
              icon: Share2,
              onSelect: () => {
                void navigator.clipboard
                  ?.writeText(`${window.location.origin}/album/${id}`)
                  .then(() => toast("Tautan album disalin"));
              },
            },
          ]}
          label="Opsi album"
        />
      </DetailHeader>

      <div className="detail-body">
        <TrackList tracks={list} contextLabel={album.title} contextId={album.id} showAlbum={false} showCover={false} />

        {artist && (
          <Link to={`/artist/${album.artistId}`} className="artist-inline glass">
            <Cover palette={artist.palette} variant={artist.art} seed={artist.id} size="xs" round />
            <span className="artist-inline-text">
              <span className="artist-inline-label">Artis</span>
              <span className="artist-inline-name">{artist.name}</span>
            </span>
            <span className="artist-inline-cta">Lihat artis</span>
          </Link>
        )}
      </div>

      {more.length > 0 && (
        <Section title={`Lainnya dari ${artistName(album.artistId)}`}>
          {Array.from(new Set(more.map((t) => t.albumId))).map((albumId) => {
            const other = getAlbum(albumId);
            if (!other) return null;
            return (
              <MediaCard
                key={other.id}
                to={`/album/${other.id}`}
                title={other.title}
                subtitle={`${other.year} • ${artistName(other.artistId)}`}
                palette={other.palette}
                variant={other.art}
                seed={other.id}
                onPlay={() => playContext(tracksOfAlbum(other.id), 0, other.title, other.id)}
              />
            );
          })}
        </Section>
      )}
    </div>
  );
};

export default AlbumPage;
