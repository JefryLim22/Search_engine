import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { getSite, DEFAULT_SITE } from './sites.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

// Settings disimpan per situs: data/settings.cari.json, data/settings.beer.json.
// File lama data/settings.json (era satu situs) tetap dibaca sebagai milik
// situs default (cari) sampai admin menyimpan ulang.
const fileFor = (siteId) => path.join(DATA_DIR, `settings.${siteId}.json`);
const LEGACY_FILE = path.join(DATA_DIR, 'settings.json');

// Jenis kontak yang didukung. Admin membuat kontak sendiri (label bebas) dan
// memilih salah satu jenis ini; kita hanya menyediakan wadahnya.
export const CONTACT_TYPES = ['whatsapp', 'telegram', 'link'];

// Batas jumlah kontak & saran keyword agar file settings tidak membludak.
const MAX_CONTACTS = 20;
const MAX_RECOMMENDED = 10;

function newId() {
  return crypto.randomBytes(6).toString('hex');
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function readRaw(siteId) {
  const own = readJson(fileFor(siteId));
  if (own) return own;
  // Migrasi: file lama single-site menjadi milik situs default.
  if (siteId === DEFAULT_SITE) return readJson(LEGACY_FILE) || {};
  return {};
}

// Bersihkan satu kontak sesuai jenisnya. Mengembalikan objek kontak yang
// tervalidasi, atau null bila tidak valid (mis. nilai kosong / jenis tak dikenal).
function sanitizeContact(c) {
  if (!c || typeof c !== 'object') return null;
  const type = String(c.type || '').toLowerCase();
  if (!CONTACT_TYPES.includes(type)) return null;

  const label = String(c.label || '').trim().slice(0, 40);
  const id = typeof c.id === 'string' && c.id ? c.id.slice(0, 24) : newId();
  let value = String(c.value || '').trim();
  let message = '';

  if (type === 'whatsapp') {
    value = value.replace(/[^\d]/g, ''); // simpan digit saja
    message = String(c.message || '').slice(0, 300);
  } else if (type === 'telegram') {
    value = value
      .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '')
      .replace(/^@/, '')
      .replace(/\s+/g, '');
  } else if (type === 'link') {
    // Hanya terima URL http/https agar tidak ada skema berbahaya (javascript:, dll).
    if (!/^https?:\/\//i.test(value)) value = '';
  }

  if (!value) return null; // kontak tanpa nilai tidak disimpan
  return { id, type, label, value, message };
}

function sanitizeContacts(list) {
  if (!Array.isArray(list)) return [];
  return list.map(sanitizeContact).filter(Boolean).slice(0, MAX_CONTACTS);
}

// Nama brand yang tampil di homepage (logo, tombol, placeholder). Kosong ->
// pakai nama default situs dari registry.
function sanitizeBrand(raw, site) {
  const name = String(raw?.name || '').trim().slice(0, 30);
  return { name: name || site.name };
}

// Saran keyword di kotak pencarian, satu string per item.
function sanitizeRecommended(list, site) {
  if (!Array.isArray(list)) return [...(site.defaultRecommended || [])];
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const s = String(item || '').trim().slice(0, 60);
    if (!s || seen.has(s.toLowerCase())) continue;
    seen.add(s.toLowerCase());
    out.push(s);
    if (out.length >= MAX_RECOMMENDED) break;
  }
  return out;
}

// Migrasi struktur lama (field WA CS 1/2, Telegram, Live Chat) ke daftar kontak.
function migrateLegacyContacts(raw) {
  const contacts = [];
  const push = (c) => {
    const s = sanitizeContact(c);
    if (s) contacts.push(s);
  };
  if (raw.whatsappNumber) {
    push({ type: 'whatsapp', label: 'WhatsApp CS 1', value: raw.whatsappNumber, message: raw.whatsappMessage });
  }
  if (raw.whatsappNumber2) {
    push({ type: 'whatsapp', label: 'WhatsApp CS 2', value: raw.whatsappNumber2, message: raw.whatsappMessage2 });
  }
  if (raw.telegramUsername) {
    push({ type: 'telegram', label: 'Telegram', value: raw.telegramUsername });
  }
  if (raw.liveChatUrl) {
    push({ type: 'link', label: 'Live Chat', value: raw.liveChatUrl });
  }
  return contacts;
}

// Ambil settings lengkap sebuah situs (default + tersimpan).
export function getSettings(siteId) {
  const site = getSite(siteId);
  const raw = readRaw(site.id);
  const contacts = Array.isArray(raw.contacts)
    ? sanitizeContacts(raw.contacts)
    : migrateLegacyContacts(raw);
  return {
    brand: sanitizeBrand(raw.brand, site),
    recommended: sanitizeRecommended(raw.recommended, site),
    contacts,
  };
}

// Simpan settings sebuah situs. Field yang tidak dikirim tidak diubah.
export function saveSettings(siteId, patch = {}) {
  const site = getSite(siteId);
  const current = getSettings(site.id);
  const next = { ...current };

  if (Array.isArray(patch.contacts)) next.contacts = sanitizeContacts(patch.contacts);
  if (patch.brand && typeof patch.brand === 'object') {
    next.brand = sanitizeBrand(patch.brand, site);
  }
  if (Array.isArray(patch.recommended)) {
    next.recommended = sanitizeRecommended(patch.recommended, site);
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(fileFor(site.id), JSON.stringify(next, null, 2), 'utf8');
  return next;
}
