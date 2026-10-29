/**
 * Vibe Music — catalog
 * ---------------------------------------------------------------------------
 * Fictional, self-contained demo catalog. Everything (covers, audio) is
 * generated locally so the app works fully offline, has no third-party asset
 * dependencies and ships no copyrighted material.
 */

export type ArtVariant = "mesh" | "waves" | "rings" | "grid" | "orbit" | "bloom";

export interface Palette {
  /** Base "vinyl" colour, used for backgrounds */
  base: string;
  /** Primary accent, drives the glass tint and controls */
  accent: string;
  /** Secondary accent used in gradients */
  accent2: string;
}

export interface Mood {
  bpm: number;
  /** MIDI note of the root (48 = C3) */
  root: number;
  scale: "minor" | "major" | "dorian" | "pentatonic";
  /** 0.15 (sparse) - 1 (busy) */
  density: number;
  /** 0 (dry) - 1 (lush) */
  warmth: number;
  drums: boolean;
  texture: "pad" | "pluck" | "pulse" | "keys";
}

export interface Artist {
  id: string;
  name: string;
  followers: number;
  monthlyListeners: number;
  bio: string;
  palette: Palette;
  art: ArtVariant;
  verified: boolean;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  year: number;
  type: "album" | "ep" | "single";
  palette: Palette;
  art: ArtVariant;
  description?: string;
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  albumId: string;
  duration: number;
  plays: number;
  explicit?: boolean;
  palette: Palette;
  art: ArtVariant;
  mood: Mood;
  /** Optional real audio URL — when present the player streams it instead of
   *  using the built-in generative engine. */
  audioUrl?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  trackIds: string[];
  palette: Palette;
  art: ArtVariant;
  author: string;
}

/* -------------------------------------------------------------------------- */
/*  Palettes                                                                   */
/* -------------------------------------------------------------------------- */

const P = (base: string, accent: string, accent2: string): Palette => ({ base, accent, accent2 });

export const PALETTES = {
  coral: P("#1b1014", "#ff7a5c", "#ffb199"),
  violet: P("#120e20", "#8b7bff", "#d2c4ff"),
  cyan: P("#07161a", "#3ee0c8", "#9ef7e9"),
  lime: P("#10160a", "#b8e05c", "#e6ff9e"),
  rose: P("#1a0d16", "#ff5c93", "#ffb3c9"),
  amber: P("#1a130a", "#ffb547", "#ffe0a3"),
  indigo: P("#0b1024", "#5b8cff", "#b9ccff"),
  ember: P("#190c0c", "#ff5c5c", "#ffb0a3"),
  mint: P("#08160f", "#4ade80", "#b7f7c8"),
  orchid: P("#160b1a", "#c05cff", "#eab8ff"),
  steel: P("#0c1013", "#7ad7f0", "#c2e9f5"),
  sand: P("#161208", "#e8c37a", "#f7e5bd"),
} satisfies Record<string, Palette>;

/* -------------------------------------------------------------------------- */
/*  Artists                                                                    */
/* -------------------------------------------------------------------------- */

