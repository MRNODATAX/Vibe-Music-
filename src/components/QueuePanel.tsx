import { Clock3, Maximize2, X } from "lucide-react";
import { artistName, formatDuration } from "@/data/catalog";
import { useLibrary } from "@/store/libraryStore";
import { usePlayer } from "@/store/playerStore";
import Cover from "@/components/Cover";
import Equalizer from "@/components/Equalizer";

const QueuePanel = () => {
  const { queue, index, isPlaying, queueOpen, setQueueOpen, jumpTo, removeFromQueue, contextLabel } = usePlayer();
  const { isLiked } = useLibrary();
  const current = queue[index];

  if (!queueOpen) return null;

  return (
    <aside className="queue-panel glass" aria-label="Antrean pemutaran">
      <header className="queue-head">
        <div>
          <h2>Antrean</h2>
          <p className="queue-sub">{contextLabel || "Dari koleksimu"}</p>
        </div>
        <div className="queue-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => usePlayer.getState().setNowPlayingOpen(true)}
            aria-label="Buka pemutar penuh"
            title="Pemutar penuh"
          >
            <Maximize2 size={16} />
          </button>
          <button type="button" className="icon-btn" onClick={() => setQueueOpen(false)} aria-label="Tutup antrean">
            <X size={17} />
          </button>
        </div>
      </header>

      {current ? (
        <>
          <section className="queue-now">
            <h3 className="queue-label">Sedang diputar</h3>
            <div className="queue-now-card">
              <Cover palette={current.palette} variant={current.art} seed={current.id} size="md" playing={isPlaying} />
              <div className="queue-now-text">
                <span className="queue-track-title">{current.title}</span>
                <span className="queue-track-artist">{artistName(current.artistId)}</span>
                {isLiked(current.id) && <span className="queue-liked">Disukai</span>}
              </div>
              {isPlaying ? <Equalizer /> : <Clock3 size={16} />}
            </div>
          </section>

          <section className="queue-next">
            <h3 className="queue-label">Berikutnya</h3>
            {queue.length <= 1 && <p className="empty-note">Tidak ada lagu berikutnya. Tambahkan dari menu lagu.</p>}
            <ul className="queue-list">
              {queue.map((track, i) => {
                if (i <= index) return null;
                return (
                  <li key={`${track.id}-${i}`} className="queue-item">
                    <button type="button" className="queue-item-main" onClick={() => jumpTo(i)}>
                      <Cover palette={track.palette} variant={track.art} seed={track.id} size="xs" />
                      <span className="queue-item-text">
                        <span className="queue-track-title">{track.title}</span>
                        <span className="queue-track-artist">{artistName(track.artistId)}</span>
                      </span>
                    </button>
                    <span className="queue-item-time">{formatDuration(track.duration)}</span>
                    <button
                      type="button"
                      className="icon-btn queue-remove"
                      onClick={() => removeFromQueue(i)}
                      aria-label={`Hapus ${track.title} dari antrean`}
                    >
                      <X size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      ) : (
        <p className="empty-note">Antrean masih kosong. Pilih lagu untuk mulai.</p>
      )}
    </aside>
  );
};

export default QueuePanel;
