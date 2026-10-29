import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AccentMode = "dynamic" | "custom";
export type GlassLevel = "off" | "soft" | "strong";

interface UiState {
  accentMode: AccentMode;
  accent: string;
  glass: GlassLevel;
  animateBackground: boolean;
  reduceMotion: boolean;
  sidebarCollapsed: boolean;
  settingsOpen: boolean;

  setAccentMode: (mode: AccentMode) => void;
  setAccent: (value: string) => void;
  setGlass: (level: GlassLevel) => void;
  setAnimateBackground: (value: boolean) => void;
  setReduceMotion: (value: boolean) => void;
  toggleSidebar: () => void;
  setSettingsOpen: (value: boolean) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      accentMode: "dynamic",
      accent: "#ff5c7a",
      glass: "strong",
      animateBackground: true,
      reduceMotion: false,
      sidebarCollapsed: false,
      settingsOpen: false,

      setAccentMode: (accentMode) => set({ accentMode }),
      setAccent: (accent) => set({ accent }),
      setGlass: (glass) => set({ glass }),
      setAnimateBackground: (animateBackground) => set({ animateBackground }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
    }),
    {
      name: "vibe-music.ui",
      partialize: (state) => ({
        accentMode: state.accentMode,
        accent: state.accent,
        glass: state.glass,
        animateBackground: state.animateBackground,
        reduceMotion: state.reduceMotion,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
);