export const artists: Artist[] = [
  {
    id: "kairo-senja",
    name: "Kairo Senja",
    followers: 1284302,
    monthlyListeners: 3412580,
    bio: "Indie-pop dari Bandung yang merangkai senja jadi melodi. Vokal hangat, gitar berlapis, dan lorong synthesizer yang lembut.",
    palette: PALETTES.coral,
    art: "bloom",
    verified: true,
  },
  {
    id: "neon-tide",
    name: "Neon Tide",
    followers: 842190,
    monthlyListeners: 2104770,
    bio: "Duo synthwave yang merekam albumnya di garasi tepi pantai. Analog, berdebu, dan selalu menyala.",
    palette: PALETTES.cyan,
    art: "grid",
    verified: true,
  },
  {
    id: "lunaire",
    name: "Lunaire",
    followers: 611200,
    monthlyListeners: 1870230,
    bio: "Dream-pop kabut: reverb panjang, pad tebal, dan bisikan yang terdengar seperti mimpi yang belum selesai.",
    palette: PALETTES.violet,
    art: "orbit",
    verified: true,
  },
  {
    id: "raka-bumi",
    name: "Raka Bumi",
    followers: 402880,
    monthlyListeners: 1520930,
    bio: "Produser lo-fi Jakarta. Membuat beat dari suara hujan, ketukan jendela, dan sampel kaset rusak.",
    palette: PALETTES.amber,
    art: "waves",
    verified: false,
  },
  {
    id: "sora-hollow",
    name: "Sora & The Hollow",
    followers: 733410,
    monthlyListeners: 1188340,
    bio: "Alt-rock empat orang dengan gitar yang jujur dan lirik yang lebih jujur lagi.",
    palette: PALETTES.ember,
    art: "mesh",
    verified: true,
  },
  {
    id: "mira-vale",
    name: "Mira Vale",
    followers: 1920340,
    monthlyListeners: 4902170,
    bio: "R&B/soul dengan produksi berkilau. Suara Mira Vale adalah bagian paling terang dari malam.",
    palette: PALETTES.rose,
    art: "bloom",
    verified: true,
  },
  {
    id: "aurora-lanes",
    name: "Aurora Lanes",
    followers: 528700,
    monthlyListeners: 1366210,
    bio: "Electronica sinematik untuk perjalanan malam. Dibuat di antara dua kota dan tiga zona waktu.",
    palette: PALETTES.indigo,
    art: "orbit",
    verified: true,
  },
  {
    id: "delhi-drift",
    name: "Delhi Drift",
    followers: 289430,
    monthlyListeners: 902140,
    bio: "Tabla digital, bass dalam, dan tekstur klub yang selalu bergerak.",
    palette: PALETTES.orchid,
    art: "rings",
    verified: false,
  },
  {
    id: "bunga-lestari",
    name: "Bunga Lestari",
    followers: 917200,
    monthlyListeners: 2013440,
    bio: "Folk akustik dari Yogyakarta. Gitar nilon, harmonium, dan cerita tentang pulang.",
    palette: PALETTES.sand,
    art: "waves",
    verified: true,
  },
  {
    id: "static-bloom",
    name: "Static Bloom",
    followers: 354100,
    monthlyListeners: 748990,
    bio: "Shoegaze elektronik: dinding distorsi yang mekar perlahan.",
    palette: PALETTES.mint,
    art: "mesh",
    verified: false,
  },
];

/* -------------------------------------------------------------------------- */
/*  Albums                                                                     */
/* -------------------------------------------------------------------------- */

export const albums: Album[] = [
  {
    id: "senja-terakhir",
    title: "Senja Terakhir",
    artistId: "kairo-senja",
    year: 2025,
    type: "album",
    palette: PALETTES.coral,
    art: "bloom",
    description: "Album penuh tentang kota yang tidak pernah benar-benar gelap.",
  },
  {
    id: "lorong-remang",
    title: "Lorong Remang",
    artistId: "kairo-senja",
    year: 2023,
    type: "ep",
    palette: PALETTES.rose,
    art: "waves",
  },
  {
    id: "midnight-static",
    title: "Midnight Static",
    artistId: "neon-tide",
    year: 2024,
    type: "album",
    palette: PALETTES.cyan,
    art: "grid",
    description: "Sembilan trek yang direkam setelah tengah malam, satu take.",
  },
  {
    id: "saltwater-hearts",
    title: "Saltwater Hearts",
    artistId: "neon-tide",
    year: 2022,
    type: "album",
    palette: PALETTES.steel,
    art: "waves",
  },
  {
    id: "sleepwalking",
    title: "Sleepwalking",
    artistId: "lunaire",
    year: 2025,
    type: "album",
    palette: PALETTES.violet,
    art: "orbit",
    description: "Rekaman yang dibuat di antara pukul tiga dan lima pagi.",
  },
  {
    id: "paper-moons",
    title: "Paper Moons",
    artistId: "lunaire",
    year: 2021,
    type: "ep",
    palette: PALETTES.indigo,
    art: "bloom",
  },
  {
    id: "hujan-di-jendela",
    title: "Hujan di Jendela",
    artistId: "raka-bumi",
    year: 2024,
    type: "album",
    palette: PALETTES.amber,
    art: "waves",
    description: "Sepuluh beat lo-fi untuk menemani hujan yang tidak mau berhenti.",
  },
  {
    id: "kaset-rusak",
    title: "Kaset Rusak",
    artistId: "raka-bumi",
    year: 2022,
    type: "album",
    palette: PALETTES.sand,
    art: "grid",
  },
  {
    id: "hollow-rooms",
    title: "Hollow Rooms",
    artistId: "sora-hollow",
    year: 2023,
    type: "album",
    palette: PALETTES.ember,
    art: "mesh",
  },
  {
    id: "afterglow",
    title: "Afterglow",
    artistId: "mira-vale",
    year: 2025,
    type: "album",
    palette: PALETTES.rose,
    art: "bloom",
    description: "Album paling personal Mira Vale: soul, slow jam, dan sedikit disco.",
  },
  {
    id: "velvet-hours",
    title: "Velvet Hours",
    artistId: "mira-vale",
    year: 2023,
    type: "album",
    palette: PALETTES.orchid,
    art: "rings",
  },
  {
    id: "night-transit",
    title: "Night Transit",
    artistId: "aurora-lanes",
    year: 2024,
    type: "album",
    palette: PALETTES.indigo,
    art: "orbit",
    description: "Electronica sinematik untuk jendela kereta pukul sebelas malam.",
  },
  {
    id: "monsoon-club",
    title: "Monsoon Club",
    artistId: "delhi-drift",
    year: 2023,
    type: "ep",
    palette: PALETTES.orchid,
    art: "rings",
  },
  {
    id: "pulang",
    title: "Pulang",
    artistId: "bunga-lestari",
    year: 2024,
    type: "album",
    palette: PALETTES.sand,
    art: "waves",
    description: "Rekaman akustik rumah: satu mikrofon, satu ruang tamu.",
  },
  {
    id: "soft-collapse",
    title: "Soft Collapse",
    artistId: "static-bloom",
    year: 2025,
    type: "album",
    palette: PALETTES.mint,
    art: "mesh",
  },
];

