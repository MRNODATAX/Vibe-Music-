# RISET — Sumber audio gratis yang benar-benar jalan (untuk Vibe DJ)

> **Status:** riset & rekomendasi. **Belum ada kode fitur yang dieksekusi.**
> **Metode:** probe langsung ke endpoint asli (bukan mengutip blog), lalu cek header CORS
> lewat penguji CORS independen. Tanggal: **29 Okt 2026**.
> **Pertanyaan yang dijawab:** "cari API musik gratis di GitHub/internet yang 100% berhasil
> dan gratis".
> **Jawaban singkat & jujur:** **tidak ada API yang bisa dijamin 100%** — yang ada adalah
> **kombinasi berlapis** yang membuat aplikasi *hampir selalu* bisa memutar sesuatu. Di bawah
> ini peringkatnya, dengan bukti.

---

## 1. Ringkasan keputusan (TL;DR)

| Peringkat | Sumber | Gratis? | Lagu penuh? | Tanpa key? | Bisa langsung dari browser? | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| 🥇 **1** | **Audius** (`api.audius.co/v1`) | ✅ selamanya (free plan 10 req/s, 500k/bln) | ✅ **ya, full track** | ✅ baca tanpa key (`app_name`); key gratis untuk limit lebih tinggi | ✅ **CORS `*` + `accept-ranges`** | **Tulang punggung audio AI** |
| 🥈 **2** | **Openverse → Jamendo** (`api.openverse.org`) | ✅ tanpa key (anonim, rate-limited) | ✅ **ya, MP3 penuh** | ✅ | ✅ (Storage Jamendo memantulkan origin + `accept-ranges`) | Katalog CC; **lisensi BY-NC-ND = non-komersial** |
| 🥉 **3** | **Radio Browser** (`*.api.radio-browser.info`) | ✅ tanpa key | ✅ (radio, bukan on-demand) | ✅ | ✅ **CORS `*`** | "Mode Radio AI" — musik tanpa henti |
| 4 | **Deezer** (`api.deezer.com`) | ✅ tanpa key | ❌ pratinjau 30 dtk | ✅ | ❌ **tanpa CORS** → butuh proxy | Pratinjau katalog mainstream |
| 4 | **iTunes Search** (`itunes.apple.com/search`) | ✅ tanpa key | ❌ pratinjau 30 dtk | ✅ | ❌ tanpa CORS (hanya JSONP) | Pratinjau + artwork HD |
| 5 | **Internet Archive** (`archive.org`) | ✅ tanpa key | ✅ (public domain/CC) | ✅ | ✅ CORS `*` | Bonus: jazz klasik, live music, PD |
| ❌ | Spotify / Apple Music penuh / SoundCloud internal / Jamendo langsung / FMA | — | — | — | — | Ditolak (§6) |

**Rekomendasi audio untuk Vibe DJ (3 lapis, sesuai pilihanmu "rantai"):**

```
1. Audius        → lagu penuh, gratis, legal, CORS-aman   (utama untuk hasil AI)
2. Openverse CC  → lagu penuh, wajib atribusi & non-komersial (pelengkap suasana/genre)
3. iTunes/Deezer → pratinjau 30 dtk untuk lagu mainstream yang tidak ada di Audius
4. Katalog demo  → mesin generatif lokal (offline, selalu berhasil)
```

Kalau lapis 1–2 kosong untuk sebuah query, UI **berpindah label**, bukan error:
`Lagu penuh · Audius` → `Pratinjau 30 dtk · Apple` → `Demo lokal`.

---

## 2. Bukti probe (yang benar-benar saya jalankan)

### 2.1 Audius — ✅ menang

```
GET https://api.audius.co/v1/tracks/search?query=lofi&app_name=VibeMusic&limit=2     → 200 JSON
GET https://api.audius.co/v1/tracks/trending?app_name=VibeMusic&limit=2             → 200 JSON
```

Contoh field yang didapat (dipangkas dari `tracks/trending`):

