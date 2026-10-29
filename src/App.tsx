import { Navigate, Route, Routes, useParams } from "react-router-dom";
import Shell from "@/app/Shell";
import PlayerProvider from "@/app/PlayerProvider";
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

const App = () => (
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
);

export default App;
