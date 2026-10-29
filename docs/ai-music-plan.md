# PLAN — Vibe DJ: AI music assistant + playable chat bubbles

> **Status dokumen:** rencana (belum ada kode yang ditulis untuk fitur ini).
> **Update 29 Okt 2026:** keputusan yang sudah diambil — proxy di **Vercel**,
> provider AI **rantai** (comiku → key user → parser lokal), **SoundCloud tidak dipakai**.
> Sumber audio sudah diteliti ulang dan **berubah**: lihat **`docs/free-music-api-research.md`**
> (Audius full-track + Openverse CC + Deezer/iTunes preview + demo lokal).
> **Tanggal riset:** 29 Okt 2026 · **Target:** Vibe Music (`MRNODATAX/Vibe-Music-`)
> **Referensi eksternal:** ComikuApi (`comiku.my.id`), `blognodata.vercel.app` (Relay AI),
> pola Spotify AI DJ & YouTube Music *Ask Music*, aturan SoundCloud API, praktik UX chat widget.

---

## 0. Jawaban jujur di depan (TL;DR)

| Pertanyaan | Jawaban jujur |
| --- | --- |
| Ada API musik di `comiku.my.id`? | **Ada, tapi bukan pemutar musik.** Yang tersedia: *search* Apple Music (metadata + **preview 30 detik**), *search* SoundCloud (metadata + URL HLS bertanda tangan), *search* YouTube Music (saran), *lyrics* (lrclib). **Tidak ada** endpoint "streaming lagu penuh yang legal & stabil". |
| Ada API AI-nya? | **Ada, 9 endpoint** (`/ai/deepseek`, `/ai/gemini`, `/ai/claude`, `/ai/chatgpt`, dll). Ini **wrapper tidak resmi** ke layanan pihak ketiga — bukan API resmi OpenAI/Google/Anthropic. |
| Bisa dipakai langsung dari browser (Vibe Music)? | **Tidak.** Sudah saya uji: **tidak ada header `access-control-allow-origin`** → semua `fetch()` dari domain lain diblokir. **Wajib lewat proxy server sendiri** (Vercel Function / Cloudflare Worker). |
| Bisa bikin AI chat + rekomendasi + bubble yang langsung bisa diputar? | **BISA** — dengan 3 syarat: (1) proxy sendiri, (2) desain "AI untuk bahasa, ranking deterministik untuk lagu", (3) audio memakai **preview 30 detik** / katalog demo / lagu milik sendiri. |
| Bisa streaming lagu penuh legal dari API itu? | **Tidak.** SoundCloud full-track secara teknis bisa, tapi melanggar ToS (URL internal, tanpa iklan mereka, tanpa api key resmi) dan URL-nya kedaluwarsa ±30 menit. |
| Ada iklan? | Comiku tidak menyisipkan iklan. Tapi kalau kita memutar audio SoundCloud lewat player sendiri, kita justru **melewati** iklan mereka → itu bagian dari pelanggaran ToS. |
| Perlu API musik sendiri? | **Ya**, untuk pengalaman "dengar lagu penuh". Untuk MVP AI + bubble playable, cukup preview Apple 30 detik + katalog demo generatif yang sudah ada. |

**Verdict:** rencana ini layak dan bisa dikerjakan, **tapi positioning-nya harus jujur**: Vibe Music = *AI music companion* dengan pratinjau 30 detik + tautan ke platform resmi, **bukan** Spotify bajakan. Kalau dipaksa jadi pemutar lagu penuh, proyek ini akan mati karena hukum/ToS, bukan karena teknis.

---

## 1. Hasil audit nyata `comiku.my.id` (bukti, bukan asumsi)

### 1.1 Profil layanan

- Nama: **ComikuApi** — "gratis untuk bot dan aplikasi, tanpa login".
- **44 endpoint**, 6 kategori: `ai` (9), `downloader` (7), `imagecreator` (3), `search` (11), `stalker` (2), `tools` (12).
- Semua **GET**, parameter di query string, respons JSON.
- Rate limit terbaca dari header respons: **`x-ratelimit-limit: 60`** (jendela ±1 menit per IP).
- Situs memakai Cloudflare + CSP `default-src 'self'` → mereka memang mengunci pemakaian ke browser di domain sendiri.