```json
{"track_id":746414052,"id":"W08NKdZ","title":"iLLPeTiLL - Post HospitiLL Slapperzzz Mix",
 "duration":394,"genre":"Electronic","mood":"Defiant","bpm":88,"musical_key":"E minor",
 "tags":"edm,bass,dubstep,dj,djmix,woozy...","play_count":980,"is_streamable":true,
 "is_stream_gated":false,"access":{"stream":true,"download":true},
 "artwork":{"150x150":"https://audius-01.staked.cloud/...","1000x1000":"..."},
 "stream":{"url":"https://cn3.mainnet.audiusindex.org/tracks/cidstream/baeaa…?signature=…",
           "mirrors":["https://audius-content-13.figment.io", "…"]},
 "user":{"name":"@iLLPeTiLL","handle":"illpetill","is_verified":true,"follower_count":622}}
```

Header (diuji lewat CORS Tester, origin pihak ketiga):

```
API  : access-control-allow-origin: *      accept-ranges: bytes
CDN  : access-control-allow-origin: *      accept-ranges: bytes   cache-control: immutable
```

**Kenapa ini yang terbaik untuk fitur AI kita:**
- **Metadata cocok langsung dengan kebutuhan rekomendasi:** ada `mood`, `bpm`, `musical_key`,
  `genre`, `tags`, `play_count` → ranking deterministik jadi akurat tanpa perlu analisis audio.
- **`stream.url` sudah ada di respons** (signed, ada `mirrors`) → tidak perlu round-trip tambahan.
- **Legal & resmi:** dokumentasi resmi menyatakan read-only tanpa kredensial, API key **aman
  ditaruh di frontend**, free plan **10 req/detik & 500.000 req/bulan**, tanpa kuota playback
  (docs.audius.co & api.audius.co/v1).
- Tidak butuh proxy untuk **membaca & streaming** (CORS `*`) — proxy hanya untuk AI & Deezer/iTunes.

**Kekurangan (jujur):** katalog = indie/elektronik/hip-hop komunitas. **Tidak ada** Payung Teduh,
Tulus, atau pop mainstream Indonesia. Jadi Audius unggul untuk "suasana" (lofi, chill, house),
lemah untuk "lagu spesifik artis terkenal".

**Catatan wajib:** kreditkan artis + tautkan `permalink` (Audius meminta atribusi artis), dan
registrasi `app_name`/API key gratis supaya tidak kena limit.

### 2.2 Openverse → Jamendo (CC) — ✅ kuat untuk lagu penuh, ⚠️ lisensi NC

```
GET https://api.openverse.org/v1/audio/?q=lofi&page_size=2   → 200 JSON (tanpa token)
```

```json
{"result_count":240,"results":[{
  "title":"Autumn Wind (LoFi Hiphop Music Beat Relaxing Drums)",
  "creator":"Epikton","duration":199000,
  "url":"https://prod-1.storage.jamendo.com/?trackid=2037895&format=mp32",
  "license":"by-nc-nd","license_version":"3.0",
  "license_url":"https://creativecommons.org/licenses/by-nc-nd/3.0/",
  "attribution":"\"Autumn Wind …\" by Epikton is licensed under CC BY-NC-ND 3.0…",
  "genres":["electronic","lofi","chillwave"],
  "tags":[{"name":"calm"},{"name":"instrumental"},{"name":"peaceful"},{"name":"soft"}],
  "thumbnail":"https://api.openverse.org/v1/audio/…/thumb/"}]}
```

Header file audio (`prod-1.storage.jamendo.com`): `content-type: audio/mpeg`,
**`accept-ranges: bytes`**, `access-control-allow-origin: <origin pemanggil>` → **bisa diputar
dari origin mana pun** (memantulkan origin, bukan wildcard).

