const BASE = '/api';

async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      /* non-json error */
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

// Bangun URL WhatsApp dari nomor + pesan opsional. Kosong bila nomor kosong.
export function waLink(number, message = '') {
  const n = String(number || '').replace(/[^\d]/g, '');
  if (!n) return '';
  const q = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${n}${q}`;
}

// Bangun URL Telegram dari username (tanpa "@"). Kosong bila username kosong.
export function tgLink(username) {
  const u = String(username || '')
    .trim()
    .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '')
    .replace(/^@/, '')
    .replace(/\s+/g, '');
  return u ? `https://t.me/${u}` : '';
}

// Bangun URL akhir dari satu objek kontak dinamis { type, value, message }.
// Kosong bila nilainya tidak valid — pemanggil menyembunyikan tombolnya.
export function contactHref(c) {
  if (!c) return '';
  switch (c.type) {
    case 'whatsapp':
      return waLink(c.value, c.message);
    case 'telegram':
      return tgLink(c.value);
    case 'link':
      return /^https?:\/\//i.test(c.value || '') ? c.value : '';
    default:
      return '';
  }
}

export const api = {
  // public web search — situs ditentukan server dari subdomain (Host header)
  search: (params) => req(`/search?${new URLSearchParams(params)}`),

  // identitas situs + kontak publik untuk homepage
  settings: () => req('/settings'),

  // Endpoint admin bersifat per-situs: semua menerima `site` (cari/beer).
  sites: () => req('/admin/sites'),
  adminSettings: (site) => req(`/admin/settings?site=${site}`),
  updateSettings: (site, body) =>
    req(`/admin/settings?site=${site}`, { method: 'PUT', body: JSON.stringify(body) }),

  // auth (satu login untuk semua situs)
  login: (body) => req('/admin/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => req('/admin/logout', { method: 'POST' }),
  me: () => req('/admin/me'),
  stats: (site) => req(`/admin/stats?site=${site}`),

  // crawl control
  startCrawl: (site, body) =>
    req(`/admin/crawl?site=${site}`, { method: 'POST', body: JSON.stringify(body) }),
  crawlStatus: (site) => req(`/admin/crawl/status?site=${site}`),
  stopCrawl: (site) => req(`/admin/crawl/stop?site=${site}`, { method: 'POST' }),

  // indexed pages
  pages: (site, params) => req(`/admin/pages?${new URLSearchParams({ ...params, site })}`),
  deletePage: (site, id) => req(`/admin/pages/${id}?site=${site}`, { method: 'DELETE' }),
  clearPages: (site) => req(`/admin/pages?site=${site}`, { method: 'DELETE' }),
};