### 1.2 Endpoint musik yang ada

| Endpoint | Param | Isi respons | Bisa diputar? |
| --- | --- | --- | --- |
| `/search/applemusic` | `q` | `id, title, artist, album, duration, genre, release_date, url, artwork, preview_url` | **Ya, 30 detik** (`preview_url` = AAC dari `audio-ssl.itunes.apple.com`) |
| `/search/applemusicsong` | `id` | detail 1 lagu + `isrc`, `album_id`, `artist_ids`, `preview_url`, `has_synced_lyrics` | Ya, 30 detik |
| `/tools/soundcloud` | `q`, `type` (tracks/playlists/…), `limit` | `title, user, artworkUrl, durationMs, playbackCount, permalinkUrl, stream.playUrl` (**HLS .m3u8, signed**) | Teknis ya (HLS), **tapi ToS-grey + URL kedaluwarsa** |
| `/search/ytmusicsearch` | `text` | saran pencarian YouTube Music (bukan audio) | Tidak |
| `/search/lyrics` | `text` | lirik dari `lrclib.net` | n/a (teks) |

Contoh nyata (diringkas) `/search/applemusic?q=senja`:

```json
{"status":true,"result":{"result":[{
  "id":"936241610","title":"Menuju Senja","artist":"Payung Teduh",
  "album":"Dunia Batas","duration":"5:06","genre":"Pop","release_date":"2014-11-04",
  "url":"https://music.apple.com/id/album/menuju-senja/936241602?i=936241610&l=id",
  "artwork":"https://is1-ssl.mzstatic.com/.../600x600bb.jpg",
  "preview_url":"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/....m4a"
}]}}
```

Contoh nyata `/tools/soundcloud?q=lofi&type=tracks`:

```json
{"result":{"type":"tracks","count":10,"totalResults":1455137,
 "result":[{"id":2408461857,"title":"...","user":{"username":"..."},
   "durationMs":244108,"permalinkUrl":"https://soundcloud.com/...",
   "artworkUrl":"https://i1.sndcdn.com/artworks-...-large.jpg",
   "stream":{"protocol":"hls","mimeType":"audio/mp4","playUrl":"https://playback.media-streaming.soundcloud.cloud/....m3u8?expires=...&Signature=..."}}]}}
```

### 1.3 Endpoint AI yang ada

| Endpoint | Param | Hasil uji saya (29 Okt 2026) | Catatan |
| --- | --- | --- | --- |
| `/ai/deepseek` | `text` | ✅ **Berhasil**, rapi: `{reply, model:"deepseek/deepseek-v4-flash"}` | **Kandidat utama.** Cepat, patuh format, JSON bersih |
| `/ai/gemini` | `text` | ⚠️ Balas `"Halo! Ada yang bisa saya bantu…"` umum, tapi saat diminta JSON ketat malah balas `"Konfirmasi Status Berhasil"` | **Tidak bisa dipercaya untuk instruksi/format** — prompt tampaknya diringkas di tengah jalan |
| `/ai/chatgpt` | `text` | ❌ `Unauthorized (403): cookie ashna-web expired / invalid` | Bukti wrapper ini **rapuh** (sesi scraper kedaluwarsa) |
| `/ai/claude` | 3 param | belum diuji | idem: riskan |
| `/ai/overchat` | `q` (**bukan** `text`) | ✅ validasi jalan | penamaan param tidak konsisten antar endpoint |
| `/ai/notegpt`, `/ai/rewind`, `/ai/unlimitedai`, `/ai/deepai` | — | belum diuji | `rewind` butuh email/password → **jangan dipakai** |

### 1.4 Tiga temuan kritis (yang mengubah arsitektur)

**Temuan #1 — CORS tertutup.**
Uji header: *"This URL will not work correctly with CORS… It does not have the `access-control-allow-origin` header set to `*`."*
→ **Segala panggilan harus lewat backend sendiri.** Ini juga kabar baik: proxy = tempat cache, rate-limit, dan menyembunyikan prompt.

**Temuan #2 — AI wrapper tidak bisa dipercaya untuk output terstruktur.**
Saya minta `Balas HANYA JSON: {"say":…,"tracks":[…]}` → hasilnya bukan JSON. Minta `{"ok":true}` → dijawab `"Konfirmasi Status Berhasil"`.
→ **Jangan** membangun fitur di atas "AI mengembalikan JSON". Bangun dengan pola: **AI = bahasa & niat, penentu lagu = kode deterministik**.

