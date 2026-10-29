import { useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import Shell from "@/app/Shell";
import PlayerProvider from "@/app/PlayerProvider";
import BootSplash from "@/components/BootSplash";
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import LibraryPage from "@/pages/LibraryPage";
import LikedPage from "@/pages/LikedPage";
import PlaylistPage from "@/pages/PlaylistPage";
import AlbumPage from "@/pages/AlbumPage";
import ArtistPage from "@/pages/ArtistPage";
import NotFound from "@/pages/NotFound";
import { getTrack } from "@/data/catalog";

/** Deep links to a single track land on its album page, where it can be played. */
const TrackRedirect = () => {
  const { id = "" } = useParams();
  const track = getTrack(id);
  if (!track) return <NotFound />;
  return <Navigate to={`/album/${track.albumId}`} replace />;
};

const SESSION_KEY = "vibe-music.booted";

/** Repeat visits in the same session get a shorter splash. */
const firstVisitInSession = () => {
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return false;
    sessionStorage.setItem(SESSION_KEY, "1");
    return true;
  } catch {
    return true;
  }
};

const App = () => {
  const [booted, setBooted] = useState(false);
  const [fullBoot] = useState(firstVisitInSession);

  return (
    <>
      {!booted && <BootSplash quick={!fullBoot} onDone={() => setBooted(true)} />}
      <PlayerProvider>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/liked" element={<LikedPage />} />
            <Route path="/playlist/:id" element={<PlaylistPage />} />
            <Route path="/album/:id" element={<AlbumPage />} />
            <Route path="/artist/:id" element={<ArtistPage />} />
            <Route path="/track/:id" element={<TrackRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </PlayerProvider>
    </>
  );
};

export default App;
