import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'settings.json');

// Nilai default dipakai bila file settings belum ada / rusak.
const DEFAULTS = {
  // WhatsApp CS 1 — nomor format internasional tanpa "+", mis. 6281234567890.
  whatsappNumber: '',
  // Teks yang otomatis terisi saat membuka chat WA CS 1.
  whatsappMessage: 'Halo, saya ingin bertanya tentang AMAN365.',
  // WhatsApp CS 2 — nomor & pesan otomatis (opsional, tombol kedua).
  whatsappNumber2: '',
  whatsappMessage2: 'Halo, saya ingin bertanya tentang AMAN365.',
  // Username Telegram tanpa "@" (mis. aman365cs → https://t.me/aman365cs).
  telegramUsername: '',
  // URL Live Chat (mis. https://direct.lc.chat/14863773).
  liveChatUrl: 'https://direct.lc.chat/14863773',
};

function readRaw() {
  try {
    const txt = fs.readFileSync(FILE, 'utf8');
    return JSON.parse(txt);
  } catch {
    return {};
  }
}

// Ambil settings lengkap (default + yang tersimpan). Selalu mengembalikan
// semua field agar frontend tidak perlu menangani nilai kosong tak terduga.
export function getSettings() {
  return { ...DEFAULTS, ...readRaw() };
}

// Simpan hanya field yang dikenal; abaikan input lain. Mengembalikan
// settings final setelah disimpan.
export function saveSettings(patch = {}) {
  const current = getSettings();
  const next = { ...current };

  if (typeof patch.whatsappNumber === 'string') {
    // Simpan hanya angka (buang +, spasi, tanda hubung).
    next.whatsappNumber = patch.whatsappNumber.replace(/[^\d]/g, '');
  }
  if (typeof patch.whatsappMessage === 'string') {
    next.whatsappMessage = patch.whatsappMessage.slice(0, 300);
  }
  if (typeof patch.whatsappNumber2 === 'string') {
    next.whatsappNumber2 = patch.whatsappNumber2.replace(/[^\d]/g, '');
  }
  if (typeof patch.whatsappMessage2 === 'string') {
    next.whatsappMessage2 = patch.whatsappMessage2.slice(0, 300);
  }
  if (typeof patch.telegramUsername === 'string') {
    // Buang "@", spasi, dan URL t.me/ bila admin terlanjur menempel link penuh.
    next.telegramUsername = patch.telegramUsername
      .trim()
      .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '')
      .replace(/^@/, '')
      .replace(/\s+/g, '');
  }
  if (typeof patch.liveChatUrl === 'string') {
    next.liveChatUrl = patch.liveChatUrl.trim();
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(next, null, 2), 'utf8');
  return next;
}
