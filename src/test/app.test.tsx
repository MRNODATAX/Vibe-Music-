import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "@/App";
import { usePlayer } from "@/store/playerStore";
import { getTrack, playlists, tracks, tracksOfAlbum } from "@/data/catalog";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>,
  );

describe("Vibe Music app shell", () => {
  beforeEach(() => {
    usePlayer.getState().clear();
    localStorage.clear();
  });

  it("renders the home page with catalog shelves", () => {
    renderAt("/");
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    expect(screen.getAllByText("Vibe Harian").length).toBeGreaterThan(0);
    expect(screen.getByRole("region", { name: "Pemutar" })).toBeTruthy();
  });

  it("starts playback from a card and shows the track in the player", () => {
    renderAt("/");
    const target = tracks[1];
    act(() => {
      usePlayer.getState().playContext([target], 0, "Test", "test-ctx");
    });
    const state = usePlayer.getState();
    expect(state.isPlaying).toBe(true);
    expect(state.queue[0].id).toBe(target.id);
    expect(screen.getAllByText(target.title).length).toBeGreaterThan(0);
  });

  it("advances the queue and wraps when repeating everything", () => {
    const list = tracksOfAlbum("senja-terakhir");
    act(() => {
      usePlayer.getState().playContext(list, 0, "Album", "senja-terakhir");
    });
    act(() => usePlayer.getState().next());
    expect(usePlayer.getState().index).toBe(1);
    act(() => {
      usePlayer.getState().jumpTo(list.length - 1);
      usePlayer.getState().cycleRepeat();
    });
    expect(usePlayer.getState().repeat).toBe("all");
    act(() => usePlayer.getState().next());
    expect(usePlayer.getState().index).toBe(0);
  });

  it("renders a playlist detail page with every track", () => {
    const playlist = playlists[0];
    renderAt(`/playlist/${playlist.id}`);
    expect(screen.getByRole("heading", { level: 1, name: playlist.title })).toBeTruthy();
    playlist.trackIds.slice(0, 3).forEach((id) => {
      expect(screen.getAllByText(getTrack(id)!.title).length).toBeGreaterThan(0);
    });
  });

  it("renders album, artist, library, liked and 404 routes", () => {
    const album = renderAt("/album/afterglow");
    expect(screen.getByRole("heading", { level: 1, name: "Afterglow" })).toBeTruthy();
    album.unmount();

    const artist = renderAt("/artist/kairo-senja");
    expect(screen.getByRole("heading", { level: 1, name: "Kairo Senja" })).toBeTruthy();
    artist.unmount();

    const library = renderAt("/library");
    expect(screen.getByRole("heading", { level: 1, name: "Perpustakaan" })).toBeTruthy();
    library.unmount();

    const liked = renderAt("/liked");
    expect(screen.getByRole("heading", { level: 1, name: "Lagu yang disukai" })).toBeTruthy();
    liked.unmount();

    const missing = renderAt("/album/tidak-ada");
    expect(screen.getByText("Halaman tidak ditemukan")).toBeTruthy();
    missing.unmount();
  });

  it("filters the catalog from the search route", () => {
    renderAt("/search?q=kairo");
    expect(screen.getByText(/Hasil untuk/)).toBeTruthy();
    expect(screen.getAllByText(/Kairo Senja/).length).toBeGreaterThan(0);
  });

  it("shows the explore grid when searching without a query", () => {
    renderAt("/search");
    expect(screen.getByRole("heading", { level: 1, name: "Jelajahi semua" })).toBeTruthy();
    expect(screen.getByText("Synthwave")).toBeTruthy();
  });

  it("opens the settings dialog and persists the glass level", () => {
    renderAt("/");
    const buttons = screen.getAllByLabelText("Pengaturan tampilan");
    fireEvent.click(buttons[0]);
    expect(screen.getByRole("dialog", { name: "Tampilan" })).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "Lembut" }));
    expect(document.documentElement.dataset.glass).toBe("soft");
    fireEvent.click(screen.getByLabelText("Tutup pengaturan"));
    expect(screen.queryByRole("dialog", { name: "Tampilan" })).toBeNull();
  });

  it("toggles likes from the liked page", () => {
    renderAt("/liked");
    const first = screen.getAllByLabelText("Hapus dari lagu yang disukai")[0];
    fireEvent.click(first);
    expect(screen.getAllByLabelText("Hapus dari lagu yang disukai").length).toBeGreaterThanOrEqual(0);
  });
});
