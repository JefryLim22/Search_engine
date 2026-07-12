#!/usr/bin/env bash
#
# deploy.sh — Deploy / update AMAN365 (Search_engine) di server aaPanel Linux.
#
# Alur: git pull -> npm install -> vite build -> restart PM2.
# Jalankan dari dalam folder project:  bash deploy.sh
#
# Prasyarat (lihat DEPLOY_AAPANEL.md untuk setup pertama kali):
#   - Node.js >= 18  (aaPanel: PM2 Manager / Node Project, atau nvm)
#   - PM2 terpasang global   (npm i -g pm2)
#   - Meilisearch sudah jalan (lihat scripts/meilisearch.service atau PM2)
#   - File .env produksi sudah ada di folder project
#
set -euo pipefail

# --- Selalu jalan relatif terhadap lokasi skrip ini ---
cd "$(dirname "$0")"

APP_NAME="aman365"
BRANCH="${DEPLOY_BRANCH:-main}"

echo "==> [1/5] Menarik kode terbaru dari branch '$BRANCH'..."
git fetch --all --prune
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> [2/5] Cek file .env..."
if [ ! -f .env ]; then
  echo "!! .env tidak ditemukan. Salin dari .env.production.example dan sesuaikan dulu:" >&2
  echo "   cp .env.production.example .env && nano .env" >&2
  exit 1
fi

echo "==> [3/5] Install dependencies (npm ci bila lockfile cocok, jika gagal fallback ke npm install)..."
if [ -f package-lock.json ]; then
  npm ci || npm install
else
  npm install
fi

echo "==> [4/5] Build frontend (vite -> dist/)..."
npm run build

echo "==> [5/5] Restart aplikasi via PM2..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env
else
  # Pertama kali: start pakai ecosystem config
  pm2 start ecosystem.config.cjs
fi
pm2 save

echo ""
echo "==> Selesai. Status proses:"
pm2 status
echo ""
echo "Cek kesehatan API:  curl -s http://127.0.0.1:${PORT:-4000}/api/health"
