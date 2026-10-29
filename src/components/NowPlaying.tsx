import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { albumTitle, artistName, formatDuration, getAlbum } from "@/data/catalog";
import { artGradient } from "@/lib/art";
import { useLibrary } from "@/store/libraryStore";
import { usePlayer } from "@/store/playerStore";
import Cover from "@/components/Cover";
import Equalizer from "@/components/Equalizer";
import Menu from "@/components/Menu";
import { useTrackActions } from "@/components/TrackList";
import type { Track } from "@/data/catalog";

/** Keeps the hook order stable: the menu only mounts once a track exists. */
const TrackMenuButton = ({ track }: { track: Track }) => {
  const actions = useTrackActions(track);
  return <Menu items={actions} label="Opsi lagu" />;
};

const NowPlaying = () => {
  const navigate = useNavigate();
  const {
    queue,
    index,
    isPlaying,
    progress,
    nowPlayingOpen,
    setNowPlayingOpen,
    toggle,
    next,
    prev,
    seek,
    shuffle,
    toggleShuffle,
    repeat,
    cycleRepeat,
    jumpTo,
    volume,
    muted,
    setVolume,
    toggleMute,
  } = usePlayer();
  const { toggleLike, isLiked } = useLibrary();
  const [tab, setTab] = useState<"queue" | "info">("queue");
  const [dragging, setDragging] = useState(false);
  const [draft, setDraft] = useState(0);
  const track = queue[index];

  useEffect(() => {
    if (!nowPlayingOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNowPlayingOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("is-locked");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("is-locked");
    };
  }, [nowPlayingOpen, setNowPlayingOpen]);

  useEffect(() => {
    if (!dragging) setDraft(progress);
  }, [progress, dragging]);

  if (!nowPlayingOpen || !track) return null;

  const liked = isLiked(track.id);
  const album = getAlbum(track.albumId);
  const value = dragging ? draft : progress;
  const percent = Math.min(100, (value / track.duration) * 100);

  return (
    <div
      className="nowplaying"
      role="dialog"
      aria-modal="true"
      aria-label={`Pemutar penuh — ${track.title}`}
      style={{ ["--np-bg" as string]: artGradient(track.palette, track.art) }}
    >
      <div className="np-backdrop" aria-hidden="true" />
      <div className="np-content">
        <header className="np-head">
          <button
            type="button"
            className="icon-btn glassy"
            onClick={() => setNowPlayingOpen(false)}
            aria-label="Tutup pemutar penuh"
          >
            <ChevronDown size={20} />
          </button>
          <div className="np-context">
            <span className="np-context-label">{usePlayer.getState().contextLabel || "Sedang diputar"}</span>
            <span className="np-context-sub">Vibe Music</span>
          </div>
          <TrackMenuButton track={track} />
        </header>

        <div className="np-main">
          <div className="np-artwork-wrap">
            <Cover palette={track.palette} variant={track.art} seed={track.id} size="hero" playing={isPlaying} className="np-artwork" />
          </div>

          <div className="np-details">
            <div className="np-title-row">
              <div>
                <h1 className="np-title">{track.title}</h1>
                <button type="button" className="np-artist" onClick={() => navigate(`/artist/${track.artistId}`)}>
                  {artistName(track.artistId)}
                </button>
              </div>
              <button
                type="button"
                className={`icon-btn np-like ${liked ? "is-liked" : ""}`}
                onClick={() => toggleLike(track.id)}
                aria-label={liked ? "Hapus dari lagu yang disukai" : "Simpan ke lagu yang disukai"}
                aria-pressed={liked}
              >
                <Heart size={22} fill={liked ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="np-progress">
              <input
                type="range"
                min={0}
                max={track.duration}
                value={Math.min(value, track.duration)}
                step={1}
                className="range range--progress range--lg"
                style={{ ["--value" as string]: `${percent}%` }}
                aria-label="Posisi lagu"
                onPointerDown={() => setDragging(true)}
                onChange={(event) => {
                  setDragging(true);
                  setDraft(Number(event.target.value));
                }}
                onPointerUp={() => {
                  seek(draft);
                  setDragging(false);
                }}
              />
              <div className="np-times">
                <span>{formatDuration(value)}</span>
                <span>{formatDuration(track.duration)}</span>
              </div>
            </div>

            <div className="np-controls">
              <button
                type="button"
                className={`icon-btn ${shuffle ? "is-on" : ""}`}
                onClick={toggleShuffle}
                aria-label="Acak"
              >
                <Shuffle size={19} />
              </button>
              <button type="button" className="icon-btn" onClick={prev} aria-label="Sebelumnya">
                <SkipBack size={26} fill="currentColor" />
              </button>
              <button type="button" className="play-btn play-btn--lg" onClick={toggle} aria-label={isPlaying ? "Jeda" : "Putar"}>
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
              </button>
              <button type="button" className="icon-btn" onClick={() => next()} aria-label="Berikutnya">
                <SkipForward size={26} fill="currentColor" />
              </button>
              <button
                type="button"
                className={`icon-btn ${repeat !== "off" ? "is-on" : ""}`}
                onClick={cycleRepeat}
                aria-label="Mode ulang"
              >
                {repeat === "one" ? <Repeat1 size={19} /> : <Repeat size={19} />}
              </button>
            </div>

            <div className="np-utility">
              <span className="np-utility-label">
                <ListMusic size={15} /> {usePlayer.getState().contextLabel || "Antrean"}
              </span>
              <div className="np-volume">
                <button type="button" className="icon-btn" onClick={toggleMute} aria-label="Bisukan">
                  {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  className="range range--volume"
                  style={{ ["--value" as string]: `${(muted ? 0 : volume) * 100}%` }}
                  aria-label="Volume"
                  onChange={(event) => setVolume(Number(event.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="np-panel">
            <div className="np-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "queue"}
                className={`np-tab ${tab === "queue" ? "is-active" : ""}`}
                onClick={() => setTab("queue")}
              >
                Berikutnya
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "info"}
                className={`np-tab ${tab === "info" ? "is-active" : ""}`}
                onClick={() => setTab("info")}
              >
                Info lagu
              </button>
            </div>

            {tab === "queue" ? (
              <ul className="np-queue">
                {queue.map((item, i) => {
                  if (i <= index) return null;
                  return (
                    <li key={`${item.id}-${i}`}>
                      <button type="button" className="np-queue-item" onClick={() => jumpTo(i)}>
                        <Cover palette={item.palette} variant={item.art} seed={item.id} size="xs" />
                        <span className="np-queue-text">
                          <span className="np-queue-title">{item.title}</span>
                          <span className="np-queue-artist">{artistName(item.artistId)}</span>
                        </span>
                        {i === index + 1 && <Equalizer />}
                      </button>
                    </li>
                  );
                })}
                {index >= queue.length - 1 && <li className="empty-note">Tidak ada lagu berikutnya.</li>}
              </ul>
            ) : (
              <div className="np-info">
                <button
                  type="button"
                  className="np-info-album"
                  onClick={() => {
                    setNowPlayingOpen(false);
                    navigate(`/album/${track.albumId}`);
                  }}
                >
                  <Cover palette={album?.palette ?? track.palette} variant={album?.art ?? track.art} seed={track.albumId} size="xs" />
                  <span>
                    <span className="np-info-label">Album</span>
                    <span className="np-info-value">{albumTitle(track.albumId)}</span>
                    {album && <span className="np-info-meta">{album.year} • {album.type === "album" ? "Album" : album.type === "ep" ? "EP" : "Single"}</span>}
                  </span>
                </button>
                <dl className="np-facts">
                  <div>
                    <dt>Diputar</dt>
                    <dd>{track.plays.toLocaleString("id-ID")} kali</dd>
                  </div>
                  <div>
                    <dt>Tempo</dt>
                    <dd>{track.mood.bpm} BPM</dd>
                  </div>
                  <div>
                    <dt>Nuansa</dt>
                    <dd>{track.mood.texture === "pad" ? "Ambient pad" : track.mood.texture === "keys" ? "Keys lembut" : track.mood.texture === "pluck" ? "Plucked arp" : "Pulse synth"}</dd>
                  </div>
                  <div>
                    <dt>Durasi</dt>
                    <dd>{formatDuration(track.duration)}</dd>
                  </div>
                </dl>
                <p className="np-note">
                  Audio demo disintesis langsung di perangkat oleh mesin Vibe Music, jadi aplikasi tetap ringan dan bisa
                  diputar offline.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NowPlaying;
