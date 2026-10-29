import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Track } from "@/data/catalog";

export type RepeatMode = "off" | "all" | "one";

interface PlayerState {
  queue: Track[];
  index: number;
  isPlaying: boolean;
  progress: number;
  /** bumped whenever the user scrubs, so the audio layer can hard-seek */
  seekToken: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  contextLabel: string;
  contextId: string | null;
  queueOpen: boolean;
  nowPlayingOpen: boolean;

  playContext: (tracks: Track[], start?: number, label?: string, contextId?: string | null) => void;
  playTrackNow: (track: Track, label?: string) => void;
  toggle: () => void;
  setPlaying: (value: boolean) => void;
  next: (auto?: boolean) => void;
  prev: () => void;
  setProgress: (value: number) => void;
  seek: (value: number) => void;
  seekBy: (delta: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  jumpTo: (index: number) => void;
  setQueueOpen: (value: boolean) => void;
  setNowPlayingOpen: (value: boolean) => void;
  clear: () => void;
}

const clampIndex = (index: number, length: number) => Math.min(Math.max(index, 0), Math.max(0, length - 1));

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      index: 0,
      isPlaying: false,
      progress: 0,
      seekToken: 0,
      volume: 0.8,
      muted: false,
      shuffle: false,
      repeat: "off",
      contextLabel: "",
      contextId: null,
      queueOpen: false,
      nowPlayingOpen: false,

      playContext: (tracks, start = 0, label = "", contextId = null) => {
        if (tracks.length === 0) return;
        const index = clampIndex(start, tracks.length);
        set({
          queue: tracks,
          index,
          progress: 0,
          isPlaying: true,
          contextLabel: label,
          contextId,
        });
      },

      playTrackNow: (track, label = "") => {
        const { queue, index } = get();
        const existing = queue.findIndex((t) => t.id === track.id);
        if (existing >= 0) {
          set({ index: existing, progress: 0, isPlaying: true, contextLabel: label || get().contextLabel });
          return;
        }
        const nextQueue = [...queue];
        nextQueue.splice(index + 1, 0, track);
        set({ queue: nextQueue, index: index + 1, progress: 0, isPlaying: true, contextLabel: label || get().contextLabel });
      },

      toggle: () => {
        const { queue, isPlaying } = get();
        if (queue.length === 0) return;
        set({ isPlaying: !isPlaying });
      },

      setPlaying: (value) => set({ isPlaying: value }),

      next: (auto = false) => {
        const { queue, index, shuffle, repeat } = get();
        if (queue.length === 0) return;
        if (auto && repeat === "one") {
          set({ progress: 0, isPlaying: true });
          return;
        }
        if (shuffle && queue.length > 1) {
          let pick = index;
          while (pick === index) pick = Math.floor(Math.random() * queue.length);
          set({ index: pick, progress: 0, isPlaying: true });
          return;
        }
        if (index + 1 < queue.length) {
          set({ index: index + 1, progress: 0, isPlaying: true });
          return;
        }
        if (repeat === "all") {
          set({ index: 0, progress: 0, isPlaying: true });
          return;
        }
        set({ isPlaying: false, progress: 0 });
      },

      prev: () => {
        const { queue, index, progress } = get();
        if (queue.length === 0) return;
        if (progress > 4) {
          set({ progress: 0 });
          return;
        }
        set({ index: Math.max(0, index - 1), progress: 0, seekToken: get().seekToken + 1, isPlaying: true });
      },

      setProgress: (value) => set({ progress: value }),
      seek: (value) => set({ progress: Math.max(0, value), seekToken: get().seekToken + 1 }),
      seekBy: (delta) => set({ progress: Math.max(0, get().progress + delta), seekToken: get().seekToken + 1 }),

      setVolume: (value) => {
        const volume = Math.min(1, Math.max(0, value));
        set({ volume, muted: volume === 0 ? get().muted : false });
      },
      toggleMute: () => set({ muted: !get().muted }),
      toggleShuffle: () => set({ shuffle: !get().shuffle }),
      cycleRepeat: () => {
        const order: RepeatMode[] = ["off", "all", "one"];
        const current = get().repeat;
        set({ repeat: order[(order.indexOf(current) + 1) % order.length] });
      },

      addToQueue: (track) => {
        const { queue, index, isPlaying } = get();
        if (queue.length === 0) {
          set({ queue: [track], index: 0, isPlaying: true, progress: 0 });
          return;
        }
        set({ queue: [...queue, track], isPlaying });
        if (!isPlaying) set({ isPlaying: true });
        void index;
      },

      playNext: (track) => {
        const { queue, index } = get();
        const nextQueue = queue.filter((t) => t.id !== track.id);
        const insertAt = Math.min(index + 1, nextQueue.length);
        nextQueue.splice(insertAt, 0, track);
        set({ queue: nextQueue });
      },

      removeFromQueue: (index) => {
        const { queue, index: current } = get();
        if (index === current) return;
        const nextQueue = queue.filter((_, i) => i !== index);
        set({ queue: nextQueue, index: index < current ? current - 1 : current });
      },

      jumpTo: (index) => {
        const { queue } = get();
        if (index < 0 || index >= queue.length) return;
        set({ index, progress: 0, isPlaying: true });
      },

      setQueueOpen: (value) => set({ queueOpen: value }),
      setNowPlayingOpen: (value) => set({ nowPlayingOpen: value }),
      clear: () => set({ queue: [], index: 0, isPlaying: false, progress: 0, contextLabel: "", contextId: null }),
    }),
    {
      name: "vibe-music.player",
      partialize: (state) => ({
        volume: state.volume,
        muted: state.muted,
        shuffle: state.shuffle,
        repeat: state.repeat,
      }),
    },
  ),
);