/* -------------------------------------------------------------------------- */
/*  Tracks                                                                     */
/* -------------------------------------------------------------------------- */

type RawTrack = [
  id: string,
  title: string,
  albumId: string,
  duration: number,
  plays: number,
  variant?: ArtVariant,
];

const rawTracks: RawTrack[] = [
  ["t01", "Cahaya Kecil", "senja-terakhir", 218, 84_213_004],
  ["t02", "Senja Terakhir", "senja-terakhir", 243, 121_004_882],
  ["t03", "Telepon Tengah Malam", "senja-terakhir", 197, 38_772_101],
  ["t04", "Kota Tanpa Tidur", "senja-terakhir", 226, 44_120_774],
  ["t05", "Janji di Halte", "lorong-remang", 205, 27_004_119],
  ["t06", "Lorong Remang", "lorong-remang", 232, 19_882_330],
  ["t07", "Lampu Kuning", "lorong-remang", 188, 12_440_882],

  ["t08", "Neon Arcade", "midnight-static", 244, 96_120_443],
  ["t09", "Midnight Static", "midnight-static", 262, 88_004_219],
  ["t10", "Cassette Sunrise", "midnight-static", 221, 41_882_006],
  ["t11", "Chrome Coast", "midnight-static", 236, 55_920_118],
  ["t12", "Saltwater Hearts", "saltwater-hearts", 251, 63_004_552],
  ["t13", "VHS Summer", "saltwater-hearts", 214, 33_118_940],

  ["t14", "Sleepwalking", "sleepwalking", 268, 102_440_119],
  ["t15", "Glass Cathedral", "sleepwalking", 287, 71_002_338],
  ["t16", "Low Orbit", "sleepwalking", 241, 39_881_220],
  ["t17", "Soft Focus", "paper-moons", 232, 28_774_011],
  ["t18", "Paper Moons", "paper-moons", 254, 34_112_889],

  ["t19", "Hujan di Jendela", "hujan-di-jendela", 176, 112_004_556],
  ["t20", "Kopi Pahit", "hujan-di-jendela", 154, 74_220_118],
  ["t21", "Sepeda Tua", "hujan-di-jendela", 168, 42_882_330],
  ["t22", "Lampu Tidur", "hujan-di-jendela", 182, 31_004_772],
  ["t23", "Kaset Rusak", "kaset-rusak", 163, 24_118_006],
  ["t24", "Pita Coklat", "kaset-rusak", 148, 18_004_221],

  ["t25", "Hollow Rooms", "hollow-rooms", 233, 61_440_882],
  ["t26", "Brick by Brick", "hollow-rooms", 219, 44_882_001],
  ["t27", "No Signal", "hollow-rooms", 245, 27_118_440],

  ["t28", "Afterglow", "afterglow", 227, 148_880_119],
  ["t29", "Slow Burn", "afterglow", 243, 121_118_004],
  ["t30", "Silk & Static", "afterglow", 208, 88_440_771],
  ["t31", "Golden Hour", "afterglow", 231, 66_004_218],
  ["t32", "Velvet Hours", "velvet-hours", 258, 49_882_004],
  ["t33", "Midnight Caller", "velvet-hours", 236, 37_118_229],

  ["t34", "Night Transit", "night-transit", 274, 58_440_112],
  ["t35", "Terminal 3", "night-transit", 249, 41_004_882],
  ["t36", "Runway Lights", "night-transit", 231, 33_882_019],
  ["t37", "Monsoon Club", "monsoon-club", 216, 29_118_447],
  ["t38", "Tabla Machine", "monsoon-club", 204, 21_440_882],

  ["t39", "Pulang", "pulang", 243, 77_118_004],
  ["t40", "Rumah Kayu", "pulang", 221, 51_882_119],
  ["t41", "Doa Ibu", "pulang", 264, 39_004_882],
  ["t42", "Jalan Pulang", "pulang", 198, 28_440_019],

  ["t43", "Soft Collapse", "soft-collapse", 289, 46_118_220],
  ["t44", "Bloom in Reverse", "soft-collapse", 261, 33_440_118],
  ["t45", "Green Noise", "soft-collapse", 247, 24_882_006],
  ["t46", "Fade Into Mint", "soft-collapse", 273, 19_004_556],
];

