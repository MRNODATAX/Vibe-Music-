# Review — "INSTRUKSI AI: Backend Musik APK" (29 Okt 2026)

> Dokumen yang direview: `INSTRUKSI-AI-BACKEND-MUSIK-APK-29OKT2026.html` (DEV NODATA).
> Sifat review: **teknis + kepatuhan + kelayakan**, bukan eksekusi.
> Batas metode: sandbox review ini **tidak punya akses jaringan ke YouTube**
> (semua request `youtube.com` → `000`), jadi klaim tentang perilaku yt-dlp di 2026
> diambil dari **issue tracker resmi yt-dlp** dan praktik komunitas, bukan uji lokal.

---

## 1. Isi dokumen, diringkas apa adanya

**Tujuan:** backend REST untuk APK musik (mirip Spotify), tanpa API key apa pun,
memakai tumpukan yang sudah terbukti di bot WhatsApp NodataBot.

| Bagian | Isi |
| --- | --- |
| Tumpukan wajib | Node.js 20 + Express · **yt-search** (pencarian) · **yt-dlp** via `youtube-dl-exec` (audio) · `@ffmpeg-installer/ffmpeg` · **lyrics.ovh** (lirik) |
| Endpoint | `GET /api/search?q=&limit=` · `GET /api/stream/:id` (proxy pipe) · `GET /api/lirik?artis=&judul=` · `GET /api/health` |
| Aturan keras | `execFile`/`spawn` dengan **array argumen** (anti command injection) · validasi id `^[A-Za-z0-9_-]{11}$` · maks **3 stream bersamaan** · timeout (cari 15 s, stream 30 s, lirik 10 s) · **bunuh proses anak** saat klien disconnect · **tidak menyimpan file** (cache maks 1 jam + cleanup) · CORS `*` · PORT dari env · error selalu JSON |
| Tahapan | 1 kerangka+health → 2 search+cache → 3 stream+antrean → 4 lirik → 5 uji+README |
| Kriteria selesai | `curl /api/health` (versi yt-dlp tampil), search ≥5 hasil, `-I /api/stream/{id}` → `audio/*`, unduh >500 KB yang bisa diputar, lirik terisi/null (bukan 500), id aneh → 400 & server hidup, 4 stream bersamaan tidak mematikan server |
| Bagian 8 (kejujuran) | Mengakui: cara yt-dlp mengambil audio **di luar ToS YouTube**, lagu **berhak cipta**, cocok **belajar & pribadi/terbatas**; untuk publik jalur resminya **Spotify/Deezer/Audius** |

**Penilaian saya atas kualitas dokumen:** ini spesifikasi yang **bagus dan matang**.
Aturan keamanannya (array args, validasi id, kill child, no-store, batas konkuren)
lebih baik dari 90% tutorial "API musik" di internet. Penulis juga jujur di §8.

---

## 2. Jawaban utama: apakah mengatasi masalah sekarang?

"Masalah sekarang" = *tidak bisa menikmati musik seperti Spotify (lagu penuh, katalog mainstream)*.

| # | Masalah | Diselesaikan? | Penjelasan |
| --- | --- | --- | --- |
| 1 | **Lagu mainstream penuh** (Tulus, Payung Teduh, Coldplay) | ✅ **YA** | Ini satu-satunya jalur gratis yang memberi **lagu penuh untuk hampir semua lagu**. Audius/Deezer/Apple tidak bisa |
| 2 | Lagu penuh, bukan pratinjau 30 dtk | ✅ **YA** | `bestaudio` → m4a/webm utuh |
| 3 | **Lirik** | ✅ ya, **tapi** | `lyrics.ovh` lemah untuk lagu Indonesia & sering down. **LRCLIB** jauh lebih baik (lihat §4) |
| 4 | **Integrasi ke Vibe DJ (fitur AI)** | ✅ **cocok** | Kontrak `search → stream` pas dengan `AiTrack { playable: "full", audioUrl }`. UI tidak perlu diubah |
| 5 | **Jalan di Vercel** (pilihan deploy-mu sebelumnya) | ❌ **TIDAK** | Butuh spawn binary + proses panjang → **serverless tidak bisa**. Harus container/VPS/PC |
| 6 | **Stabil jangka panjang** | ❌ **TIDAK** | SABR + PO Token + bot-check + IP datacenter diblokir. Rusak berkala, bukan sekali beres |
| 7 | **Legal & bisa dipublikasikan** | ❌ **TIDAK** | Melanggar ToS YouTube + mendistribusikan audio berhak cipta → Play Store menolak, risiko takedown/block |
| 8 | **Biaya** | ⚠️ | Proxy audio = bandwidth server. PC rumah cukup untuk 1–3 orang, bukan publik |
| 9 | **Monetisasi/iklan** | ❌ | Tidak boleh dimonetisasi; tidak ada iklan YouTube yang tampil |

