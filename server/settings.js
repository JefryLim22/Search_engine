import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'settings.json');

// Jenis kontak yang didukung. Admin membuat kontak sendiri (label bebas) dan
// memilih salah satu jenis ini; kita hanya menyediakan wadahnya.
export const CONTACT_TYPES = ['whatsapp', 'telegram', 'link'];

// Batas jumlah kontak agar file settings & tampilan tidak membludak.
const MAX_CONTACTS = 20;

// Struktur baru: satu daftar kontak dinamis. Tiap kontak:
//   { id, type: 'whatsapp'|'telegram'|'link', label, value, message }
// - whatsapp: value = nomor (digit saja), message = teks otomatis (opsional)
// - telegram: value = username (tanpa "@")
// - link:     value = URL lengkap (http/https)
const DEFAULTS = {
  contacts: [],
};

function newId() {
  return crypto.randomBytes(6).toString('hex');
}

function readRaw() {
  try {
    const txt = fs.readFileSync(FILE, 'utf8');
    return JSON.parse(txt);
  } catch {
    return {};
  }
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

// Migrasi struktur lama (field WA CS 1/2, Telegram, Live Chat) ke daftar kontak.
// Dipakai sekali saat file settings masih format lama; hasilnya langsung ditulis
// ulang ke format baru oleh caller.
function migrateLegacy(raw) {
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

// Ambil settings lengkap (default + tersimpan) dalam format baru. Bila file
// masih format lama, otomatis dimigrasi ke daftar kontak.
export function getSettings() {
  const raw = readRaw();
  if (Array.isArray(raw.contacts)) {
    const contacts = raw.contacts.map(sanitizeContact).filter(Boolean).slice(0, MAX_CONTACTS);
    return { ...DEFAULTS, contacts };
  }
  // Format lama → migrasi.
  return { ...DEFAULTS, contacts: migrateLegacy(raw) };
}

// Simpan daftar kontak. Menerima { contacts: [...] } dan mengabaikan input lain.
// Mengembalikan settings final setelah disimpan.
export function saveSettings(patch = {}) {
  const current = getSettings();
  const next = { ...current };

  if (Array.isArray(patch.contacts)) {
    next.contacts = patch.contacts
      .map(sanitizeContact)
      .filter(Boolean)
      .slice(0, MAX_CONTACTS);
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(next, null, 2), 'utf8');
  return next;
}
