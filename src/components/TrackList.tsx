import { useNavigate } from "react-router-dom";
import { Disc3, Heart, ListPlus, Play, Plus, Share2, Trash2, User } from "lucide-react";
import {
  albumTitle,
  artistName,
  formatDuration,
  type Track,
} from "@/data/catalog";
import { useLibrary } from "@/store/libraryStore";
import { usePlayer } from "@/store/playerStore";
import Cover from "@/components/Cover";
import Equalizer from "@/components/Equalizer";
import Menu, { type MenuAction } from "@/components/Menu";
import { toast } from "@/components/Toast";

interface TrackListProps {
  tracks: Track[];
  contextLabel: string;
  contextId?: string;
  showAlbum?: boolean;
  showCover?: boolean;
  showPlays?: boolean;
  /** render the header row */
  header?: boolean;
  onRemove?: (trackId: string) => void;
  emptyMessage?: string;
}

export const useTrackActions = (track: Track): MenuAction[] => {
  const navigate = useNavigate();
  const { playNext, addToQueue } = usePlayer();
  const { toggleLike, isLiked, playlists, addTrackToPlaylist } = useLibrary();

  const items: MenuAction[] = [
    { label: "Putar berikutnya", icon: Plus, onSelect: () => { playNext(track); toast("Akan diputar berikutnya"); } },
    { label: "Tambahkan ke antrean", icon: ListPlus, onSelect: () => { addToQueue(track); toast("Ditambahkan ke antrean"); } },
    {
      label: isLiked(track.id) ? "Hapus dari Lagu yang disukai" : "Simpan ke Lagu yang disukai",
      icon: Heart,
      onSelect: () => {
        toggleLike(track.id);
        toast(isLiked(track.id) ? "Dihapus dari Lagu yang disukai" : "Disimpan ke Lagu yang disukai");
      },
    },
    { label: "Lihat album", icon: Disc3, onSelect: () => navigate(`/album/${track.albumId}`), divider: true },
    { label: "Lihat artis", icon: User, onSelect: () => navigate(`/artist/${track.artistId}`) },
    {
      label: "Salin tautan lagu",
      icon: Share2,
      onSelect: () => {
        void navigator.clipboard
          ?.writeText(`${window.location.origin}/track/${track.id}`)
          .then(() => toast("Tautan disalin"))
          .catch(() => toast("Tidak bisa menyalin tautan"));
      },
    },
  ];

  playlists.slice(0, 3).forEach((playlist, i) => {
    items.push({
      label: `Tambahkan ke ${playlist.title}`,
      icon: ListPlus,
      divider: i === 0,
      onSelect: () => {
        addTrackToPlaylist(playlist.id, track.id);
        toast(`Ditambahkan ke ${playlist.title}`);
      },
    });
  });

  return items;
};

const TrackRow = ({
  track,
  position,
  isCurrent,
  isPlaying,
  showAlbum,
  showCover,
  showPlays,
  onRemove,
  onPlay,
}: {
  track: Track;
  position: number;
  isCurrent: boolean;
  isPlaying: boolean;
  showAlbum?: boolean;
  showCover?: boolean;
  showPlays?: boolean;
  onRemove?: (trackId: string) => void;
  onPlay: () => void;
}) => {
  const navigate = useNavigate();
  const { toggleLike, isLiked } = useLibrary();
  const { toggle } = usePlayer();
  const actions = useTrackActions(track);
  const liked = isLiked(track.id);

  const play = () => {
    if (isCurrent) {
      toggle();
      return;
    }
    onPlay();
  };

  return (
    <div
      className={`track-row ${isCurrent ? "is-current" : ""}`}
      role="row"
      tabIndex={0}
      onDoubleClick={play}
      onKeyDown={(event) => {
        if (event.key === "Enter") play();
        if (event.key === "Delete" && onRemove) onRemove(track.id);
      }}
    >
      <div className="track-index">
        <span className="track-number">{isCurrent && isPlaying ? <Equalizer /> : position}</span>
        <button type="button" className="track-play" aria-label={`Putar ${track.title}`} onClick={play}>
          <Play size={15} fill="currentColor" />
        </button>
      </div>

      {showCover && (
        <div className="track-cover">
          <Cover palette={track.palette} variant={track.art} seed={track.id} size="xs" />
        </div>
      )}

      <div className="track-main">
        <span className="track-title">{track.title}</span>
        <button
          type="button"
          className="track-artist"
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/artist/${track.artistId}`);
          }}
        >
          {artistName(track.artistId)}
        </button>
      </div>

      {showAlbum && (
        <button
          type="button"
          className="track-album"
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/album/${track.albumId}`);
          }}
        >
          {albumTitle(track.albumId)}
        </button>
      )}

      {showPlays && <span className="track-plays">{track.plays.toLocaleString("id-ID")}</span>}

      <button
        type="button"
        className={`track-like ${liked ? "is-liked" : ""}`}
        aria-label={liked ? "Hapus dari lagu yang disukai" : "Simpan ke lagu yang disukai"}
        aria-pressed={liked}
        onClick={(event) => {
          event.stopPropagation();
          toggleLike(track.id);
        }}
      >
        <Heart size={16} fill={liked ? "currentColor" : "none"} />
      </button>

      <span className="track-duration">{formatDuration(track.duration)}</span>

      <div className="track-menu">
        {onRemove && (
          <button
            type="button"
            className="icon-btn"
            aria-label="Hapus dari playlist"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(track.id);
            }}
          >
            <Trash2 size={16} />
          </button>
        )}
        <Menu
          items={actions.map((action) => ({ ...action, onSelect: () => action.onSelect() }))}
          label={`Opsi untuk ${track.title}`}
        />
      </div>
    </div>
  );
};

const TrackList = ({
  tracks,
  contextLabel,
  contextId,
  showAlbum = true,
  showCover = true,
  showPlays = false,
  header = true,
  onRemove,
  emptyMessage = "Belum ada lagu di sini.",
}: TrackListProps) => {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playContext = usePlayer((s) => s.playContext);
  const currentId = queue[index]?.id;

  if (tracks.length === 0) return <p className="empty-note">{emptyMessage}</p>;

  return (
    <div className={`track-list ${showAlbum ? "has-album" : ""} ${showPlays ? "has-plays" : ""}`} role="table">
      {header && (
        <div className="track-head" role="row">
          <span className="track-index">#</span>
          {showCover && <span className="track-cover" aria-hidden="true" />}
          <span className="track-main">Judul</span>
          {showAlbum && <span className="track-album">Album</span>}
          {showPlays && <span className="track-plays">Diputar</span>}
          <span className="track-like" aria-hidden="true" />
          <span className="track-duration">Durasi</span>
          <span className="track-menu" aria-hidden="true" />
        </div>
      )}
      {tracks.map((track, i) => (
        <TrackRow
          key={track.id}
          track={track}
          position={i + 1}
          isCurrent={currentId === track.id}
          isPlaying={isPlaying}
          showAlbum={showAlbum}
          showCover={showCover}
          showPlays={showPlays}
          onRemove={onRemove}
          onPlay={() => playContext(tracks, i, contextLabel, contextId)}
        />
      ))}
    </div>
  );
};

export default TrackList;