**Nilai lebih:** ada `tags` suasana (`calm`, `peaceful`, `instrumental`) + `license` + teks
`attribution` siap tampil. **Kekurangan:** banyak trek **BY-NC-ND** → **tidak boleh untuk
produk komersial**, tidak boleh diubah, wajib atribusi + tautan lisensi. Cocok untuk demo/
portofolio pribadi; **harus disaring** kalau Vibe Music mau dimonetisasi (bisa filter
`license=cc0,by,pdm` di Openverse untuk yang lebih longgar).

### 2.3 Radio Browser — ✅ paling "anti-gagal"

```
GET https://de1.api.radio-browser.info/json/stations/search?name=jazz&limit=2&hidebroken=true
→ 200 JSON: name, url_resolved (AAC/MP3), country, tags, codec, bitrate, hls, lastcheckok
Header: access-control-allow-origin: *   allow-methods: GET,POST
```

**Kegunaan:** untuk prompt seperti "radio jazz buat kerja", "lo-fi tanpa henti", kita bisa
menawarkan **stasiun radio nyata** yang diputar terus tanpa henti — sesuatu yang Audius/iTunes
tidak bisa. Tidak ada kontrol track, jadi cocok sebagai **mode tambahan**, bukan pengganti.

### 2.4 Deezer — ⚠️ pratinjau 30 dtk, tanpa CORS (proxy wajib)

```
GET https://api.deezer.com/search?q=senja&limit=2 → 200 JSON
{ "title":"Senja","duration":184,"rank":381438,
  "preview":"https://cdnt-preview.dzcdn.net/api/1/1/9/a/7/…mp3?hdnea=exp=…~hmac=…",
  "artist":{"name":"RØRE"},"album":{"cover_xl":"…1000x1000…"} }
```

Header: **tidak ada `access-control-allow-origin`** → `fetch` dari browser gagal (harus proxy).
`preview` = MP3 ~30 detik, token kedaluwarsa. **Kelebihan:** katalog mainstream + cover HD.
**Kekurangan:** bukan lagu penuh; tanpa dokumen resmi publik untuk pemakaian pihak ketiga →
perlakukan sebagai "pratinjau + tautan keluar", jangan diandalkan.

### 2.5 iTunes Search — ⚠️ pratinjau 30 dtk, tanpa CORS (JSONP/proxy)

```
GET https://itunes.apple.com/search?term=senja&entity=song&limit=2&country=ID → 200 JSON
{ "trackName":"Menuju Senja","artistName":"Payung Teduh","trackTimeMillis":306429,
  "previewUrl":"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/…m4a",
  "artworkUrl100":"https://is1-ssl.mzstatic.com/…/100x100bb.jpg","isStreamable":true }
```

Tanpa `access-control-allow-origin` (hanya JSONP `&callback=`). Pernah mengembalikan
`retry-after: 26` saat dipanggil cepat → **ada throttle**. **Sama seperti comiku `/search/applemusic`**
(dia hanya membungkus ini). **Kesimpulan:** kalau tetap memakai jalur "comiku", tidak ada rugi —
tapi untuk preview mainstream, **Deezer/iTunes langsung lewat proxy kita lebih sedikit titik gagal**.

### 2.6 Internet Archive — ✅ bonus

Header `archive.org/advancedsearch.php`: **`access-control-allow-origin: *`**, `Range` diizinkan.
Isi: rekaman public domain, *Live Music Archive*, jazz klasik, radio lama. Bagus untuk
"playlist era 1950-an" atau "jazz klasik" dengan lagu penuh yang bebas royalti.

---

## 3. Arsitektur audio final (menggantikan rencana §3 di dokumen sebelumnya)