**Temuan #3 — tidak ada streaming legal.**
Apple hanya `preview_url` (30 detik, itu pun tetap pratinjau berlisensi Apple). SoundCloud full-track ada tapi: URL internal `api-v2`, tanpa `client_id` resmi, iklan mereka terlewati, URL `expires` ±30 menit, dan banyak unggahan berisi materi berhak cipta pihak lain.
Menurut [SoundCloud API Guide](https://developers.soundcloud.com/docs/api/guide), pemutaran via player sendiri **mensyaratkan** API key resmi, atribusi kreator, logo SoundCloud, dan tautan balik — plus batas historis **15.000 play/24 jam** per track di luar SoundCloud ([TNW](https://thenextweb.com/news/soundcloud-now-limits-embedded-tracks-to-15000-plays-per-day), [RA](https://ra.co/news/30110)).

---

## 2. Referensi industri & UX (dasar keputusan desain)

| Referensi | Yang diambil |
| --- | --- |
| **Spotify AI DJ** — request lewat tahan tombol DJ, prompt mood+aktivitas, DJ "berbicara" di antara lagu ([Fast Company](https://www.fastcompany.com/91332823/spotify-ai-dj-voice-request), [9to5Mac](https://9to5mac.com/2025/05/14/dj-spotify-ai-now-takes-requests/)) | Pola **"DJ berbicara → langsung memutar"**, bukan menghasilkan daftar panjang. Kita tiru: balasan = 1–2 kalimat + 3–6 kartu lagu siap putar. |
| **Spotify Prompted Playlists** — prompt panjang, ada *Ideas*/preset, **penjelasan "kenapa lagu ini"** per track ([windowsforum](https://windowsforum.com/news/spotify-prompted-playlists-ai-driven-discovery-beta-in-new-zealand.393498/)) | Wajib ada **reason chip** di setiap kartu ("kenapa cocok") + preset prompt. |
| **YouTube Music *Ask Music*** — ikon ✨ di kanan atas, antarmuka percakapan penuh, **carousel 10 contoh prompt**, bisa ubah queue, jawab pertanyaan tentang artis ([RouteNote](https://routenote.com/radar/youtube-music-adds-gemini-powered-ask-music-for-ai-music-discovery/), [gadgethacks](https://android.gadgethacks.com/news/youtube-musics-ai-playlist-feature-ask-music-explained/)) | Navigasi: **entry point ✨ yang jelas** (bubble + halaman), contoh prompt menggantikan kotak kosong. |
| **Relay AI di `blognodata.vercel.app`** — persona bernama, avatar/logo, intro 2 baris, chip pertanyaan, `0/1200` counter, Enter kirim, disclaimer "AI bisa keliru · riwayat hanya tersimpan selama halaman terbuka" | **Referensi langsung** untuk persona "**Vibe DJ**", bubble melayang, dan disclaimer + status riwayat. |
| **UX chat widget 2026** ([designpixil](https://designpixil.com/blog/chatbot-window-ui-design), [setproduct](https://www.setproduct.com/blog/ai-chat-interface-ui-design)) | Composer **docked, bukan mengapung**; di mobile **full-screen** (bukan jendela kecil); FAB tidak menutupi tombol utama; auto-scroll hanya bila user di dasar; **jangan** progress bar palsu — pakai indikator mengetik. |
| **Apple Music preview** | `preview_url` = AAC ~30 s. Untuk penggunaan pihak ketiga: tampilkan atribusi + tombol "Buka di Apple Music". |

---

## 3. Arsitektur usulan

```
┌──────────────────────────── Browser (Vibe Music PWA) ────────────────────────────┐
│  /ai  (Vibe DJ page)          Floating <DjBubble/>  (semua halaman)              │
│        │                              │                                          │
│        └──────────► src/ai/client.ts ─┴─► POST /api/dj/chat   (proxy kita)        │
│                                             │                                     │
│  PlayerBar / TrackCard  ◄── AiTrack[] ──────┘                                     │
│  (pakai playContext yang SUDAH ADA — 0 perubahan store)                           │
└──────────────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────▼─────────────────┐
                    │  Serverless Function (Vercel)     │
                    │  /api/dj/chat                     │
                    │  /api/music/search                │
                    │  /api/media/preview (cache 206)   │
                    │                                   │
                    │  • tambah header CORS utk kita    │
                    │  • cache 10 menit per intent-hash │
                    │  • antrean + batas 60 req/menit   │
                    │  • simpan prompt di BODY, bukan URL│
                    └───────┬──────────────┬────────────┘
                            │              │
                    comiku.my.id     lrclib.net / itunes preview
                    /ai/deepseek     (fallback lirik & audio)
                    /search/applemusic
```

**Prinsip #1 — pemisahan tugas (WAJIB):**

```
User: "lagu hujan buat kerja, jangan yang rame"
   │
   ├─(1) Intent parser  → bisa AI, bisa regex. Output: Intent{FILTER, bukan judul lagu}
   │      {mood:["kalem","fokus"], activity:"kerja", tempo:"slow", energy:0.2, limit:5}
   │
   ├─(2) Retrieval + ranking  → 100% kode deterministik, TANPA AI
   │      skor = 0.35·moodMatch + 0.25·tempoMatch + 0.2·genreMatch
   │             + 0.1·popularity + 0.1·novelty   (katalog lokal, 46 track)
   │
   ├─(3) Enrichment  → /search/applemusic untuk 2–3 seed query (paralel, cached)
   │      → AiTrack[] dengan preview_url 30s + artwork + link Apple
   │
   └─(4) Copywriting → 1 panggilan /ai/deepseek: 1–2 kalimat pengantar
          (kalau AI gagal → template fallback "Ini 5 lagu kalem buat kerja.")
```

Kenapa tidak sekalian minta AI memilih lagu? Karena: (a) AI wrapper tidak stabil (bukti §1.4), (b) AI tidak tahu isi katalog/preview yang tersedia, (c) halusinasi judul = bubble kosong. **AI mengembalikan *niat*, kode mengembalikan *lagu*.** Ini juga yang membuat fitur tetap jalan saat comiku down.

**Prinsip #2 — rantai fallback berlapis:**

| Lapis | Intent parser | Copy | Track |
| --- | --- | --- | --- |
| 1 | `/ai/deepseek` (proxy) | `/ai/deepseek` | `/search/applemusic` |
| 2 | parser lokal (kamus ID: *senja, galau, nugas, hujan, mabar, …*) | template statis 12 varian | katalog demo lokal (`mood` yang sudah ada) |
| 3 | — | — | 6 track "Vibe Harian" (selalu ada) |

Semua lapis punya **timeout 6 detik**; UI tidak pernah menunggu > 8 detik.

---

## 4. Kontrak data

```ts
// src/ai/types.ts  (rencana)
export type Intent = {
  mood: string[];            // ["kalem","hangat"]
  genres: string[];          // ["akustik","lo-fi"]
  artists: string[];         // ["Payung Teduh"]
  activity?: string;         // "kerja" | "tidur" | "jalan" | …
  tempo?: "slow" | "mid" | "fast";
  energy: number;            // 0..1
  language?: "id" | "en" | "any";
  era?: [number, number];
  limit: number;             // 3..8
  rawQuery: string;          // untuk music search
};

export type AiTrack = {
  id: string;                          // "am:936241610" | "local:t19" | "sc:2408461857"
  source: "apple" | "soundcloud" | "local";
  title: string;
  artist: string;
  album?: string;
  duration: number;                    // detik
  artworkUrl?: string;
  playable: "preview" | "generative" | "hls" | "link-only";
  audioUrl?: string;                   // preview 30s / signed HLS / (katalog: undefined → engine)
  externalUrl: string;                 // atribusi + tautan keluar
  attribution: string;                 // "Pratinjau 30 dtk · Apple Music"
  reason?: string;                     // "kenapa lagu ini dipilih"
  score: number;
};

export type AiMessage =
  | { id: string; role: "user"; text: string; at: number }
  | { id: string; role: "dj"; text: string; at: number;
      intent?: Intent; tracks?: AiTrack[];
      state: "thinking" | "ready" | "error" | "empty";
      error?: string; suggested?: string[] };
```

**Perubahan kode yang dibutuhkan (kecil, non-breaking):**

- `Track` di `src/data/catalog.ts` → tambah field opsional `artworkUrl?: string`, `externalUrl?: string`, `attribution?: string`. `audioUrl` **sudah ada**.
- `playerStore.playContext()` **dipakai apa adanya** → AI tidak perlu store baru.
- `PlayerProvider` → tambah satu cabang: kalau `track.audioUrl` berakhiran `.m3u8` **atau** `source==="soundcloud"` → pakai `hls.js`; selain itu `<audio>` biasa (sudah jalan).
- Satu store baru: `src/store/aiStore.ts` (pesan, riwayat sesi di `sessionStorage` — **bukan** localStorage, supaya privasi seperti Relay).

---

## 5. Halaman `/ai` (Vibe DJ)

**Rute:** `/ai` → tab "Vibe DJ ✨" di sidebar + tab bawah (ganti "Pemutar" di mobile? tidak — tambah item ke-5 khusus, lihat §6).

**Anatomi:**

```
┌ Vibe DJ ✨                                   [Riwayat] [⋮] ┐
│                                                            │
│   ◇ DjMark (44px)   Halo, aku Vibe DJ.                     │
│                     Sebut suasana atau aktivitasmu,        │
│                     aku susun 3–6 lagu siap putar.         │
│                     ── AI bisa keliru · bukan manusia ──   │
│                                                            │
│   [Lagu hujan buat kerja] [Akustik senja ID] [Yang mirip   │
│    Payung Teduh] [Fokus 25 menit tanpa lirik] [Surprise me]│
│                                                            │
│   ┌──────────────────────────────────────────────────────┐ │
│   │  Ini 5 lagu hangat buat kerja, tempo pelan, minim     │ │
│   │  distorsi. Ambil napas, mulai dari yang paling ringan.│ │
│   │                                                       │ │
│   │  ┌─────────────────────────────────────────────────┐  │ │
│   │  │ [art] Menuju Senja        30 dtk ▸    Apple ↗   │  │ │
│   │  │       Payung Teduh · Dunia Batas                │  │ │
│   │  │       ✦ kalem · gitar · 5:06                    │  │ │
│   │  └─────────────────────────────────────────────────┘  │ │
│   │  … 4 kartu lain …                                     │ │
│   │                                                       │ │
│   │  [▶ Putar semua]  [+ Simpan playlist]  [🔀]  [↻ Ulang]│ │
│   └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tulis pesan untuk Vibe DJ          Enter kirim · 0/800│  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Detail perilaku:**
- **Playable bubble:** kartu = `<AiTrackCard>`; tombol ▸ memanggil `playContext(tracks, index, "Vibe DJ · " + intent, "ai-<msgId>")` → memutar **langsung di halaman AI** (sesuai permintaan), mini-player tetap sinkron.
- **Pratinjau 30 dtk:** kartu diberi label `30 dtk` + progress halus; saat habis → auto-lanjut ke kartu berikutnya (mode "preview chain"), TIDAK mengklaim lagu selesai.
- **"Putar semua"** = antrean; **"+ Simpan playlist"** = `createPlaylist("Vibe DJ · <mood>")` + `addTrackToPlaylist` (store yang sudah ada).
- **Kenapa lagu ini** (reason chip) → memenuhi pola Spotify; tanpa ini, rekomendasi terasa acak.
- **Ulang (`↻`)** menyimpan variasi ke carousel kecil (anti-pattern yang harus dihindari: menimpa balasan tanpa jejak).
- **States:** `thinking` (3 titik + waveform, **tanpa** progress %), `ready`, `error` (kartu jujur "AI sedang tidak bisa dihubungi — ini pilihan lokal"), `empty` (0 hasil → tawarkan perluas filter).
- **Tanya-jawab musik** (non-playback): lirik (`/search/lyrics`, fallback `lrclib.net` langsung), fakta artis, "lagu ini nadanya apa" → jawaban teks + tombol ulang. Jangan pernah mengarang lirik bila endpoint gagal; tampilkan "lirik tidak tersedia".
- **Aksesibilitas:** `role="log"` + `aria-live="polite"` pada stream, `aria-label` per kartu, fokus kembali ke composer setelah kirim, kontras ≥4.5:1.

---

## 6. Bubble AI melayang (ala Relay di blognodata) + logo

**Komponen `<DjBubble/>`** dirender di `Shell` (sekali, semua halaman).

- **Desktop:** FAB 52 px, kanan-bawah **di atas PlayerBar** (`bottom: calc(var(--player-h) + 22px); right: 22px`). Saat dibuka → panel 380×min(620px, 68vh) dengan radius 20 & kaca yang sama (`backdrop-filter: blur(var(--blur))`), animasi `scale(.97)→1` 180 ms.
- **Mobile:** FAB 48 px di atas `mobile-tabs` (`bottom: calc(var(--player-h) + var(--tabs-h) + 16px)`); saat dibuka → **full-screen sheet** (bukan jendela mini), composer nempel di atas keyboard + `env(safe-area-inset-bottom)`, tombol tutup di kanan atas. Ini sesuai praktik widget 2026 (jendela kecil di ponsel tidak terbaca setelah 2 pesan).
- **Konflik dengan UI yang ada (penting):** ada 3 elemen bawah (PlayerBar, mobile tabs, toast). Aturan: FAB **tidak boleh** menutupi `.play-btn` maupun tab; toast digeser (`bottom` +56 px) saat bubble terbuka; panel queue ditutup otomatis saat bubble dibuka di layar <1180 px.
- **Kontekstual (pembeda vs ChatGPT dalam sidebar):** bubble mengirim konteks halaman ke prompt — `{page: "/album/afterglow", nowPlaying: "Afterglow", recent: [...]}` sehingga "putar yang mirip ini" benar-benar merujuk lagu yang sedang diputar. Ini yang membuat widget terasa bagian dari produk.
- **Tidak auto-open.** Sesuai referensi UX: auto-open/pulse = dianggap iklan. Maksimal 1 “dot” halus setelah user menghabiskan >45 dtk di satu halaman, bisa di-dismiss permanen.

**Logo AI (DjMark) — selaras dengan brand Vibe:**
- Bentuk: rounded-square 10/14 px radius (sama dengan `brand-mark`), gradient `--accent → --accent-2` (ikut lagu aktif, jadi "hidup"), di dalamnya **waveform 5 bar** (sama seperti logo Vibe) + **1 sparkle ✦** di pojok kanan-atas & 1 titik kecil → menandakan "AI" tanpa merusak siluet.
- 3 state animasi: `idle` (sparkle berdenyut 4 s), `thinking` (5 bar waveform berjalan, seperti `Equalizer` yang sudah ada), `speaking`/`ready` (glow ring 1×).
- Ukuran: 24 (inline), 32 (FAB), 44 (header halaman), 64 (empty state).
- Implementasi: `src/components/DjMark.tsx` (SVG inline, 0 aset baru, ikut `data-motion`).
- **Nama persona:** **"Vibe DJ"** (pendek, mudah dilokalkan; hindari nama yang meniru brand lain).

---

## 7. Proxy & keamanan (bagian yang tidak boleh dilewat)

| Risiko | Mitigasi |
| --- | --- |
| CORS tertutup | Semua lewat `/api/dj/*` milik sendiri; proxy menambah header untuk origin kita saja. |
| `x-ratelimit-limit: 60` | Cache hasil per **hash intent** 10 menit; dedupe request identik (in-flight coalescing); batas 6 request/menit per sesi; antrean global di proxy. |
| Prompt di URL (GET) | Proxy mengirim **POST body** dari klien → lalu GET ke comiku. Log klien tidak pernah memuat prompt. Jangan simpan prompt di localStorage. |
| Wrapper mati/berubah | Fallback berlapis (§3) + `health` flag: 3 kegagalan berturut → matikan AI 5 menit, pakai parser lokal. |
| AI halusinasi | AI **tidak** memilih lagu; hanya menamai suasana. Track selalu berasal dari API/katalog nyata. |
| Atribusi & hak cipta | Setiap kartu menampilkan sumber + tautan keluar. Preview Apple diberi label "Pratinjau 30 detik". Tidak ada unduhan, tidak ada `download` attribute. |
| SoundCloud (opsional) | Dimatikan default, di balik "Mode eksperimental" + atribusi SoundCloud + tautan kreator. Kalau dipakai publik: daftar app resmi SoundCloud + patuhi batas 15k play/hari. Untuk versi aman: **jangan aktifkan**. |
| Anak di bawah umur / data pribadi | Riwayat chat hanya di `sessionStorage` (hilang saat tab ditutup) — sama seperti Relay; ada tombol "Hapus riwayat". Tidak menyimpan nama/email. |

**Konsekuensi deployment:** proyek harus punya **fungsi server**. Kalau hosting tetap statis murni (GitHub Pages), fitur AI **tidak bisa** jalan — kecuali user menempelkan API key Gemini miliknya sendiri di pengaturan (lihat §9 opsi B).

---

## 8. Rencana kerja (bertahap, dengan definition of done)

| Fase | Isi | DoD (kriteria selesai) | Estimasi |
| --- | --- | --- | --- |
| **P0 — Probe & kontrak** | Skrip probe 1 file (`scripts/probe-comiku.mjs`): uji `/search/applemusic`, `/tools/soundcloud`, `/ai/deepseek`; rekam bentuk respons + latensi; verifikasi CORS dari origin asli | Laporan JSON tersimpan; diketahui p50/p95 latensi & tingkat sukses | 0,5 hari |
| **P1 — Proxy** | `/api/music/search`, `/api/dj/chat`, `/api/health`; cache in-memory + `Cache-Control`; timeout 6 s; rate limit; `.env.example` (`COMICU_BASE`, `DJ_PROVIDER`, `DJ_UPSTREAM_KEY?`) | `curl` ke proxy dari origin lain berhasil; 10 request identik → hanya 1 keluar ke upstream | 1 hari |
| **P2 — Intent & retrieval** | `src/ai/intent.ts` (parser lokal + kamus ID), `src/ai/rank.ts` (skor deterministik), `src/ai/client.ts`; unit test ≥12 kasus prompt Indonesia | 12/12 test lulus; prompt aneh ("lagu buat nugas jam 2 pagi") tetap menghasilkan 5 track | 1,5 hari |
| **P3 — Halaman `/ai`** | UI chat, preset prompt, state thinking/error/empty, kartu playable, "putar semua", "simpan playlist", riwayat sesi | Bisa memutar dari halaman AI; player bar & Media Session ikut benar; Lighthouse a11y ≥95 | 2 hari |
| **P4 — Bubble melayang** | `DjBubble`, `DjMark`, konteks halaman/lagu, collision dengan player/tabs/toast, full-screen di mobile | Tidak menutupi kontrol utama di 320/390/768/1440 px; buka/tutup < 200 ms | 1 hari |
| **P5 — Preview chain + hls (opsional)** | Auto-lanjut 30 s, badge sumber, `hls.js` di belakang flag | Pratinjau berantai mulus; bundle tambahan hanya saat flag aktif | 1 hari |
| **P6 — Poles & rilis** | Error copy, empty states, disclaimer, hapus riwayat, i18n teks, dokumentasi `docs/ai.md`, update README + splash (`Menyiapkan Vibe DJ`) | Build & 20+ test hijau; dokumentasi lengkap | 1 hari |

**Total ±8 hari kerja** (bisa dipotong: MVP P0–P3 ≈ 5 hari sudah menghasilkan AI chat + playable bubble di halaman penuh, tanpa FAB).

---

## 9. Bila API pihak ketiga bermasalah: 3 opsi penyedia AI

| Opsi | Kelebihan | Kekurangan | Kapan dipilih |
| --- | --- | --- | --- |
| **A. comiku `/ai/deepseek`** (default) | gratis, tanpa key, sudah terbukti jalan | tanpa SLA, wrapper tak resmi, 60 req/menit, bisa mati seperti `/ai/chatgpt` | demo, portofolio, traffic kecil |
| **B. Key milik user** (Gemini free tier / OpenRouter / Groq) diisi di Pengaturan → disimpan **hanya** di `sessionStorage`, dikirim ke proxy kita | stabil, resmi, kuota jelas, bisa JSON mode | user harus punya key; server tetap perlu proxy kalau key disembunyikan | produk semi-publik |
| **C. Server key sendiri** (Gemini/OpenRouter) di `.env` server | pengalaman paling mulus, JSON mode, streaming SSE | ada biaya; kuota dibagi semua user | produksi |

Desain kode: satu interface `DjProvider { parseIntent(): Promise<Intent>; copy(): Promise<string> }` dengan 3 implementasi → ganti tanpa menyentuh UI.

---

## 10. Risiko utama (jujur)

1. **Ketergantungan pada wrapper tidak resmi.** `/ai/chatgpt` sudah mati saat saya uji; `/ai/gemini` mengubah prompt. Kita **tidak boleh** menjanjikan fitur "selalu jalan". Mitigasi: fallback deterministik (fitur inti tetap hidup tanpa AI).
2. **Batas 60 request/jendela.** Dengan cache, wajar; tanpa cache, 10 user aktif bisa menghabiskan. Mitigasi: cache + antrean + indikator "mohon tunggu" yang sopan.
3. **Legal audio.** Kita hanya boleh memutar pratinjau resmi + menautkan. Kalau user ingin lagu penuh, jalurnya katalog sendiri (§ `docs/music-api.md`).
4. **Kualitas rekomendasi.** Katalog lokal 46 track → cepat "habis". Enrichment Apple Music memperluas, tapi *matching* mood pada 30 detik preview terbatas (tanpa audio analysis). Mitigasi: alih-alih menganalisis audio, pakai metadata genre + kata kunci + skor popularitas; akui batasnya di UI ("berdasarkan genre & tempo, bukan analisis audio").
5. **Privasi.** Prompt lewat pihak ketiga. Mitigasi: sessionStorage, disclaimer, tombol hapus, dan **jangan pernah** kirim nama/email/lokasi.

---

## 11. Yang TIDAK akan saya kerjakan (batas etis)

- Mengkloning UI/katalog/audio Spotify, atau menarik audio dari endpoint terenkripsi.
- Memakai `/ai/rewind` (butuh email/password orang lain) atau endpoint `downloader` untuk konten berhak cipta.
- Menyembunyikan atribusi SoundCloud/Apple, atau menyisipkan iklan di atas audio pihak lain.
- Menyimpan prompt user di server tanpa izin.

---

## 12. Keputusan (sudah dijawab 29 Okt 2026)

1. **Sumber bunyi** → _direvisi setelah riset_ (**`docs/free-music-api-research.md`**):
   **Audius (lagu penuh, gratis, resmi)** → **Openverse/Jamendo CC** → **Deezer/iTunes pratinjau
   30 dtk** → **katalog demo lokal**. Preview Apple 30 dtk bukan lagi sumber utama.
2. **Hosting proxy** → **Vercel** (`api/` serverless functions). Aman untuk CORS, cache, dan
   menyembunyikan prompt dari URL.
3. **Provider AI** → **rantai**: `comiku /ai/deepseek` → key user (Gemini/OpenRouter) →
   parser lokal Indonesia. Fitur inti tetap hidup tanpa AI.
4. **SoundCloud** → **tidak dipakai** (URL internal, ToS, iklan terlewati, risiko hak cipta).

**Masih menunggu 2 keputusan sebelum eksekusi** (detail di riset §7): apakah lagu berlisensi
**CC BY-NC-ND (non-komersial)** boleh dipakai, dan apakah akan mendaftarkan **API key Audius gratis**.

---

## 13. Lampiran — ringkasan bukti uji (29 Okt 2026)

```
GET /search/applemusic?q=senja            → 200, 15 track, ada preview_url (30 s) ✅
GET /search/applemusicsong?id=586449394    → 200, detail + isrc + preview ✅
GET /tools/soundcloud?q=lofi&type=tracks   → 200, 10 track, stream HLS signed ⚠️
GET /tools/soundcloud?q=…&type=playlists   → 200, playlist + trackCount ✅
GET /search/lyrics?text=…                  → 200 {status:false,"error":"HTTP 503"} ❌ (upstream lrclib)
GET /search/ytmusicsearch?q=senja          → error "Parameter wajib: text" (param ≠ q)
GET /ai/deepseek?text=halo siapa kamu      → 200 {reply, model:"deepseek/deepseek-v4-flash"} ✅
GET /ai/gemini?text=…                      → 200 tapi tidak patuh instruksi ⚠️
GET /ai/chatgpt?text=…                     → "Unauthorized (403): cookie expired" ❌
GET /ai/overchat?text=…                    → error "Parameter wajib: q"
CORS tes komiku.my.id                      → "will not work correctly with CORS" ❌
Header lain                                → x-ratelimit-limit: 60, CSP connect-src 'self'
```
