import { config } from './config.js';

// Registry situs (multi-tenant). Satu app + satu panel melayani banyak
// subdomain; tiap situs punya index Meilisearch, settings, dan crawler sendiri.
// Menambah situs baru = tambah entri di sini + arahkan subdomain ke server ini.
export const SITES = {
  cari: {
    id: 'cari',
    name: 'AMAN365', // nama brand default (bisa diganti admin di Pengaturan)
    hosts: ['cari.aman365.id'],
    index: config.meiliIndex, // 'pages' — index lama, data cari tetap utuh
    // Saran keyword bawaan agar perilaku homepage cari tidak berubah
    // sebelum admin menyimpan pengaturan sendiri.
    defaultRecommended: [
      'AZGAMING388',
      'AZGAMING388 login',
      'AZGAMING388 daftar',
      'AZGAMING388 link alternatif',
      'AZGAMING388 rtp',
    ],
  },
  beer: {
    id: 'beer',
    name: 'BEER365',
    hosts: ['beer.aman365.id'],
    index: `${config.meiliIndex}_beer`,
    defaultRecommended: [],
  },
};

export const SITE_IDS = Object.keys(SITES);
export const DEFAULT_SITE = 'cari';

const hostMap = new Map();
for (const site of Object.values(SITES)) {
  for (const h of site.hosts) hostMap.set(h.toLowerCase(), site.id);
}

export function getSite(id) {
  return SITES[id] || SITES[DEFAULT_SITE];
}

// Tentukan situs dari request. Prioritas: ?site= eksplisit (untuk panel admin
// dan dev), lalu Host header (subdomain publik yang diakses pengunjung).
// Mengembalikan null bila ?site= diisi tapi tidak dikenal — biar route bisa
// menolak dengan 400 alih-alih diam-diam memakai situs lain.
export function resolveSite(req) {
  const q = String(req.query?.site || '').trim().toLowerCase();
  if (q) return SITES[q] || null;

  const rawHost = String(
    req.headers['x-forwarded-host'] || req.headers.host || ''
  )
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '');

  return SITES[hostMap.get(rawHost) || DEFAULT_SITE];
}
