# API musik, iklan, dan pertanyaan umum

Dokumen ini menjawab pertanyaan yang paling sering muncul soal Vibe Music:
**apakah ada API musik? ada iklan? perlu tambah API sendiri? dan apa saja yang
harus disiapkan kalau mau naik dari demo ke produk nyata.**

---

## 1. Jawaban singkat

| Pertanyaan | Jawaban |
| --- | --- |
| Ada API musik? | **Tidak ada.** Saat ini tidak ada backend dan tidak ada API pihak ketiga. Katalog bersifat data lokal (`src/data/catalog.ts`) dan audionya **disintesis di perangkat** lewat Web Audio API. |
| Ada iklan saat memutar lagu? | **Tidak ada iklan sama sekali** — juga tidak ada tracker/analytics/pixel pihak ketiga. |
| Perlu menambahkan API musik sendiri? | **Ya, kalau ingin musik sungguhan.** Untuk demo/portofolio, mesin generatif sudah cukup. Untuk produksi, kamu butuh sumber audio legal (atau katalog sendiri). |
| Apakah harus bayar? | Tidak untuk demo. Untuk streaming nyata: ada opsi gratis berlisensi CC (Jamendo, Audius, FMA) sampai lisensi komersial (butuh kontrak dengan label/publisher). |
| Apakah bisa dipakai offline? | Shell aplikasi & UI: **ya** (service worker). Audio saat ini: ya, karena dibangkitkan lokal. Kalau pakai file audio nyata, offline butuh cache khusus (lihat §7). |

---

## 2. Bagaimana audio bekerja sekarang

Ada satu mesin di `src/audio/engine.ts`:

1. Setiap lagu punya properti `mood` di katalog: `bpm`, `root` (MIDI), `scale`
   (`minor|major|dorian|pentatonic`), `density`, `warmth`, `texture`
   (`pad|pluck|keys|pulse`), dan `drums`.
2. Penjadwal *look-ahead* (~180 ms) membangun progresi 4 akor, bass, arpeggio,
   kick/snare/hi-hat, lalu mengirimnya ke bus dry + reverb konvolusi yang dibuat
   saat runtime.
3. Hasilnya: setiap lagu terdengar konsisten satu sama lain, tidak butuh file
   audio, dan **tidak ada masalah hak cipta**.

Titik sambung untuk audio nyata sudah ada di `PlayerProvider`:
kalau sebuah track punya `audioUrl`, aplikasi memutar file itu lewat elemen
`<audio>` dan mesin generatif otomatis diam.

---

## 3. Kenapa tidak memakai API Spotify?

Karena secara aturan **tidak boleh**, bukan karena teknisnya sulit:

- Spotify **Web API** hanya memberi metadata, pencarian, playlist, dan (sebagian)
  preview 30 detik. Streaming lagu penuh hanya lewat **Web Playback SDK**, dan itu
  wajib login user **Premium** serta audio mengalir di dalam SDK resmi mereka —
  tidak bisa dipakai untuk "Spotify versi lain".
- **Spotify Developer Terms/Policy** melarang membangun layanan yang meniru atau
  menggantikan pengalaman Spotify, menyimpan/mengunduh konten, dan menyembunyikan
  atribusi. Audio Spotify juga terenkripsi (Widevine) sehingga tidak bisa di-stream
  langsung dari `<audio>`.
- Menyalin UI + katalog + audio = pelanggaran hak cipta dan merek. Karena itu
  proyek ini adalah **implementasi orisinal** dengan katalog fiktif.

Yang **boleh** (dan umum): memakai Spotify API hanya untuk fitur pelengkap
(impor playlist user, "share to Spotify", menampilkan tautan) dengan atribusi dan
branding sesuai panduan mereka.

---

## 4. Opsi sumber musik legal

Pilih sesuai kebutuhan:

| Sumber | Model | Cocok untuk | Catatan |
| --- | --- | --- | --- |
| **Katalog sendiri** (upload musisi, label indie) | lisensi langsung | produk komersial | paling fleksibel & aman; butuh storage + CDN + HLS + kontrak |
| **Jamendo API** | Creative Commons | streaming gratis | banyak trek CC, API key gratis, wajib atribusi sesuai lisensi tiap trek |
| **Audius API** | desentralisasi | eksperimen cepat | API publik, isi di-host node Audius |
| **Free Music Archive / ccMixter / Internet Archive** | CC | demo, radio genre | kualitas & metadata bervariasi |
| **Uppbeat / Pixabay Music** | bebas royalti | background/creator app | baca batas pemakaian & atribusi |
| **MusicBrainz + Cover Art Archive** | metadata CC0/CC | melengkapi metadata | bukan sumber audio |
| **Deezer / Apple Music / TIDAL** | katalog berlisensi | integrasi resmi | butuh partner agreement; tidak bisa dipakai sembarang aplikasi |
| **Navidrome / Subsonic / Jellyfin** (self-host) | pustaka pribadi | pemakaian pribadi/keluarga | legal untuk koleksi milik sendiri; bukan untuk layanan publik |
| **Label/distributor** (mis. Believe, Symphonic, DistroKid untuk rilis sendiri) | kontrak | naik ke publik | perlu perjanjian distribusi & royalti |

