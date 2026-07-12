# Deploy AMAN365 (Search_engine) ke aaPanel (Linux)

Panduan deploy mesin pencari ini ke server **aaPanel Linux**. Arsitektur produksi:

```
[ Browser ] ──HTTPS──> [ Nginx (aaPanel) ] ──proxy──> [ Node/Express :4000 ]
                                                            │  serve dist/ + API
                                                            └──> [ Meilisearch :7700 (lokal) ]
```

Satu proses Node (Express) menyajikan frontend hasil build (`dist/`) **dan** API di
port `4000`. Meilisearch jalan terpisah di `127.0.0.1:7700` (tidak diekspos publik).

---

## A. Setup pertama kali (sekali saja)

### 1. Siapkan Node.js & PM2
Di aaPanel: **App Store → PM2 Manager** (atau **Node.js version manager**), pasang
Node.js **>= 18**. Lalu di terminal (SSH):

```bash
node -v            # pastikan >= 18
npm i -g pm2       # kalau belum ada
```

### 2. Clone repo
Simpan project di folder web aaPanel, mis. `/www/wwwroot/`:

```bash
cd /www/wwwroot
git clone https://github.com/JefryLim22/Search_engine.git
cd Search_engine
```

> Repo privat? Pakai Personal Access Token:
> `git clone https://<TOKEN>@github.com/JefryLim22/Search_engine.git`

### 3. Pasang Meilisearch
```bash
sudo bash scripts/setup-meilisearch.sh          # unduh binary Linux ke /usr/local/bin
sudo cp scripts/meilisearch.service /etc/systemd/system/
sudo nano /etc/systemd/system/meilisearch.service   # isi MEILI_MASTER_KEY (acak & panjang)
sudo systemctl daemon-reload
sudo systemctl enable --now meilisearch
curl http://127.0.0.1:7700/health                # -> {"status":"available"}
```

Generate master key acak: `openssl rand -hex 16`

### 4. Buat file `.env` produksi
```bash
cp .env.production.example .env
nano .env
```
Isi yang **wajib**:
- `MEILI_MASTER_KEY` → **sama persis** dengan yang di service Meilisearch (langkah 3).
- `JWT_SECRET` → `openssl rand -hex 32`
- `CORS_ORIGIN` → **kosongkan** (sama-origin) atau isi domain publik Anda.
- Admin: kosongkan `ADMIN_PASSWORD`, isi `ADMIN_PASSWORD_HASH` (lihat di bawah).

**Generate bcrypt hash password admin** (dependency `bcryptjs` sudah terpasang):
```bash
node -e "console.log(require('bcryptjs').hashSync(process.argv[1],10))" 'PasswordAdminAnda'
```
Tempel hasilnya ke `ADMIN_PASSWORD_HASH=` di `.env`.

### 5. Deploy pertama
```bash
bash deploy.sh
```
Skrip akan: `git pull → npm ci → npm run build → pm2 start`. Setelah selesai:
```bash
pm2 startup        # ikuti perintah yang ditampilkan agar PM2 auto-start saat reboot
pm2 save
curl http://127.0.0.1:4000/api/health    # -> {"ok":true}
```

### 6. Reverse proxy + domain (aaPanel)
1. **Website → Add site**, isi domain Anda (root document bebas, tidak dipakai).
2. Buka site → **Reverse proxy → Add**:
   - Target URL: `http://127.0.0.1:4000`
   - Send domain: `$host`
3. **SSL**: aktifkan Let's Encrypt untuk domain tersebut.

Selesai — buka `https://domain-anda.com`. Admin: `https://domain-anda.com/admin`.

---

## B. Update rutin (setiap ada perubahan kode)

Cukup satu perintah dari dalam folder project:

```bash
cd /www/wwwroot/Search_engine
bash deploy.sh
```

Itu menarik commit terbaru dari `main`, install ulang dependency bila berubah,
build ulang frontend, dan me-restart proses PM2. Data crawl (di Meilisearch) tetap aman.

---

## C. Perintah berguna

| Tujuan | Perintah |
|---|---|
| Lihat status proses | `pm2 status` |
| Lihat log aplikasi | `pm2 logs aman365` |
| Restart manual | `pm2 restart aman365` |
| Status Meilisearch | `systemctl status meilisearch` |
| Log Meilisearch | `journalctl -u meilisearch -f` |
| Cek API | `curl http://127.0.0.1:4000/api/health` |

---

## D. Catatan keamanan

- **Meilisearch jangan diekspos publik.** Service ini `bind` ke `127.0.0.1` saja.
  Jangan buka port `7700` di firewall.
- Ganti **semua** nilai default (`MEILI_MASTER_KEY`, `JWT_SECRET`, password admin).
- Crawler menghormati `robots.txt` — hanya crawl situs yang boleh Anda akses.
