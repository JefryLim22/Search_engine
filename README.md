# AMAN365 — mesin pencari web mandiri

Mesin pencari web (ala Google versi kecil) yang berdiri sendiri:
**crawler + indexer + halaman hasil (SERP) + panel admin**.

Stack: **Vite + React + Express + Meilisearch**.

- **Crawler**: merayapi halaman dari URL awal (seed), mengikuti link,
  **menghormati robots.txt**, sopan (rate-limit + User-Agent jelas), batas
  jumlah halaman & kedalaman.
- **Indexer**: judul, deskripsi, konten, host tersimpan di Meilisearch.
- **SERP**: halaman hasil ala Google — judul, URL, snippet dengan highlight.
- **Panel admin**: kontrol crawl (mulai/stop + progress live), kelola halaman
  terindeks.

> ⚠️ **Gunakan dengan bertanggung jawab.** Hanya crawl situs yang boleh kamu
> akses. Crawler mematuhi `robots.txt` dan membatasi laju permintaan. Jangan
> pakai untuk membebani server orang lain atau mengakses sistem tanpa izin.

## Prasyarat

- Node.js >= 18 (fetch global; diuji di Node 24)
- Meilisearch

## 1. Jalankan Meilisearch

**Docker:**

```bash
docker compose up -d
```

**Atau binary (Windows):** unduh `meilisearch.exe` lalu:

```bash
./meilisearch.exe --master-key "dev-local-master-key-change-me-123456" --env development
```

## 2. Konfigurasi & install

```bash
cp .env.example .env      # samakan MEILI_MASTER_KEY dengan yang dipakai Meilisearch
npm install
```

## 3. Jalankan (dev)

```bash
npm run dev
```

- Pencarian: http://localhost:5173
- Admin:     http://localhost:5173/admin  (login `admin` / `admin123`)
- API:       http://localhost:4000

## 4. Isi index

Buka **Admin → Crawl**, masukkan satu/lebih URL awal, atur jumlah halaman &
kedalaman, klik **Mulai Crawl**. Pantau progress live, lalu cari hasilnya di
halaman utama.

## API singkat

| Method | Endpoint | Keterangan |
|---|---|---|
| GET  | `/api/search?q=` | Pencarian publik |
| POST | `/api/admin/login` | Login admin |
| POST | `/api/admin/crawl` | Mulai crawl `{ seeds, maxPages, maxDepth, sameHostOnly, delayMs }` |
| GET  | `/api/admin/crawl/status` | Status crawl (live) |
| POST | `/api/admin/crawl/stop` | Hentikan crawl |
| GET  | `/api/admin/pages` | Daftar halaman terindeks |
| DELETE | `/api/admin/pages/:id` · `/api/admin/pages` | Hapus satu / kosongkan |

## Build produksi

```bash
npm run build     # -> dist/
npm start         # Express menyajikan dist/ + API
```

## Batasan (versi mini)

- Ranking pakai relevansi bawaan Meilisearch (belum ada PageRank).
- Crawl satu job dalam satu waktu, state di memori (reset saat server restart).
- Render JavaScript sisi klien tidak dieksekusi (hanya HTML mentah).

## Struktur

```
server/
  crawler.js        crawler + robots.txt + ekstraksi halaman
  routes/           search (publik), admin (auth), crawl (kontrol + pages)
  meili.js          index "pages" + settings
src/
  pages/Search.jsx  SERP ala Google
  pages/admin/      Dashboard, Crawl, Pages
```
