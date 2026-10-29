import { Link } from "react-router-dom";
import { Disc3 } from "lucide-react";

const NotFound = () => (
  <div className="page">
    <div className="empty-state">
      <Disc3 size={44} />
      <h1>Halaman tidak ditemukan</h1>
      <p>Sepertinya tautan ini sudah tidak tersedia di Vibe Music.</p>
      <Link to="/" className="primary-btn">
        Kembali ke Beranda
      </Link>
    </div>
  </div>
);

export default NotFound;
