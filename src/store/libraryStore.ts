import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserPlaylist {
  id: string;
  title: string;
  description: string;
  trackIds: string[];
  createdAt: number;
  paletteIndex: number;
}

interface LibraryState {
  likedTracks: string[];
  savedAlbums: string[];
  followedArtists: string[];
  playlists: UserPlaylist[];
  recentTracks: string[];
  recentSearches: string[];

  toggleLike: (trackId: string) => void;
  isLiked: (trackId: string) => boolean;
  toggleSavedAlbum: (albumId: string) => void;
  toggleFollow: (artistId: string) => void;
  isFollowing: (artistId: string) => boolean;
  createPlaylist: (title?: string, trackIds?: string[]) => string;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  renamePlaylist: (playlistId: string, title: string) => void;
  deletePlaylist: (playlistId: string) => void;
  pushRecent: (trackId: string) => void;
  pushSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      likedTracks: ["t02", "t28", "t19", "t14"],
      savedAlbums: ["sleepwalking"],
      followedArtists: ["kairo-senja", "lunaire"],
      playlists: [
        {
          id: "user-favorit",
          title: "Favorit Saya",
          description: "Playlist pribadi pertama kamu.",
          trackIds: ["t08", "t31", "t39", "t25", "t46"],
          createdAt: Date.now(),
          paletteIndex: 2,
        },
      ],
      recentTracks: ["t28", "t19", "t08", "t14", "t39"],
      recentSearches: [],

      toggleLike: (trackId) =>
        set((state) => ({
          likedTracks: state.likedTracks.includes(trackId)
            ? state.likedTracks.filter((id) => id !== trackId)
            : [trackId, ...state.likedTracks],
        })),
      isLiked: (trackId) => get().likedTracks.includes(trackId),

      toggleSavedAlbum: (albumId) =>
        set((state) => ({
          savedAlbums: state.savedAlbums.includes(albumId)
            ? state.savedAlbums.filter((id) => id !== albumId)
            : [albumId, ...state.savedAlbums],
        })),

      toggleFollow: (artistId) =>
        set((state) => ({
          followedArtists: state.followedArtists.includes(artistId)
            ? state.followedArtists.filter((id) => id !== artistId)
            : [artistId, ...state.followedArtists],
        })),
      isFollowing: (artistId) => get().followedArtists.includes(artistId),

      createPlaylist: (title = "Playlist Baru", trackIds = []) => {
        const id = `pl-${Date.now().toString(36)}`;
        set((state) => ({
          playlists: [
            {
              id,
              title,
              description: "",
              trackIds,
              createdAt: Date.now(),
              paletteIndex: Math.floor(Math.random() * 6),
            },
            ...state.playlists,
          ],
        }));
        return id;
      },

      addTrackToPlaylist: (playlistId, trackId) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId && !p.trackIds.includes(trackId) ? { ...p, trackIds: [...p.trackIds, trackId] } : p,
          ),
        })),

      removeTrackFromPlaylist: (playlistId, trackId) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId ? { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) } : p,
          ),
        })),

      renamePlaylist: (playlistId, title) =>
        set((state) => ({
          playlists: state.playlists.map((p) => (p.id === playlistId ? { ...p, title, description: p.description } : p)),
        })),

      deletePlaylist: (playlistId) =>
        set((state) => ({ playlists: state.playlists.filter((p) => p.id !== playlistId) })),

      pushRecent: (trackId) =>
        set((state) => ({ recentTracks: [trackId, ...state.recentTracks.filter((id) => id !== trackId)].slice(0, 20) })),

      pushSearch: (query) =>
        set((state) => ({
          recentSearches: [query, ...state.recentSearches.filter((q) => q !== query)].slice(0, 8),
        })),

      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    { name: "vibe-music.library", version: 1 },
  ),
);
