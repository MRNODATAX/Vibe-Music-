import { Heart, Play, Shuffle } from "lucide-react";
import { formatLongDuration, getTrack, totalDuration, type Track } from "@/data/catalog";
import { useLibrary } from "@/store/libraryStore";
import { usePlayer } from "@/store/playerStore";
import DetailHeader from "@/components/DetailHeader";
import TrackList from "@/components/TrackList";
import { toast } from "@/components/Toast";

const LikedPage = () => {
  const { likedTracks, toggleLike } = useLibrary();
  const playContext = usePlayer((s) => s.playContext);

  const list = likedTracks
    .map((id) => getTrack(id))
    .filter((t): t is Track => Boolean(t));
  const total = totalDuration(list);

  return (
    <div className="page page--detail">
      <DetailHeader
        kind="Playlist"
        title="Lagu yang disukai"
        palette={{ base: "#1a0d16", accent: "#ff5c93", accent2: "#c4b5fd" }}
        seed="liked"
        inlineCover={
          <span className="liked-hero-cover">
            <Heart size={64} fill="currentColor" />
          </span>
        }
        meta={
          <>
            <span className="meta-strong">Kamu</span>
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
        <button
          type="button"
          className="play-btn play-btn--xl"
          onClick={() => (list.length ? playContext(list, 0, "Lagu yang disukai", "liked") : toast("Belum ada lagu yang disukai"))}
          aria-label="Putar lagu yang disukai"
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
            playContext(list, Math.floor(Math.random() * list.length), "Lagu yang disukai", "liked");
          }}
          aria-label="Acak lagu yang disukai"
        >
          <Shuffle size={18} />
        </button>
      </DetailHeader>

      <div className="detail-body">
        <TrackList
          tracks={list}
          contextLabel="Lagu yang disukai"
          contextId="liked"
          showAlbum
          showCover={false}
          emptyMessage="Tekan ikon hati pada lagu mana pun untuk menyimpannya di sini."
          onRemove={(trackId) => {
            toggleLike(trackId);
            toast("Dihapus dari Lagu yang disukai");
          }}
        />
      </div>
    </div>
  );
};

export default LikedPage;