```
User: "lagu hujan buat kerja"
  │
  ├─ Intent (AI/parser)  → {mood:["kalem"], activity:"kerja", tempo:"slow", limit:5}
  │
  ├─ Resolver (server, /api/dj/chat) — urutan percobaan:
  │    1) Audius  /v1/tracks/search?query=<mood+genre>&app_name=VibeMusic&limit=8
  │         filter: is_streamable && is_stream_gated=false && access.stream
  │         skor: mood/bpm/tags/genre/play_count
  │    2) Openverse /v1/audio/?q=<query>&license=cc0,by,pdm   (hanya bila (1) < 3 hasil)
  │    3) Deezer  /search?q=<query>  (proxy) → tandai "Pratinjau 30 dtk"
  │    4) katalog lokal demo (generatif)
  │
  └─ Hasil: AiTrack[] dengan field playable & attribution yang jujur
```

**Matematika kuota (supaya tidak menabrak limit):**

| Sumber | Limit | Pemakaian kita | Aman? |
| --- | --- | --- | --- |
| Audius free | 10 req/dtk, 500k/bln | 1 request per prompt (cache 10 mnt) → ~6/jam/user aktif | ✅ sangat aman |
| Deezer | ~50 req/5 dtk per IP (publik) | hanya saat fallback, 1 req | ✅ |
| iTunes | ~20 req/menit per IP | hindari; prefer Deezer | ⚠️ jangan diandalkan |
| Openverse | anonim, terbatas | hanya pengisi | ✅ |
| comiku AI | 60 req/jendela | 1–2 per prompt, cache | ⚠️ perlu antrean |

**Label di UI (wajib, biar jujur ke pengguna):**
`● Lagu penuh · Audius` · `● CC · Epikton · BY-NC-ND` · `◐ Pratinjau 30 dtk · Deezer` · `♪ Demo lokal`.

---

## 4. Yang berubah dari plan sebelumnya

| Item | Sebelum | Sekarang (setelah riset) |
| --- | --- | --- |
| Sumber audio AI | Apple preview 30 dtk (via comiku) | **Audius full track** (utama) + Openverse + preview + demo |
| Kebutuhan proxy | untuk semua | hanya untuk **AI** & **Deezer/iTunes**; Audius/Openverse/Radio bisa langsung (CORS `*`) |
| Peran comiku | pencarian musik + AI | **AI saja** (+ Apple search opsional). Pencarian langsung ke Audius lebih tahan banting |
| SoundCloud | di balik flag | **tidak dipakai** (sesuai keputusanmu) |
| Provider AI | comiku | **rantai**: comiku/deepseek → key user (Gemini) → parser lokal |
| Deploy | belum pasti | **Vercel** (folder `api/`), sesuai pilihanmu |
| `hls.js` | perlu untuk SoundCloud | **tidak perlu** (Audius = file audio biasa/HLS-nya transparan; Deezer/iTunes = m4a/mp3) |

---

## 5. Risiko & batasan yang harus kamu tahu (jujur)

1. **Tidak ada jaminan 100%.** Audius bisa lambat/bermasalah; Openverse bisa kosong untuk kata
   kunci Indonesia; Deezer bisa menolak. Itu sebabnya harus **berlapis** dan UI harus jujur soal
   label sumber. Yang bisa saya janjikan: *aplikasi tidak blank* — selalu ada sesuatu yang bisa diputar.
2. **Katalog Audius ≠ Spotify.** Prompt "lagu Payung Teduh" akan jatuh ke pratinjau 30 detik
   (Deezer/iTunes), bukan lagu penuh. Ini konsekuensi hukum, bukan bug.
3. **CC BY-NC-ND = non-komersial.** Kalau Vibe Music nanti dimonetisasi, entri NC harus difilter
   (`license=cc0,by,pdm`) atau dihapus. Saya bisa menambahkan filter ini sejak awal.
4. **Atribusi bukan opsional.** Audius: nama artis + tautan. CC: judul, kreator, jenis lisensi,
   tautan lisensi. Ini juga menaikkan kredibilitas proyekmu di mata reviewer/HR.
5. **Signed URL kedaluwarsa.** `stream.url` Audius punya `signature` + timestamp → simpan
   maksimal di cache 10–15 menit, lalu refresh. Jangan disimpan di localStorage.
