import { useEffect, useRef } from "react";
import { engine } from "@/audio/engine";
import { artistName, albumTitle, type Track } from "@/data/catalog";
import { useLibrary } from "@/store/libraryStore";
import { usePlayer } from "@/store/playerStore";
import { useTheme } from "@/hooks/useTheme";

/**
 * Bridges the player store with the audio layer (Web Audio engine or a plain
 * <audio> element when a track ships a real stream) and keeps OS media
 * controls in sync, which is what makes the installed PWA feel native.
 */
const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const seekToken = usePlayer((s) => s.seekToken);
  const progress = usePlayer((s) => s.progress);

  const track: Track | undefined = queue[index];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextRef = useRef(usePlayer.getState().next);
  const pushRecent = useLibrary((s) => s.pushRecent);

  useTheme();

  nextRef.current = usePlayer.getState().next;

  /* ------------------------------------------------------------------ */
  /*  Track changes                                                      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!track) return;
    pushRecent(track.id);

    const audio = audioRef.current;
    if (track.audioUrl) {
      engine.stop();
      if (audio) {
        audio.src = track.audioUrl;
        audio.currentTime = 0;
        if (isPlaying) void audio.play().catch(() => usePlayer.getState().setPlaying(false));
      }
    } else {
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
      }
      engine.load(track.mood, 0);
      if (isPlaying) void engine.play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  /* ------------------------------------------------------------------ */
  /*  Play / pause                                                       */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!track) return;
    if (track.audioUrl) {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) void audio.play().catch(() => undefined);
      else audio.pause();
      return;
    }
    if (isPlaying) void engine.play();
    else engine.pause();
  }, [isPlaying, track]);

  /* ------------------------------------------------------------------ */
  /*  Volume + mute                                                      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    engine.setMuted(muted);
    engine.setVolume(volume);
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  /* ------------------------------------------------------------------ */
  /*  Scrubbing                                                          */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (seekToken === 0 || !track) return;
    const position = usePlayer.getState().progress;
    if (track.audioUrl) {
      if (audioRef.current) audioRef.current.currentTime = position;
    } else {
      engine.seek(position);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seekToken]);

  /* ------------------------------------------------------------------ */
  /*  Transport clock                                                    */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!track) return;
    const id = window.setInterval(() => {
      const state = usePlayer.getState();
      const current = state.queue[state.index];
      if (!current || !state.isPlaying) return;
      let position = 0;
      if (current.audioUrl) position = audioRef.current?.currentTime ?? 0;
      else position = engine.position();

      if (position >= current.duration - 0.25) {
        if (state.repeat === "one") {
          // same track loops: restart the arrangement instead of reloading it
          if (current.audioUrl) {
            if (audioRef.current) audioRef.current.currentTime = 0;
          } else {
            engine.seek(0);
          }
          state.setProgress(0);
          return;
        }
        nextRef.current(true);
        return;
      }
      state.setProgress(position);
    }, 250);
    return () => window.clearInterval(id);
  }, [track?.id, track?.duration]);

  /* ------------------------------------------------------------------ */
  /*  Media Session (lock screen / OS controls)                          */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!track || !("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    session.metadata = new MediaMetadata({
      title: track.title,
      artist: artistName(track.artistId),
      album: albumTitle(track.albumId),
      artwork: [],
    });
    session.playbackState = isPlaying ? "playing" : "paused";
    try {
      session.setActionHandler("play", () => usePlayer.getState().setPlaying(true));
      session.setActionHandler("pause", () => usePlayer.getState().setPlaying(false));
      session.setActionHandler("nexttrack", () => usePlayer.getState().next());
      session.setActionHandler("previoustrack", () => usePlayer.getState().prev());
      session.setActionHandler("seekbackward", () => usePlayer.getState().seekBy(-10));
      session.setActionHandler("seekforward", () => usePlayer.getState().seekBy(10));
      session.setActionHandler("seekto", (details) => {
        if (typeof details.seekTime === "number") usePlayer.getState().seek(details.seekTime);
      });
    } catch {
      /* some handlers are unsupported */
    }
  }, [track, isPlaying]);

  useEffect(() => {
    if (!track || !("mediaSession" in navigator) || !navigator.mediaSession.setPositionState) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: track.duration,
        position: Math.min(progress, track.duration),
        playbackRate: 1,
      });
    } catch {
      /* ignore out-of-range positions while switching tracks */
    }
  }, [progress, track]);

  return (
    <>
      {children}
      <audio ref={audioRef} preload="auto" crossOrigin="anonymous" />
    </>
  );
};

export default PlayerProvider;
