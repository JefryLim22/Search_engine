#!/usr/bin/env bash
#
# setup-meilisearch.sh — Pasang Meilisearch (binary Linux) di server aaPanel.
# Sekali jalan saat setup pertama. Butuh sudo/root.
#
#   sudo bash scripts/setup-meilisearch.sh
#
set -euo pipefail

MEILI_VERSION="v1.10"
INSTALL_BIN="/usr/local/bin/meilisearch"
DATA_DIR="/www/meili_data"

echo "==> Mengunduh Meilisearch ${MEILI_VERSION} (Linux amd64)..."
curl -L "https://github.com/meilisearch/meilisearch/releases/download/${MEILI_VERSION}/meilisearch-linux-amd64" \
  -o /tmp/meilisearch
chmod +x /tmp/meilisearch
mv /tmp/meilisearch "$INSTALL_BIN"
echo "    Terpasang di $INSTALL_BIN"
"$INSTALL_BIN" --version

echo "==> Membuat folder data: $DATA_DIR"
mkdir -p "$DATA_DIR"

echo ""
echo "Meilisearch terpasang. Langkah berikutnya (lihat DEPLOY_AAPANEL.md):"
echo "  1) Pasang service systemd:"
echo "       sudo cp scripts/meilisearch.service /etc/systemd/system/"
echo "       sudo nano /etc/systemd/system/meilisearch.service   # isi MEILI_MASTER_KEY"
echo "       sudo systemctl daemon-reload"
echo "       sudo systemctl enable --now meilisearch"
echo "  2) Cek jalan:  curl http://127.0.0.1:7700/health"