6. **Kuota AI tetap titik lemah** (comiku 60/jendela, wrapper tak resmi). Karena itu rantai
   provider + cache wajib, bukan opsional.

---

## 6. Kandidat yang saya tolak (dan alasannya)

| Kandidat | Alasan ditolak |
| --- | --- |
| **Spotify Web API / Web Playback SDK** | butuh Premium + SDK mereka; tidak boleh dipakai membangun "klien Spotify lain"; audio terenkripsi |
| **SoundCloud internal `api-v2`** | melanggar ToS, iklan terlewati, URL kedaluwarsa, banyak upload berhak cipta |
| **Jamendo API langsung** | `{"code":5,"error_message":"Jamendo Api Invalid Client Id Error"}` → wajib `client_id`; tetap layak **lewat Openverse** (tanpa key) |
| **Free Music Archive API** | API lama sudah tidak dirawat/ditutup; hanya sisa端 antarmuka web |
| **YouTube / yt-dlp / "YouTube Music downloader"** | melanggar ToS YouTube; legal-risk tinggi; **tidak akan saya implementasikan** |
| **Napster/Rhapsody, TIDAL, Apple Music catalog penuh** | butuh perjanjian kemitraan komersial |
| **Endpoint `downloader` milik comiku** (tiktok/capcut/ig) | konten pihak ketiga tanpa lisensi — tidak relevan dan berisiko |


---

## 6b. Kasus khusus: "Bukankah API YouTube Music gratis?"

Ini pertanyaan yang paling sering muncul, dan jawabannya: **gratis, tapi bukan untuk
memutar musik.** Ada tiga hal berbeda yang sering dianggap satu:

| Yang dimaksud | Status | Gratis? | Menghasilkan audio? |
| --- | --- | --- | --- |
| **YouTube Data API v3** | ✅ resmi | ✅ $0, tanpa tier berbayar | ❌ metadata saja |
| **"YouTube Music API"** | ❌ **tidak ada API resmi publik** | — | ❌ (yang beredar = scraper tidak resmi) |
| **YouTube IFrame Player API** | ✅ resmi | ✅ | ✅ tapi video + iklan + branding, tidak bisa audio-only |
| Ekstraksi stream (yt-dlp, `ytdl-core`, `ytmusicapi`) | ❌ melanggar ToS | teknis gratis | ✅ tapi rapuh & berisiko hukum |

### (a) YouTube Data API v3 — gratis, tapi kuotanya kecil dan tanpa audio

- Biaya uang: **$0**. Tidak ada tier berbayar; kuota hanya bisa dinaikkan lewat
  *audit form* yang sering ditolak.
- Kuota default: **10.000 unit/hari per project**; `search.list` = **100 unit** →
  praktis **±100 pencarian per hari untuk seluruh project** (bukan per user).
- Metode murah: `videos.list` / `playlistItems.list` = 1 unit.
- **Tidak ada endpoint audio sama sekali.** Jadi untuk Vibe DJ nilainya hanya
  *metadata & discovery* — bukan pemutaran.

### (b) "YouTube Music API" tidak ada versi resminya

YouTube Music **tidak punya API publik**. Semua paket bernama `ytmusic-api`,
`ytmusicapi`, `node-youtube-music`, dll. adalah pembungkus endpoint internal
`youtubei/v1/*` dengan client `WEB_REMIX` — tidak didokumentasikan dan melanggar
YouTube ToS. Jalur resmi yang diakui untuk playback hanyalah **IFrame Player** +
Data API untuk metadata. Endpoint `/search/ytmusicsearch` milik comiku juga
membungkus endpoint internal ini, dan hasilnya hanya **saran pencarian** (tanpa audio).

### (c) Kenapa mengekstrak stream makin mustahil (2026)

Bukan sekadar soal aturan — teknisnya juga terus dipatahkan YouTube:

- **SABR** (server-side adaptive bitrate) memaksa client `web` mengembalikan format
  tanpa URL → unduhan gagal `HTTP 403` (issue resmi yt-dlp).