**Kesimpulan jujur:** dokumen ini **menyelesaikan masalah #1 & #2 (katalog penuh) dengan sangat efektif**,
tapi **tidak menyelesaikan #6 & #7**, dan **bertabrakan dengan #5**. Untuk pemakaian
**pribadi di PC/VPS kamu sendiri**, ini jalan. Untuk **produk publik**, ini jalan buntu.

---

## 3. Yang sudah usang / perlu dikoreksi di dokumen (temuan 2026)

### 3.1 "Perbarui yt-dlp" tidak lagi cukup
Dokumen bilang obat pertama selalu update yt-dlp. Di 2026 itu **tidak cukup**:

- **SABR** (server-side adaptive bitrate): client `web` mengembalikan format **tanpa URL**
  → `HTTP 403 Forbidden`. Bukti: yt-dlp issue [#15689](https://github.com/yt-dlp/yt-dlp/issues/15689), [#17456](https://github.com/yt-dlp/yt-dlp/issues/17456).
- **PO Token** (proof-of-origin): dibuat JS obfuscated di browser asli, **terikat sesi &
  cepat kedaluwarsa** → perlu `bgutil-ytdlp-pot-provider` atau cookies browser.
- **Bot check** ("Sign in to confirm you're not a bot") + **IP datacenter diblokir**
  sejak level jaringan → server cloud gratis/ramai sering gagal total.
- Mitigasi nyata yang dipakai orang (bukan jaminan): `--extractor-args "youtube:player_client=tv,android_vr"`,
  PO-token provider, `--cookies-from-browser`, rotasi client. Sifatnya **sementara**.

→ Artinya **`/api/stream/:id` adalah titik paling rapuh** dari seluruh spesifikasi,
bukan `/api/search`. Search (yt-search) biasanya tetap jalan walau stream gagal —
persis yang disebut §8.

### 3.2 `-o -` pipe menghilangkan **seek/scrub**
Kalau server mem-pipe seluruh audio tanpa header `Range`, pemutar klien **tidak bisa
scrub/maju-tengah lagu** (hanya play dari awal). Untuk APK musik ini terasa seperti bug.
Pola yang lebih baik:
1. `yt-dlp -g -f ba/b <url>` → dapat **URL CDN langsung** (bukan file).
2. Proxy URL itu dengan **pass-through `Range`**, `Accept-Ranges: bytes`, `206 Partial Content`.
3. **Cache URL** (bukan file) ±1–3 jam; URL YouTube kedaluwarsa (parameter `expire`).
   Ini juga menghilangkan latensi ekstraksi 2–6 dtk di setiap play/seek.
4. Kalau tetap pipe: minimal kirim `Content-Length` bila diketahui + batasi 1 koneksi/lagu.

### 3.3 Selector format & Content-Type
`bestaudio[ext=m4a]` **tidak selalu ada**. Kalau semua kandidat gagal → 502.
Lebih aman: `-f "ba[ext=m4a]/ba[ext=webm]/ba/b"` **plus** deteksi nyata dari
`--dump-json` (`acodec`, `ext`) lalu set `Content-Type` dari hasil itu
(`audio/mp4` / `audio/webm` / `audio/mpeg`). Jangan menebak dari ekstensi URL.

### 3.4 Lirik: `lyrics.ovh` → **LRCLIB** (bukti)
Saya uji `https://lrclib.net/api/search?q=coldplay yellow` → 200, dan mengembalikan:
`plainLyrics` **dan** `syncedLyrics` ber-timestamp (`[00:34.89] Look at the stars …`).
Artinya bisa langsung **lirik sinkron bergulir** — fitur yang Spotify punya.
Rekomendasi kontrak:

```
GET /api/lirik?artis=&judul=&durasi=   →  { lyrics, synced, source }
 1) /api/get?artist_name&track_name&duration   (paling akurat)
 2) /api/search?q=<artis judul>                (fallback, ambil durasi terdekat)
 3) { lyrics: null }
```

Bandingkan: lirik `comiku.my.id/search/lyrics` (yang juga memakai lrclib) saat saya uji
mengembalikan `HTTP 503` — jadi **panggil LRCLIB langsung** dengan timeout + cache,
jangan lewat perantara.

### 3.5 Pencarian: siapkan fallback
`yt-search` juga **scraping tidak resmi**; kadang kosong/timeout.
Fallback yang sering dipakai: `yt-dlp "ytsearch10:<q>" --flat-playlist --dump-json`
(1 proses, 1–3 dtk). Simpan juga **ytimg thumbnail** (`hqdefault`, `mqdefault` untuk mobile).

### 3.6 Packaging
`@ffmpeg-installer/ffmpeg` sudah lama tidak dirawat; `ffmpeg-static` lebih terawat
dan lebih pasti tersedia. Dan untuk m4a/webm **ffmpeg tidak dibutuhkan** kalau tidak
ada konversi — kecuali mau normalisasi ke mp3/aac (tambah CPU).

### 3.7 Keamanan tambahan (dokumen sudah bagus, tambah ini)
- **Rate limit per IP** (mis. 30 req/menit, 5 stream/menit) — `/api/stream` tanpa batas = **open proxy**.
- **Token statis** (`?k=`) atau header `X-Api-Key` untuk `/api/stream` bila server publik.
- **`--no-playlist`**, `--max-filesize 60M`, `--socket-timeout 15`, `--retries 2`.
- **Jangan log id mentah + cookie**; scrub log.
- **Batas konkuren 3** bagus, tambahkan **antrean dengan timeout** (klien menunggu > 20 s → 503 JSON).
- **Zombie guard**: `child.kill('SIGKILL')` setelah SIGTERM gagal + `req.on('close')`.
- **CORS** `*` hanya untuk versi pribadi. Untuk publik, batasi origin ke domain Vibe Music.

### 3.8 Hosting (batasan nyata)
| Opsi | Bisa? | Catatan |
| --- | --- | --- |
| **Vercel serverless** | ❌ | tidak boleh spawn binary/proses panjang, filesystem read-only, limit durasi |
| **Railway / Fly / Render / Koyeb** (container) | ✅ | perlu Docker berisi python3 + yt-dlp + ffmpeg; IP datacenter → rawan bot-check |
| **VPS kecil (Hetzner ~€4)** | ✅ | kendali penuh; tetap IP datacenter |
| **PC rumah + Cloudflare Tunnel** | ✅ **paling stabil** | **IP residensial** → paling jarang kena bot-check; tapi harus nyala |

---

## 4. Tabel keputusan: mana yang menyelesaikan apa

| Kebutuhan | Backend dokumen ini (yt-dlp) | Audius (legal) | Spotify Premium Connect | Pratinjau Deezer/iTunes |
| --- | --- | --- | --- | --- |
| Lagu mainstream penuh | ✅ (semua lagu) | ❌ | ✅ (katalog Spotify) | ❌ 30 dtk |
| Legal & bisa publik | ❌ | ✅ | ✅ (patuh policy) | ✅ |
| Bisa di Vercel | ❌ | ✅ | ✅ | ✅ (via proxy) |
| Butuh akun user | ❌ | ❌ | ✅ Premium | ❌ |
| Stabil 12 bulan | ❌ rapuh | ✅ | ✅ | ✅ |
| Biaya | bandwidth | 0 | 0 (kuota user) | 0 |
| Untuk APK rilis Play Store | ❌ ditolak | ✅ | ✅ | ✅ |

---

## 5. Sikap saya (jujur, dan konsisten dengan jawaban sebelumnya)

**Saya tidak akan menulis jalur ekstraksi YouTube (yt-dlp/yt-search) itu sendiri.**
Alasannya bukan "tidak mampu", tapi:
1. Melanggar Ketentuan Layanan YouTube — **dokumenmu sendiri mengatakannya di §8**.
2. Mendistribusikan audio berhak cipta (bukan hanya metadata), termasuk untuk lagu
   yang jelas bukan milik kita.
3. Hasilnya **bukan solusi**, hanya penunda: SABR/PO-token/bot-check akan merusaknya
   berkala, dan makin sering seiring waktu.
4. Membuat aplikasi yang cantik tapi tidak bisa dipublikasikan/monetisasi = kerja yang
   akhirnya dibuang.

**Yang saya bisa kerjakan (dan menyelesaikan 80% masalahmu):**

| # | Pekerjaan | Hasil |
| --- | --- | --- |
| A | **Backend legal dengan kontrak IDENTIK** (`/api/search`, `/api/stream/:id`, `/api/lirik`, `/api/health`) — sumber: **Audius** (lagu penuh, CORS `*`, resmi) + **LRCLIB** (lirik + synced) + **Deezer/iTunes** (pratinjau) | UI yang sama, backend bisa ditukar |
| B | **"Bring Your Own Backend" (BYOB)** di Vibe Music: isi URL backend di Pengaturan/`.env`. Kalau **kamu** menjalankan backend yt-dlp versi sendiri di PC/VPS untuk pemakaian pribadi, Vibe Music langsung memakainya — tanpa saya menulis jalur ekstraksinya | Keputusan & infrastruktur tetap di tanganmu |
| C | **"Vibe Connect"**: tombol "Hubungkan Spotify Premium" → playback penuh legal via Web Playback SDK untuk akunmu | Rasanya **paling mirip Spotify**, aman publik |
| D | **Adapter pattern** di kode: `MusicProvider { search, streamUrl, lyrics }` → Audius / BYOB / Connect hidup berdampingan, dipilih di Pengaturan | Tidak ada vendor lock-in |

Dengan A+B+C+D, kamu bisa: **pakai Audius untuk publik**, **BYOB untuk dirimu sendiri**,
dan **Connect** kalau mau katalog mainstream legal. Tidak ada yang perlu dibuang
saat aturan berubah.

---

## 6. Kalau kamu tetap ingin backend yt-dlp

Itu keputusanmu di infrastrukturmu, dan saya tidak akan menghalangi. Supaya tidak
menemukan masalah yang sama, lakukan ini sejak awal (semua di luar kode saya):

1. Pakai **Docker** (`python3` + `yt-dlp` + `ffmpeg`) di Railway/Fly/VPS.
2. `/api/stream` → **resolve URL** (`-g`) + proxy `Range`, bukan pipe `-o -` (§3.2).
3. Tambah `--extractor-args "youtube:player_client=tv,android_vr"` dan **PO-token provider**
   (`bgutil-ytdlp-pot-provider`) sejak Tahap 1, bukan saat error muncul.
4. Ganti lirik ke **LRCLIB** (§3.4).
5. Tambah rate limit + token akses sebelum server dibuka ke internet (§3.7).
6. **Cron harian** `yt-dlp -U` + `/api/health` alert (mis. ping ke Telegram-mu) — karena
   pasti akan rusak berkala.
7. Jangan pernah menaruh server ini di APK yang dipublikasikan; untuk publik gunakan Audius/Connect.

---

## 7. Rekomendasi akhir

- **Untuk sekarang (demo & portofolio, bisa dipakai siapa pun):** jalur **A (Audius + LRCLIB)**.
  Ini yang membuat Vibe Music "hidup" tanpa risiko.
- **Untuk kamu pribadi (katalog lengkap):** jalur **B (BYOB)** — backend-mu, aturanmu.
- **Kalau mau benar-benar "seperti Spotify" secara legal:** jalur **C (Spotify Premium Connect)**,
  dan itu bisa saya kerjakan penuh karena memakai SDK resmi mereka.
- **Jangan** menjadikan yt-dlp fondasi produk publik. Itu akan menghabiskan waktumu
  untuk perbaikan berulang, bukan membangun fitur.
