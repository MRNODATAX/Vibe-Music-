import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ListPlus, Pencil, Play, Shuffle, Trash2 } from "lucide-react";
import {
  formatDuration,
  formatLongDuration,
  getPlaylist,
  getTrack,
  PALETTES,
  playlistTracks,
  totalDuration,
  type Palette,
} from "@/data/catalog";
import { useLibrary } from "@/store/libraryStore";
import { usePlayer } from "@/store/playerStore";
import DetailHeader from "@/components/DetailHeader";
import Menu from "@/components/Menu";
import TrackList from "@/components/TrackList";
import { toast } from "@/components/Toast";
import NotFound from "@/pages/NotFound";

const PlaylistPage = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const curated = getPlaylist(id);
  const userPlaylist = useLibrary((s) => s.playlists.find((p) => p.id === id));
  const { renamePlaylist, deletePlaylist, removeTrackFromPlaylist } = useLibrary();
  const playContext = usePlayer((s) => s.playContext);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(userPlaylist?.title ?? "");

  if (!curated && !userPlaylist) return <NotFound />;

  const palette: Palette = curated
    ? curated.palette
    : PALETTES[["violet", "cyan", "rose", "amber", "mint", "indigo"][userPlaylist!.paletteIndex % 6] as keyof typeof PALETTES];
  const variant = curated?.art ?? "bloom";
  const name = curated?.title ?? userPlaylist!.title;
  const description = curated?.description ?? (userPlaylist?.trackIds.length ? "Playlist buatanmu." : "Tambahkan lagu dari menu ⋯ tiap lagu.");
  const list = curated
    ? playlistTracks(curated)
    : userPlaylist!.trackIds.map((trackId) => getTrack(trackId)).filter((t): t is NonNullable<typeof t> => Boolean(t));
  const total = totalDuration(list);

  const playAll = (shuffle = false) => {
    if (list.length === 0) {
      toast("Playlist ini masih kosong. Tambahkan lagu dari menu ⋯.");
      return;
    }
    const state = usePlayer.getState();
    if (shuffle) state.toggleShuffle();
    playContext(list, shuffle ? Math.floor(Math.random() * list.length) : 0, name, id);
  };

  const menuItems = userPlaylist
    ? [
        {
          label: "Ubah nama playlist",
          icon: Pencil,
          onSelect: () => {
            setTitle(userPlaylist.title);
            setEditing(true);
          },
        },
        {
          label: "Hapus playlist",
          icon: Trash2,
          danger: true,
          divider: true,
          onSelect: () => {
            deletePlaylist(id);
            toast("Playlist dihapus");
            navigate("/library");
          },
        },
      ]
    : [
        {
          label: "Tambahkan semua ke antrean",
          icon: ListPlus,
          onSelect: () => {
            list.forEach((track) => usePlayer.getState().addToQueue(track));
            toast("Semua lagu ditambahkan ke antrean");
          },
        },
      ];

  return (
    <div className="page page--detail">
      <DetailHeader
        kind="Playlist"
        title={name}
        description={description}
        palette={palette}
        variant={variant}
        seed={id}
        meta={
          <>
            <span className="meta-strong">{curated ? "Vibe Music" : "Kamu"}</span>
            <span className="meta-dot" />
            <span>{list.length} lagu</span>
            {list.length > 0 && (
              <>
                <span className="meta-dot" />
                <span>{formatLongDuration(total)}</span>
              </>
            )}
          </>
        }
      >
        <button type="button" className="play-btn play-btn--xl" onClick={() => playAll()} aria-label="Putar playlist">
          <Play size={22} fill="currentColor" />
        </button>
        <button type="button" className="icon-btn glassy" onClick={() => playAll(true)} aria-label="Acak playlist" title="Acak">
          <Shuffle size={18} />
        </button>
        <Menu items={menuItems} label="Opsi playlist" />
      </DetailHeader>

      {editing && userPlaylist && (
        <form
          className="inline-edit glass"
          onSubmit={(event) => {
            event.preventDefault();
            renamePlaylist(id, title.trim() || userPlaylist.title);
            setEditing(false);
            toast("Nama playlist diperbarui");
          }}
        >
          <label>
            Nama playlist
            <input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus maxLength={60} />
          </label>
          <div className="inline-edit-actions">
            <button type="submit" className="primary-btn">
              Simpan
            </button>
            <button type="button" className="ghost-btn" onClick={() => setEditing(false)}>
              Batal
            </button>
          </div>
        </form>
      )}

      <div className="detail-body">
        <TrackList
          tracks={list}
          contextLabel={name}
          contextId={id}
          showAlbum
          showCover={false}
          header={list.length > 0}
          emptyMessage="Belum ada lagu. Tekan ⋯ pada lagu mana pun lalu pilih “Tambahkan ke playlist ini”."
          onRemove={
            userPlaylist
              ? (trackId) => {
                  removeTrackFromPlaylist(id, trackId);
                  toast("Lagu dihapus dari playlist");
                }
              : undefined
          }
        />
        {list.length > 0 && (
          <p className="detail-total">{list.length} lagu, {formatLongDuration(total)} • Durasi rata-rata {formatDuration(total / list.length)}</p>
        )}
      </div>
    </div>
  );
};

export default PlaylistPage;
