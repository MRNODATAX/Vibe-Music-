import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, LibraryBig, Radio, Search } from "lucide-react";
import { artGradient } from "@/lib/art";
import { usePlayer } from "@/store/playerStore";
import { useUi } from "@/store/uiStore";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import PlayerBar from "@/components/PlayerBar";
import QueuePanel from "@/components/QueuePanel";
import NowPlaying from "@/components/NowPlaying";
import SettingsDialog from "@/components/SettingsDialog";
import ToastHost from "@/components/Toast";

const MobileTabs = () => (
  <nav className="mobile-tabs glass" aria-label="Navigasi bawah">
    <NavLink to="/" end className={({ isActive }) => `tab-link ${isActive ? "is-active" : ""}`}>
      <Home size={20} />
      <span>Beranda</span>
    </NavLink>
    <NavLink to="/search" className={({ isActive }) => `tab-link ${isActive ? "is-active" : ""}`}>
      <Search size={20} />
      <span>Cari</span>
    </NavLink>
    <NavLink to="/library" className={({ isActive }) => `tab-link ${isActive ? "is-active" : ""}`}>
      <LibraryBig size={20} />
      <span>Koleksi</span>
    </NavLink>
    <button
      type="button"
      className={`tab-link ${usePlayer.getState().queue.length ? "" : "is-muted"}`}
      onClick={() => {
        if (usePlayer.getState().queue.length) usePlayer.getState().setNowPlayingOpen(true);
      }}
    >
      <Radio size={20} />
      <span>Pemutar</span>
    </button>
  </nav>
);

const useShortcuts = () => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (typing) return;
      const state = usePlayer.getState();
      if (state.nowPlayingOpen || useUi.getState().settingsOpen) {
        if (event.key === "Escape") {
          state.setNowPlayingOpen(false);
          useUi.getState().setSettingsOpen(false);
        }
        return;
      }
      switch (event.key) {
        case " ":
          event.preventDefault();
          state.toggle();
          break;
        case "ArrowRight":
          if (event.shiftKey) state.next();
          else {
            event.preventDefault();
            state.seekBy(5);
          }
          break;
        case "ArrowLeft":
          if (event.shiftKey) state.prev();
          else {
            event.preventDefault();
            state.seekBy(-5);
          }
          break;
        case "m":
          state.toggleMute();
          break;
        case "s":
          state.toggleShuffle();
          break;
        case "r":
          state.cycleRepeat();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
};

const Shell = () => {
  const location = useLocation();
  const scrollRef = useRef<HTMLElement | null>(null);
  const track = usePlayer((s) => s.queue[s.index]);
  const queueOpen = usePlayer((s) => s.queueOpen);
  const collapsed = useUi((s) => s.sidebarCollapsed);

  useShortcuts();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  return (
    <div className="app">
      <div className="bg-layer" aria-hidden="true">
        <div
          className="bg-image"
          style={{ background: track ? artGradient(track.palette, track.art) : undefined }}
        />
        <div className="bg-orb bg-orb--1" />
        <div className="bg-orb bg-orb--2" />
        <div className="bg-orb bg-orb--3" />
        <div className="bg-grain" />
      </div>

      <div className={`shell ${queueOpen ? "has-queue" : ""} ${collapsed ? "is-collapsed" : ""}`}>
        <Sidebar />
        <section className="main-panel glass">
          <TopBar />
          <main className="main-scroll" ref={scrollRef} id="main">
            <Outlet />
          </main>
        </section>
        <QueuePanel />
      </div>

      <PlayerBar />
      <MobileTabs />
      <NowPlaying />
      <SettingsDialog />
      <ToastHost />
    </div>
  );
};

export default Shell;
