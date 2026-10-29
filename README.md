# Vibe Music

**Pemutar musik glassmorphic untuk web + PWA.** Satu basis kode, dioptimalkan untuk desktop
dan mobile, bisa dipasang ke layar utama dan tetap jalan saat offline.

> **Catatan penting:** Vibe Music adalah **implementasi orisinal**, bukan salinan, klon biner,
> atau redistribusi aset Spotify. Tidak ada kode, logo, merek, katalog, atau audio milik Spotify
> yang dipakai di sini. Aplikasi ini terinspirasi dari pola antarmuka pemutar musik modern
> (panel kaca, shelf horizontal, player bar, queue, now-playing penuh) dan diramaikan dengan
> referensi desain **[spicetify-glassify](https://github.com/sanoojes/spicetify-glassify)**.
> Katalog lagu bersifat fiktif dan audionya disintesis di perangkat.

---

## Daftar isi

0. [Splash & branding nodata.dev](#splash--branding-nodatadev)
1. [Apa yang dibangun](#apa-yang-dibangun)
2. [Referensi & cara kerja](#referensi--cara-kerja)
3. [Menjalankan proyek](#menjalankan-proyek)
4. [Fitur](#fitur)
5. [Desain: sistem kaca](#desain-sistem-kaca)
6. [PWA & instalasi](#pwa--instalasi)
7. [Struktur proyek](#struktur-proyek)
8. [Kustomisasi](#kustomisasi)
9. [Audio: mesin generatif](#audio-mesin-generatif)
10. [Batasan](#batasan)
11. [Lisensi & kredit](#lisensi--kredit)

---

## Splash & branding nodata.dev

Saat aplikasi dibuka, muncul **layar boot** (`src/components/BootSplash.tsx`) dengan:

- logo Vibe Music + wordmark, dan **tulisan kecil `nodata.dev`** tepat di bawahnya
  (juga tampil di sidebar, di kaki halaman Beranda, dan di footer dialog Pengaturan);
- **progress bar animasi** dengan persentase besar, kilau bergerak, dan garis status
  bertahap ("Menyalakan mesin audio" → "Memuat katalog lagu" → … → "Hampir siap");
- progress-nya **nyata**: menunggu font siap + event `load`, ditambah durasi minimum
  agar tidak berkedip (≈1,25 s kunjungan pertama, ≈0,5 s kunjungan berikutnya dalam
  sesi yang sama);
- **interaktif / bisa dilewati**: klik di mana saja, ketuk, tekan tombol apa pun, atau
  pakai tombol **Lewati** — semuanya melompat ke 100% dengan transisi memudar;
- menghormati `prefers-reduced-motion`, punya `role="progressbar"` + `aria-valuenow`,
  dan tautan `nodata.dev` bisa diklik (membuka tab baru).

---

## Apa yang dibangun

- **Aplikasi web penuh** dengan alur layaknya layanan streaming: Beranda, Pencarian,
  Perpustakaan, Playlist, Album, Artis, Lagu yang disukai.
- **PWA** dengan manifest, ikon (regular + maskable + Apple touch), service worker
  (app shell offline + cache aset), shortcut aplikasi, dan tema warna dinamis.
- **Splash screen** dengan progress loading animasi + skip interaktif, dan branding
  `nodata.dev` di bawah wordmark.
- **Player** lengkap: play/pause, next/prev, shuffle, repeat (off/all/one), seek, volume,
  mute, antrean, now-playing layar penuh, Media Session (kontrol di lock screen/OS).
- **Desain kaca (glassmorphism)** dengan tiga tingkat intensitas, warna aksen dinamis mengikuti
  sampul lagu, latar blur yang ikut berubah, dan animasi cahaya yang bisa dimatikan.
- **Responsif**: layout tiga kolom di desktop, dan pengalaman mobile dengan mini-player,
  tab bawah, serta now-playing sheet.
- **Tanpa backend & tanpa aset pihak ketiga**: seluruh sampul adalah vektor yang dihasilkan
  dari palet tiap rilisan, dan audio disintesis lewat Web Audio API. Bisa diputar offline
  setelah kunjungan pertama.

## Referensi & cara kerja

Proyek ini dikerjakan dengan pendekatan **reverse-engineering perilaku/desain**:

1. **[morluto/rea](https://github.com/morluto/rea)** — skill `reverse-engineer-anything`
   dipakai sebagai kerangka kerja untuk mengurai *apa* yang perlu direkonstruksi: struktur
   halaman, hierarki navigasi, perilaku player, state yang perlu dipertahankan, dan bukti
   observasi. Hasilnya diterjemahkan menjadi kontrak data (`src/data/catalog.ts`),
   store (`src/store/*`), dan mesin audio (`src/audio/engine.ts`).
2. **[sanoojes/spicetify-glassify](https://github.com/sanoojes/spicetify-glassify)** —
   referensi bahasa visual: panel kaca dengan highlight halus, latar yang berasal dari artwork
   aktif (di Glassify: *UnderMainView*), player melayang dengan blur, dan opsi kustomisasi
   (blur/brightness/opacity, accent color, background otomatis). Semua implementasi di repo ini
   ditulis ulang dari nol untuk web, bukan salinan kode tema tersebut.

Prinsip yang dipegang: **tidak mengkloning aplikasi atau aset berhak cipta**. Yang direkonstruksi
adalah pola interaksi dan sistem visualnya, dengan konten orisinal.

## Menjalankan proyek

Butuh Node.js 18+.

```bash
npm install
npm run dev        # http://localhost:5173
```

Build produksi + pratinjau (service worker aktif di mode ini):

```bash
npm run build
npm run preview    # http://localhost:4173
```

Pemeriksaan tipe:

```bash
npx tsc -b
```

Stack: **React 18 + TypeScript + Vite 6 + Zustand** (state + persist) + **React Router**,
ikon `lucide-react`, font variabel Inter (self-hosted lewat `@fontsource-variable/inter`).

## Fitur

### Navigasi & konten
- **Beranda**: sapaan sesuai waktu, 8 pintasan cepat (rilisan terakhir + playlist pilihan),
  banner pilihan editor, shelf horizontal (top chart, rilisan baru, artis, suasana hati).
- **Cari**: pencarian real-time dengan saran (lagu/artis/playlist), halaman hasil dengan
  kartu hasil teratas, daftar lagu, artis, album, playlist, grid genre, dan riwayat pencarian.
- **Perpustakaan**: tab Playlist/Artis/Album, playlist buatan pengguna, simpan album, ikuti artis.
- **Detail**: header hero berwarna sesuai palet rilisan, tombol putar besar, menu ⋯,
  daftar lagu dengan kolom album/plays/durasi.

### Player
- Antrean dengan panel samping (desktop) atau tab di now-playing (mobile).
- Shuffle, repeat `off → all → one`, seek (drag/keyboard), volume, mute.
- **Now Playing** layar penuh: sampul besar, progres besar, kontrol besar, tab antrean & info
  lagu (tempo, nuansa, jumlah diputar).
- **Media Session API**: metadata + kontrol di OS, plus posisi playback.
- Like/unlike, tambah ke antrean, putar berikutnya, salin tautan, buka album/artis dari menu lagu.

### Personalisasi
- Aksen **dinamis** (mengikuti palet sampul aktif) atau **kustom** (8 swatch + color picker).
- Efek kaca: **Mati / Lembut / Kuat**.
- Latar animasi on/off, kurangi gerakan (reduce motion).
- Sidebar bisa diciutkan; preferensi tersimpan di `localStorage`.

### Pintasan keyboard
| Tombol | Aksi |
| --- | --- |
| `/` atau `Ctrl/Cmd + K` | Fokus ke kolom pencarian |
| `Space` | Putar / jeda |
| `→` / `←` | Maju / mundur 5 detik |
| `Shift + →` / `Shift + ←` | Lagu berikutnya / sebelumnya |
| `M` | Bisukan |
| `S` | Acak |
| `R` | Ubah mode ulang |
| `Esc` | Tutup now-playing / dialog |

## Desain: sistem kaca

Token ada di `src/styles/base.css`, dan semuanya dikendalikan variabel CSS:

- `--accent`, `--accent-2`, `--accent-soft`, `--accent-glow` — diisi otomatis dari palet lagu aktif.
- `--panel`, `--stroke`, `--blur`, `--sat` — bahan panel kaca; `html[data-glass]` menurunkan
  atau mematikan blur.
- Lapisan latar (`.bg-layer`) = gradien artwork aktif + 3 orb bercahaya + grain halus,
  meniru gagasan *under main view* Glassify: latar bereaksi terhadap lagu, bukan statis.
- Sampul dibuat oleh `CoverArt` (`src/components/CoverArt.tsx`): enam varian grafis
  (`mesh`, `waves`, `rings`, `grid`, `orbit`, `bloom`) yang digambar dari palet + seed,
  jadi setiap item punya identitas visual tanpa file gambar.

## PWA & instalasi

Manifest: `public/manifest.webmanifest` (standalone, ikon maskable, tiga shortcut).
Service worker: `public/sw.js` — navigation *network-first* dengan fallback app shell, aset
*stale-while-revalidate*.

- **Desktop (Chrome/Edge)**: ikon pasang di address bar, atau tombol **Pasang app** di UI.
- **Android**: menu browser → *Instal aplikasi*.
- **iOS/iPadOS**: Bagikan → *Tambahkan ke Layar Utama* (Safari membatasi prompt otomatis).
- Service worker hanya didaftarkan pada build produksi (`npm run build && npm run preview`),
  agar tidak mengganggu HMR saat pengembangan.

## Struktur proyek

```
public/
  manifest.webmanifest   # metadata PWA
  sw.js                  # service worker (offline shell + asset cache)
  icons/                 # ikon SVG + PNG (192/512/maskable/apple-touch)
src/
  audio/engine.ts        # mesin audio generatif (Web Audio API)
  app/
    Shell.tsx            # kerangka: sidebar, topbar, player, queue, now-playing, toast
    PlayerProvider.tsx   # jembatan store ⇄ audio, Media Session, jam transport
  components/            # Sidebar, TopBar, PlayerBar, NowPlaying, TrackList, MediaCard, …
  data/catalog.ts        # artis, album, lagu, playlist, genre, mood audio (fiktif)
  hooks/                 # useTheme, useMediaQuery, usePwaInstall
  lib/art.ts             # utilitas warna + resep gradien sampul
  pages/                 # Home, Search, Library, Liked, Playlist, Album, Artist, 404
  store/                 # playerStore, libraryStore, uiStore (persist)
  styles/                # base, layout, components, pages
```

## Kustomisasi

- **Katalog & mood**: ubah `src/data/catalog.ts`. Setiap track punya `palette`, `art`,
  dan `mood` (`bpm`, `root`, `scale`, `density`, `warmth`, `texture`, `drums`).
- **Audio asli**: tambahkan `audioUrl` pada sebuah track. `PlayerProvider` akan memutar file
  tersebut lewat elemen `<audio>` alih-alih mesin generatif — jalur integrasi untuk API
  streaming legal/berlisensi.
- **Tema kaca**: ubah token di `src/styles/base.css` atau tambah level baru di
  `src/store/uiStore.ts` + `SettingsDialog`.
- **Branding**: `Brand` (`src/components/Brand.tsx`) dan `public/icons/icon.svg`.

## Audio: mesin generatif

`src/audio/engine.ts` adalah sintesis kecil dengan penjadwal look-ahead (~180 ms):

- Progresi 4 akor per loop dari tangga nada mood (minor/mayor/dorian/pentatonik).
- Voice: `pad` (saw/triangle + lowpass), `pluck`, `keys`, `pulse`, bass + sub, kick, snare,
  hi-hat — semuanya lewat bus dry + reverb konvolusi yang dibuat saat runtime.
- Humanisasi mikro, arpeggio berbasis probabilitas (`density`), warna filter dari `warmth`.

Tujuannya: demo yang terasa hidup, deterministik per lagu, ringan (tanpa file audio),
dan tidak melanggar hak cipta.

## Batasan, API musik & iklan

Pertanyaan seperti **"ada API musiknya?", "ada iklan saat memutar?", "apakah saya
harus menambahkan API musik sendiri?"** dijawab lengkap di
**[docs/music-api.md](docs/music-api.md)**, termasuk: kenapa API Spotify tidak bisa
dipakai untuk kloning, daftar sumber musik legal (Jamendo, Audius, FMA, katalog
sendiri, self-host Navidrome), contoh endpoint proxy, checklist CORS/Range/HLS,
serta urutan opsi monetisasi (sponsor kartu → membership → iklan audio).

Ringkasnya:

- **Tidak ada API musik.** Katalog lokal fiktif + audio disintesis di perangkat
  (Web Audio). Tidak ada backend.
- **Tidak ada iklan**, juga tidak ada tracker/analytics pihak ketiga.
- **Untuk musik nyata, ya, kamu perlu menambahkan sumber API sendiri** — sambungkan
  lewat field `audioUrl` per track (jalur cepat) atau adapter + endpoint proxy
  server-side (jalur produksi). Store player tidak perlu diubah.
- Batasan demo: tanpa login, data tersimpan lokal (localStorage), pencarian di memori,
  dan audio bukan rekaman sungguhan.

## Lisensi & kredit

- Kode Vibe Music: MIT.
- Referensi metode: [morluto/rea](https://github.com/morluto/rea) (MIT) — skill
  `reverse-engineer-anything`.
- Referensi desain: [sanoojes/spicetify-glassify](https://github.com/sanoojes/spicetify-glassify)
  (**AGPLv3**) — hanya inspirasi visual/konsep; tidak ada kode atau aset yang disalin.
  Jika kamu ingin mendistribusikan turunan yang memakai kode Glassify, patuhi AGPLv3.
- Ikon: [Lucide](https://lucide.dev) (ISC). Font: [Inter](https://rsms.me/inter) (OFL).

Tidak berafiliasi dengan Spotify AB.