Di Indonesia, untuk **pertunjukan publik/komersial** ada kewajiban lisensi melalui
**LMKN/LMKN-LK** (mis. WAMI, KCI, SELMI, ARDI) di sisi *public performance*.
Untuk *on-demand streaming* kamu tetap butuh lisensi dari pemegang hak (label/
publisher) — LMKN tidak otomatis memberi izin streaming digital.

> Ringkas: **tidak ada API musik "gratis legal untuk semua lagu populer"**.
> Yang ada: API untuk katalog berlisensi terbuka, atau lisensi langsung.

---

## 5. Cara menyambungkan API musik ke Vibe Music

### 5.1 Jalur tercepat (per-track URL)

Tambahkan `audioUrl` pada track di `src/data/catalog.ts`:

```ts
{
  id: "t01",
  title: "Cahaya Kecil",
  // …
  audioUrl: "https://cdn.example.com/tracks/cahaya-kecil.m4a",
}
```

`PlayerProvider` akan otomatis memakai `<audio>` untuk track tersebut (seek,
volume, Media Session, dan repeat-one sudah ditangani).

### 5.2 Jalur yang benar untuk produksi (adapter + backend)

Jangan pernah menaruh **client secret** di frontend. Pola yang aman:

```
Browser ──▶ /api/search, /api/stream/:id  (serverless/Node)  ──▶ provider
                                              │
                                              └─ menyimpan API key, menandatangani URL
```

Contoh tipis yang bisa langsung dipakai (mis. di Vercel/Cloudflare Function):