const moodFor = (albumId: string, index: number, id: string): Mood => {
  const seed = [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) + index;
  const base: Record<string, Partial<Mood>> = {
    "senja-terakhir": { bpm: 104, root: 57, scale: "major", density: 0.62, warmth: 0.7, texture: "pluck", drums: true },
    "lorong-remang": { bpm: 94, root: 53, scale: "minor", density: 0.5, warmth: 0.8, texture: "pad", drums: true },
    "midnight-static": { bpm: 116, root: 45, scale: "minor", density: 0.78, warmth: 0.45, texture: "pulse", drums: true },
    "saltwater-hearts": { bpm: 108, root: 48, scale: "dorian", density: 0.7, warmth: 0.55, texture: "pulse", drums: true },
    sleepwalking: { bpm: 82, root: 50, scale: "minor", density: 0.4, warmth: 0.95, texture: "pad", drums: false },
    "paper-moons": { bpm: 86, root: 55, scale: "dorian", density: 0.42, warmth: 0.9, texture: "pad", drums: false },
    "hujan-di-jendela": { bpm: 78, root: 52, scale: "pentatonic", density: 0.38, warmth: 0.85, texture: "keys", drums: true },
    "kaset-rusak": { bpm: 74, root: 48, scale: "pentatonic", density: 0.34, warmth: 0.8, texture: "keys", drums: true },
    "hollow-rooms": { bpm: 124, root: 52, scale: "minor", density: 0.72, warmth: 0.5, texture: "pulse", drums: true },
    afterglow: { bpm: 98, root: 56, scale: "major", density: 0.6, warmth: 0.65, texture: "keys", drums: true },
    "velvet-hours": { bpm: 90, root: 51, scale: "dorian", density: 0.55, warmth: 0.75, texture: "keys", drums: true },
    "night-transit": { bpm: 112, root: 49, scale: "minor", density: 0.66, warmth: 0.7, texture: "pulse", drums: true },
    "monsoon-club": { bpm: 122, root: 46, scale: "dorian", density: 0.8, warmth: 0.5, texture: "pulse", drums: true },
    pulang: { bpm: 72, root: 53, scale: "major", density: 0.32, warmth: 0.95, texture: "pluck", drums: false },
    "soft-collapse": { bpm: 88, root: 47, scale: "minor", density: 0.45, warmth: 1, texture: "pad", drums: false },
  };
  const b = base[albumId] ?? {};
  return {
    bpm: b.bpm ?? 100,
    root: (b.root ?? 52) + (((seed % 5) - 2) | 0),
    scale: b.scale ?? "minor",
    density: Math.min(1, Math.max(0.15, (b.density ?? 0.5) + ((seed % 7) - 3) * 0.02)),
    warmth: Math.min(1, Math.max(0, (b.warmth ?? 0.7) + ((seed % 5) - 2) * 0.02)),
    drums: b.drums ?? true,
    texture: b.texture ?? "pad",
  };
};

