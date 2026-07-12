// PM2 process definition untuk AMAN365 (Search_engine).
// Jalankan: pm2 start ecosystem.config.cjs
//
// Hanya mendefinisikan proses aplikasi Node (Express serve dist/ + API).
// Meilisearch dijalankan terpisah (systemd service ATAU proses PM2 sendiri —
// lihat DEPLOY_AAPANEL.md). Aktifkan blok 'meilisearch' di bawah bila mau
// dikelola PM2 juga.
module.exports = {
  apps: [
    {
      name: 'aman365',
      script: 'server/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
      },
      // .env dibaca oleh aplikasi via dotenv (server/config.js),
      // jadi tidak perlu duplikasi semua variabel di sini.
    },

    // --- Opsional: kelola Meilisearch lewat PM2 (alternatif systemd) ---
    // Hapus komentar blok ini jika TIDAK memakai systemd service.
    // {
    //   name: 'meilisearch',
    //   script: '/usr/local/bin/meilisearch',
    //   args: '--db-path /www/meili_data/data.ms --env production',
    //   cwd: '/www/meili_data',
    //   autorestart: true,
    //   env: {
    //     MEILI_MASTER_KEY: 'GANTI-DENGAN-KEY-PANJANG-ACAK',
    //     MEILI_ENV: 'production',
    //     MEILI_HTTP_ADDR: '127.0.0.1:7700',
    //   },
    // },
  ],
};