```ts
// api/search.ts — server-side saja
export default async function handler(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const upstream = await fetch(
    `https://api.jamendo.com/v3.0/tracks/?client_id=${process.env.JAMENDO_ID}&format=json&limit=20&search=${encodeURIComponent(q)}`,
  );
  if (!upstream.ok) return new Response("upstream error", { status: 502 });
  // normalkan ke bentuk internal Vibe Music
  const data = await upstream.json();
  return Response.json(
    data.results.map((t: any) => ({
      id: t.id,
      title: t.name,
      artist: t.artist_name,
      audioUrl: t.audio,          // URL stream legal dari provider
      artwork: t.image,
      duration: t.duration,
      license: t.license_ccurl,   // tampilkan atribusi!
    })),
  );
}
```

Lalu di klien, buat satu modul `src/data/source.ts` yang memetakan hasil API ke
tipe `Track` (tambahkan field `audioUrl`, `artworkUrl`, `license`), dan ganti
`catalog.ts` sebagai satu-satunya sumber daftar lagu. Struktur store/player tidak
perlu diubah.

### 5.3 Checklist teknis saat menyambungkan

- **CORS**: server/CDN harus mengizinkan `Range` request. Kalau tidak, seek akan rusak.
- **Range & byte serving**: wajib untuk `<audio>` (206 Partial Content).
- **HLS/DASH**: Safari bisa HLS native; Chrome/Edge butuh `hls.js`. Untuk 1 file
  per lagu (m4a/mp3) tidak perlu HLS — lebih murah dan sederhana.
- **Token & URL**: pakai signed URL berumur pendek supaya tautan audio tidak bisa
  dibagikan/di-hotlink.
- **Rate limit & cache**: cache hasil pencarian (mis. 60 s) di edge; batasi per IP.
- **Atribusi lisensi**: kalau CC, tampilkan judul, artis, sumber, dan tautan lisensi
  (bisa di halaman Now Playing → Info lagu).
- **Analitik**: kalau pakai, gunakan yang privacy-first (Plausible/Umami) dan
  sebutkan di kebijakan privasi.

---

## 6. Iklan & monetisasi

Saat ini **nol iklan, nol tracker**. Kalau nanti ingin monetisasi, ini urutannya
dari paling aman ke paling berisiko:

1. **Sponsor/kartu promo non-audio** — mis. kartu "Didukung oleh …" di Beranda
   atau di panel antrean. Tidak mengganggu playback, tidak butuh izin khusus.
2. **Donasi/membership** (Saweria, Ko-fi, Stripe) — fitur ekstra: tanpa iklan,
   kualitas lebih tinggi, playlist offline.
3. **Audio ad untuk konten milik sendiri** — hanya jika seluruh audio adalah milik
   kamu/lisensi yang mengizinkan penyisipan iklan.
4. **Jaringan iklan audio (DAI)** — butuh kontrak, dan **dilarang** disisipkan pada
   konten berlisensi pihak lain tanpa izin.
5. **AdSense/display** — boleh di halaman web, tapi kebijakan Google membatasi
   penempatan iklan pada pemutar audio (jangan menutupi kontrol, jangan auto-play
   bersamaan dengan iklan audio).

Yang **jangan** dilakukan: menaruh pre-roll/iklan di atas stream katalog berlisensi
tanpa izin, atau menjual akses ke katalog yang bukan milikmu.

---

## 7. Pertanyaan lain yang kemungkinan muncul

**Apakah PWA bisa memutar audio saat layar mati?**
Di Android/desktop: ya, lewat Media Session (sudah diimplementasikan: metadata +
play/pause/next/prev/seek). Di iOS Safari, background audio PWA punya batasan dan
kadang terhenti saat tab ditutup; pengalaman paling stabil tetap aplikasi native
atau Safari dengan tab aktif.

**Bisakah audio asli di-cache untuk offline?**
Bisa, tapi hati-hati: Cache API punya kuota per-origin (puluhan MB sampai beberapa
GB tergantung browser/izin storage). Pola yang dipakai aplikasi musik: unduh
eksplisit per playlist ke IndexedDB/Cache Storage + tampilkan ukuran & tombol hapus.
Jangan meng-cache seluruh katalog otomatis.

**Bagaimana lisensi konten UGC/generated?**
Mesin audio saat ini membangkitkan suara dari nol (tidak menyalin rekaman), jadi
aman. Kalau nanti memakai sampel, pastikan sampelnya berlisensi.

**Lirik?**
Bisa pakai **LRCLIB** (dompet lirik komunitas) atau layanan berbayar seperti
Musixmatch. Tampilan lirik sinkron cocok ditaruh di tab "Info lagu" pada Now Playing.

**Pencarian skala besar?**
Sekarang pencarian di memori katalog. Kalau katalog ribuan/ jutaan trek: Meilisearch,
Typesense, atau Algolia; index di server, klien hanya memanggil endpoint.

**Login & sinkronisasi antar perangkat?**
Tambah auth (Supabase/Auth.js/ Clerk) lalu pindahkan `likedTracks`, `playlists`,
`followedArtists` dari `localStorage` ke database (Postgres + Supabase RLS), dengan
sinkronisasi optimistik. `PlayerProvider` tidak perlu diubah.

**Deploy di mana?**
Frontend statis: Vercel/Netlify/Cloudflare Pages. API key & proxy: serverless function
di platform yang sama. Audio: Cloudflare R2 / S3 + CDN (egress murah, dukung Range).

**Bagaimana memperbarui PWA saat rilis baru?**
`public/sw.js` memakai versi cache (`VIBE_MUSIC-v1`). Naikkan versi saat rilis besar,
lalu tampilkan toast "Versi baru tersedia — muat ulang" dengan `registration.update()`.

**Privasi & kepatuhan**
Saat ini semua data (like, playlist, pengaturan) hanya di `localStorage` perangkat.
Kalau menambah analitik/akun, siapkan kebijakan privasi dan patuhi **UU PDP** (Indonesia)
/ GDPR: tujuan pemrosesan, dasar hukum, hak hapus data, dan retensi.

**Biaya kasar**
- Demo ini: gratis (static hosting).
- Katalog kecil (jam-jaman audio) di R2 + CDN: beberapa dolar/bulan.
- Yang mahal bukan hosting, tapi **lisensi musik** dan bandwidth kalau sudah ramai.

---

## 8. Rekomendasi jalur

1. **Sekarang** — biarkan demo memakai mesin generatif. Nol biaya, nol risiko hukum,
   dan menunjukkan semua fitur player.
2. **Eksperimen** — sambungkan Jamendo (CC) lewat satu endpoint proxy untuk melihat
   alur API → katalog → player berjalan dengan audio asli.
3. **Naik kelas** — kumpulkan katalog sendiri (musisi indie / rilisan sendiri), simpan
   di R2 sebagai m4a + Range, tambah auth + database untuk like/playlist.
4. **Monetisasi** — mulai dari sponsor kartu/membership sebelum menyentuh iklan audio.

Kalau kamu mau, langkah 2 bisa saya bantu implementasikan (adapter Jamendo + endpoint
proxy + atribusi lisensi di UI) tanpa mengubah store player yang sudah ada.