export const tracks: Track[] = rawTracks.map(([id, title, albumId, duration, plays], index) => {
  const album = albums.find((a) => a.id === albumId)!;
  return {
    id,
    title,
    albumId,
    artistId: album.artistId,
    duration,
    plays,
    palette: album.palette,
    art: (album.art ?? "mesh") as ArtVariant,
    mood: moodFor(albumId, index, id),
  };
});

/* -------------------------------------------------------------------------- */
/*  Playlists                                                                  */
/* -------------------------------------------------------------------------- */

const idsOf = (albumIds: string[]) => tracks.filter((t) => albumIds.includes(t.albumId)).map((t) => t.id);

export const playlists: Playlist[] = [
  {
    id: "vibe-harian",
    title: "Vibe Harian",
    description: "Campuran harianmu — lagu yang kamu putar, lagu yang akan kamu suka.",
    trackIds: ["t02", "t28", "t19", "t14", "t08", "t39", "t25", "t34", "t05", "t31", "t43", "t12"],
    palette: PALETTES.violet,
    art: "bloom",
    author: "Vibe Music",
  },
  {
    id: "neon-drive",
    title: "Neon Drive",
    description: "Synth, bass, dan lampu jalan. Untuk perjalanan malam.",
    trackIds: idsOf(["midnight-static", "saltwater-hearts", "night-transit"]),
    palette: PALETTES.cyan,
    art: "grid",
    author: "Vibe Music",
  },
  {
    id: "lofi-senja",
    title: "Lo-Fi Senja",
    description: "Beat hangat dan hujan di jendela.",
    trackIds: idsOf(["hujan-di-jendela", "kaset-rusak"]),
    palette: PALETTES.amber,
    art: "waves",
    author: "Vibe Music",
  },
  {
    id: "fokus-total",
    title: "Fokus Total",
    description: "Instrumental tanpa lirik untuk kerja panjang.",
    trackIds: ["t14", "t16", "t43", "t46", "t18", "t23", "t35", "t44"],
    palette: PALETTES.mint,
    art: "mesh",
    author: "Vibe Music",
  },
  {
    id: "top-hits-vibe",
    title: "Top Hits Vibe",
    description: "40 lagu paling banyak diputar minggu ini.",
    trackIds: ["t28", "t19", "t02", "t29", "t14", "t08", "t01", "t39", "t25", "t30", "t09", "t34"],
    palette: PALETTES.rose,
    art: "bloom",
    author: "Vibe Music",
  },
  {
    id: "akustik-pagi",
    title: "Akustik Pagi",
    description: "Gitar, kopi, dan matahari yang belum tinggi.",
    trackIds: idsOf(["pulang", "paper-moons"]),
    palette: PALETTES.sand,
    art: "waves",
    author: "Vibe Music",
  },
  {
    id: "chill-malam",
    title: "Chill Malam",
    description: "Reverb panjang untuk jam-jam sunyi.",
    trackIds: ["t44", "t43", "t32", "t17", "t16", "t46", "t24", "t23"],
    palette: PALETTES.indigo,
    art: "orbit",
    author: "Vibe Music",
  },
  {
    id: "classic-rock-vibe",
    title: "Alt Rock Vibe",
    description: "Gitar kencang, ruang kosong, dan lirik jujur.",
    trackIds: idsOf(["hollow-rooms"]),
    palette: PALETTES.ember,
    art: "mesh",
    author: "Vibe Music",
  },
];

/* -------------------------------------------------------------------------- */
/*  Browse categories                                                          */
/* -------------------------------------------------------------------------- */

export interface Genre {
  id: string;
  title: string;
  palette: Palette;
  art: ArtVariant;
}