- **PO Token** (proof-of-origin) dibuat oleh JS obfuscated di browser asli,
  **terikat sesi + cepat kedaluwarsa** → skrip tidak bisa menghitungnya sendiri.
- **nsig / signature cipher** berubah berkala; **bot check** ("Sign in to confirm
  you're not a bot"); **IP datacenter diblokir** sejak level jaringan.
- Konsekuensinya: perbaikan bersifat sementara. Komentar praktisi: *"any guide
  claiming a permanent solution is wrong, including this one in six months."*

### (d) Yang masih boleh & berguna dari YouTube

1. **Deep link** ke YouTube Music / video: `https://music.youtube.com/search?q=…` — 0 biaya, 0 risiko.
2. **oEmbed** (tanpa key, tanpa kuota): `https://www.youtube.com/oembed?url=<video>&format=json` → judul, author, thumbnail.
3. **Data API v3** hanya untuk metadata/pencarian skala kecil (≤100 search/hari).
4. **IFrame Player resmi** di tab terpisah ("Mode Video"): legal, tapi iklan + branding
   tampil, tidak boleh disembunyikan/dikecilkan di bawah batas minimum, dan tidak bisa
   dijadikan audio-only. Ini **pengalaman berbeda** dari player Vibe Music.

### (e) Keputusan untuk Vibe Music

- **Tidak** memakai YouTube sebagai sumber audio Vibe DJ. Bukan karena tidak bisa
  ditulis, tapi karena hasilnya aplikasi yang rusak tiap beberapa minggu dan berisiko
  takedown — bertentangan dengan tujuan "stabil, gratis, legal".
- **Boleh** dipakai sebagai *pelengkap*: tombol "Cari versi live/cover di YouTube",
  atau tab "Mode Video" dengan IFrame resmi (opsional, di balik flag).
- **Tulang punggung audio tetap Audius** (lagu penuh, resmi, CORS `*`), lalu
  Openverse CC, pratinjau Deezer/iTunes, dan katalog demo.

---

## 7. Rekomendasi langkah (menunggu izinmu)

**Urutan eksekusi yang saya sarankan (masih belum dijalankan):**

- **P0 — probe CI** (`scripts/probe-audio.mjs`): uji Audius search+stream, Openverse, Deezer,
  Radio Browser; simpan laporan JSON; jalankan di GitHub Action mingguan supaya tahu kalau ada
  API yang mati. *(0,5 hari)*
- **P1 — `api/` Vercel**: `/api/music/search` (Audius+Openverse+Deezer, cache 10 mnt),
  `/api/dj/chat` (rantai AI + parser lokal), `/api/health`. *(1 hari)*
- **P2 — resolver & ranking**: skor mood/bpm/tags/genre Audius + label sumber + atribusi. *(1,5 hari)*
- **P3 — halaman `/ai`** dengan kartu playable (lagu penuh Audius, preview berlabel). *(2 hari)*
- **P4 — bubble melayang** + `DjMark`. *(1 hari)*
- **P5 — poles**: filter NC, halaman kredit lisensi, offline demo, dokumentasi. *(1 hari)*

**Dua hal yang perlu keputusanmu sebelum P0:**

1. **Lagu CC BY-NC-ND (non-komersial) boleh dipakai?** Kalau Vibe Music hanya portofolio →
   boleh, dengan atribusi. Kalau berpotensi komersial → saya filter `cc0,by,pdm` saja.
2. **Daftar API key Audius gratis?** Tidak wajib (baca tanpa key), tapi dengan key limit jadi
   10 req/dtk & 500k/bln dan aplikasi lebih "resmi". Cukup dibuat di `api.audius.co/plans`.

Kalau dua itu sudah jelas, bilang **"eksekusi P0–P3"** dan saya mulai dari probe + proxy,
tanpa menyentuh sisa UI sampai kamu setuju tampilannya.
