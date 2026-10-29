import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  ListMusic,
  Maximize2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { artistName, formatDuration } from "@/data/catalog";
import { useLibrary } from "@/store/libraryStore";
import { usePlayer } from "@/store/playerStore";
import Cover from "@/components/Cover";

const PlayerBar = () => {
  const navigate = useNavigate();
  const { queue, index, isPlaying, progress, volume, muted } = usePlayer();
  const {
    toggle,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    shuffle,
    toggleShuffle,
    repeat,
    cycleRepeat,
    queueOpen,
    setQueueOpen,
    setNowPlayingOpen,
  } = usePlayer();
  const { toggleLike, isLiked } = useLibrary();
  const [dragging, setDragging] = useState(false);
  const [draft, setDraft] = useState(0);
  const track = queue[index];

  useEffect(() => {
    if (!dragging) setDraft(progress);
  }, [progress, dragging]);

  const value = dragging ? draft : progress;
  const percent = track ? Math.min(100, (value / track.duration) * 100) : 0;
  const liked = track ? isLiked(track.id) : false;
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.45 ? Volume1 : Volume2;
  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

  if (!track) {
    return (
      <div className="player player--empty glass" role="region" aria-label="Pemutar">
        <p className="player-empty-note">Pilih lagu untuk mulai mendengarkan</p>
        <button type="button" className="ghost-btn" onClick={() => navigate("/search")}>
          Jelajahi musik
        </button>
      </div>
    );
  }

  return (
    <div className="player glass" role="region" aria-label="Pemutar">
      <div className="player-left">
        <button
          type="button"
          className="player-cover"
          onClick={() => {
            if (window.matchMedia("(max-width: 900px)").matches) setNowPlayingOpen(true);
            else navigate(`/album/${track.albumId}`);
          }}
          aria-label="Buka pemutar penuh"
        >
          <Cover palette={track.palette} variant={track.art} seed={track.id} size="sm" playing={isPlaying} />
        </button>
        <div className="player-meta">
          <button type="button" className="player-title" onClick={() => setNowPlayingOpen(true)}>
            {track.title}
          </button>
          <button type="button" className="player-artist" onClick={() => navigate(`/artist/${track.artistId}`)}>
            {artistName(track.artistId)}
          </button>
        </div>
        <button
          type="button"
          className={`icon-btn player-like ${liked ? "is-liked" : ""}`}
          onClick={() => toggleLike(track.id)}
          aria-label={liked ? "Hapus dari lagu yang disukai" : "Simpan ke lagu yang disukai"}
          aria-pressed={liked}
        >
          <Heart size={17} fill={liked ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="player-center">
        <div className="player-controls">
          <button
            type="button"
            className={`icon-btn ${shuffle ? "is-on" : ""}`}
            onClick={toggleShuffle}
            aria-label="Acak"
            aria-pressed={shuffle}
          >
            <Shuffle size={16} />
          </button>
          <button type="button" className="icon-btn" onClick={prev} aria-label="Sebelumnya">
            <SkipBack size={19} fill="currentColor" />
          </button>
          <button
            type="button"
            className="play-btn"
            onClick={toggle}
            aria-label={isPlaying ? "Jeda" : "Putar"}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <button type="button" className="icon-btn" onClick={() => next()} aria-label="Berikutnya">
            <SkipForward size={19} fill="currentColor" />
          </button>
          <button
            type="button"
            className={`icon-btn ${repeat !== "off" ? "is-on" : ""}`}
            onClick={cycleRepeat}
            aria-label={`Ulangi: ${repeat === "off" ? "nonaktif" : repeat === "all" ? "semua" : "satu lagu"}`}
            aria-pressed={repeat !== "off"}
          >
            <RepeatIcon size={16} />
          </button>
        </div>

        <div className="player-progress">
          <span className="time">{formatDuration(value)}</span>
          <input
            type="range"
            min={0}
            max={track.duration}
            step={1}
            value={Math.min(value, track.duration)}
            className="range range--progress"
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
            onKeyUp={() => {
              if (dragging) {
                seek(draft);
                setDragging(false);
              }
            }}
          />
          <span className="time">{formatDuration(track.duration)}</span>
        </div>
      </div>

      <div className="player-right">
        <button
          type="button"
          className={`icon-btn ${queueOpen ? "is-on" : ""}`}
          onClick={() => {
            if (window.matchMedia("(max-width: 1180px)").matches) setNowPlayingOpen(true);
            else setQueueOpen(!queueOpen);
          }}
          aria-label="Antrean"
          aria-pressed={queueOpen}
          title="Antrean"
        >
          <ListMusic size={17} />
        </button>
        <div className="volume">
          <button type="button" className="icon-btn" onClick={toggleMute} aria-label={muted ? "Nyalakan suara" : "Bisukan"}>
            <VolumeIcon size={17} />
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
        <button
          type="button"
          className="icon-btn hide-sm"
          onClick={() => setNowPlayingOpen(true)}
          aria-label="Buka tampilan pemutar penuh"
          title="Perbesar"
        >
          <Maximize2 size={16} />
        </button>
        <button
          type="button"
          className="icon-btn show-sm-only"
          onClick={() => next()}
          aria-label="Berikutnya"
        >
          <SkipForward size={17} fill="currentColor" />
        </button>
        <button
          type="button"
          className="play-btn play-btn--mini show-sm-only"
          onClick={toggle}
          aria-label={isPlaying ? "Jeda" : "Putar"}
        >
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </button>
      </div>
    </div>
  );
};

export default PlayerBar;