export const genres: Genre[] = [
  { id: "pop", title: "Pop", palette: PALETTES.rose, art: "bloom" },
  { id: "indie", title: "Indie", palette: PALETTES.coral, art: "mesh" },
  { id: "lofi", title: "Lo-Fi", palette: PALETTES.amber, art: "waves" },
  { id: "synthwave", title: "Synthwave", palette: PALETTES.cyan, art: "grid" },
  { id: "rnb", title: "R&B", palette: PALETTES.orchid, art: "rings" },
  { id: "electronic", title: "Electronic", palette: PALETTES.indigo, art: "orbit" },
  { id: "akustik", title: "Akustik", palette: PALETTES.sand, art: "waves" },
  { id: "rock", title: "Rock", palette: PALETTES.ember, art: "mesh" },
  { id: "ambient", title: "Ambient", palette: PALETTES.mint, art: "mesh" },
  { id: "dream-pop", title: "Dream Pop", palette: PALETTES.violet, art: "bloom" },
  { id: "chill", title: "Chill", palette: PALETTES.steel, art: "rings" },
  { id: "fokus", title: "Fokus", palette: PALETTES.lime, art: "grid" },
];

/* -------------------------------------------------------------------------- */
/*  Lookups                                                                    */
/* -------------------------------------------------------------------------- */

const trackIndex = new Map(tracks.map((t) => [t.id, t]));
const albumIndex = new Map(albums.map((a) => [a.id, a]));
const artistIndex = new Map(artists.map((a) => [a.id, a]));
const playlistIndex = new Map(playlists.map((p) => [p.id, p]));

export const getTrack = (id: string) => trackIndex.get(id);
export const getAlbum = (id: string) => albumIndex.get(id);
export const getArtist = (id: string) => artistIndex.get(id);
export const getPlaylist = (id: string) => playlistIndex.get(id);

export const tracksOfAlbum = (albumId: string) => tracks.filter((t) => t.albumId === albumId);
export const albumsOfArtist = (artistId: string) => albums.filter((a) => a.artistId === artistId);
export const tracksOfArtist = (artistId: string) =>
  tracks.filter((t) => t.artistId === artistId).sort((a, b) => b.plays - a.plays);

export const artistName = (id: string) => artistIndex.get(id)?.name ?? "Unknown artist";
export const albumTitle = (id: string) => albumIndex.get(id)?.title ?? "Single";

export const playlistTracks = (playlist: Playlist) =>
  playlist.trackIds.map((id) => trackIndex.get(id)).filter((t): t is Track => Boolean(t));

export const totalDuration = (list: Track[]) => list.reduce((sum, t) => sum + t.duration, 0);

export const formatDuration = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

export const formatLongDuration = (seconds: number) => {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.round((total % 3600) / 60);
  return h > 0 ? `${h} j ${m} mnt` : `${m} mnt`;
};

export const formatCount = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(".0", "")} B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")} jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".0", "")} rb`;
  return `${n}`;
};

/* -------------------------------------------------------------------------- */
/*  Search                                                                     */
/* -------------------------------------------------------------------------- */

export interface SearchResults {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
}

export const searchCatalog = (rawQuery: string): SearchResults => {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return { tracks: [], albums: [], artists: [], playlists: [] };
  const hit = (value: string) => value.toLowerCase().includes(q);
  return {
    tracks: tracks.filter((t) => hit(t.title) || hit(artistName(t.artistId)) || hit(albumTitle(t.albumId))),
    albums: albums.filter((a) => hit(a.title) || hit(artistName(a.artistId))),
    artists: artists.filter((a) => hit(a.name)),
    playlists: playlists.filter((p) => hit(p.title) || hit(p.description)),
  };
};

/** Hand-picked editorial rows for the home page. */
export const homeRows: { id: string; title: string; subtitle?: string; kind: "playlist" | "album" | "artist"; items: string[] }[] = [
  {
    id: "row-top",
    title: "Paling banyak diputar hari ini",
    kind: "playlist",
    items: ["top-hits-vibe", "vibe-harian", "neon-drive", "chill-malam", "lofi-senja", "fokus-total"],
  },
  {
    id: "row-new",
    title: "Rilisan baru untukmu",
    kind: "album",
    items: ["senja-terakhir", "afterglow", "sleepwalking", "soft-collapse", "night-transit", "pulang"],
  },
  {
    id: "row-artists",
    title: "Artis yang mungkin kamu suka",
    kind: "artist",
    items: ["kairo-senja", "mira-vale", "neon-tide", "lunaire", "raka-bumi", "bunga-lestari"],
  },
  {
    id: "row-mood",
    title: "Suasana hati",
    kind: "playlist",
    items: ["akustik-pagi", "chill-malam", "neon-drive", "lofi-senja", "fokus-total", "classic-rock-vibe"],
  },
];
