import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageCircle,
  Phone,
  Send,
  Save,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Plus,
  Trash2,
  GripVertical,
  Sparkles,
} from 'lucide-react';
import { api, contactHref } from '../../lib/api.js';
import { useSite } from '../../lib/site.jsx';

// Definisi jenis kontak untuk form. `value`/`message` cocok dengan sanitasi server.
const TYPES = {
  whatsapp: {
    name: 'WhatsApp',
    Icon: Phone,
    accent: 'bg-emerald-500/15 text-emerald-300',
    link: 'text-emerald-300',
    valueLabel: 'Nomor WhatsApp',
    placeholder: 'Contoh: 6281234567890',
    hint: 'Format internasional tanpa tanda “+”. Awali kode negara (Indonesia: 62).',
    hasMessage: true,
  },
  telegram: {
    name: 'Telegram',
    Icon: Send,
    accent: 'bg-sky-500/15 text-sky-300',
    link: 'text-sky-300',
    valueLabel: 'Username Telegram',
    placeholder: 'aman365cs',
    hint: 'Cukup username tanpa “@” (mis. aman365cs). Otomatis jadi t.me/username.',
    hasMessage: false,
  },
  link: {
    name: 'Live Chat / Link',
    Icon: MessageCircle,
    accent: 'bg-indigo-500/15 text-indigo-300',
    link: 'text-indigo-300',
    valueLabel: 'URL tautan',
    placeholder: 'https://direct.lc.chat/14863773',
    hint: 'Tempel URL lengkap (harus diawali http:// atau https://). Cocok untuk Live Chat, LINE, dsb.',
    hasMessage: false,
  },
};

// ID sementara untuk key React pada kontak baru (server memberi ID final saat simpan).
function tempId() {
  return 'new-' + Math.random().toString(36).slice(2, 9);
}

export default function Settings() {
  const { site } = useSite();
  const queryClient = useQueryClient();
  const [contacts, setContacts] = useState([]);
  const [brandName, setBrandName] = useState('');
  const [recommendedText, setRecommendedText] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings', site],
    queryFn: () => api.adminSettings(site),
    retry: false,
  });

  // Isi form saat data termuat (pertama kali, setelah simpan, atau ganti situs).
  useEffect(() => {
    if (!data) return;
    setBrandName(data.brand?.name || '');
    setRecommendedText((data.recommended || []).join('\n'));
    setContacts(
      (data.contacts || []).map((c) => ({
        id: c.id || tempId(),
        type: TYPES[c.type] ? c.type : 'link',
        label: c.label || '',
        value: c.value || '',
        message: c.message || '',
      })),
    );
  }, [data]);

  const mutation = useMutation({
    mutationFn: (body) => api.updateSettings(site, body),
    onError: (err) => {
      setError(err.message);
      setSaved(false);
    },
    onSuccess: () => {
      setError('');
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-settings'] });
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setTimeout(() => setSaved(false), 2500);
    },
  });

  function touch() {
    setSaved(false);
  }

  function addContact(type = 'whatsapp') {
    touch();
    setContacts((cs) => [
      ...cs,
      { id: tempId(), type, label: '', value: '', message: '' },
    ]);
  }

  function updateContact(id, patch) {
    touch();
    setContacts((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function removeContact(id) {
    touch();
    setContacts((cs) => cs.filter((c) => c.id !== id));
  }

  function move(id, dir) {
    touch();
    setContacts((cs) => {
      const i = cs.findIndex((c) => c.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= cs.length) return cs;
      const next = [...cs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function submit(e) {
    e.preventDefault();
    // Kirim hanya field yang dikenal server; ID sementara ("new-…") dibuang biar
    // server yang membuat ID final.
    const payload = contacts.map((c) => ({
      id: c.id.startsWith('new-') ? undefined : c.id,
      type: c.type,
      label: c.label,
      value: c.value,
      message: c.message,
    }));
    mutation.mutate({
      brand: { name: brandName },
      recommended: recommendedText.split('\n'),
      contacts: payload,
    });
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-100 mb-1">Pengaturan Situs</h1>
      <p className="text-slate-400 mb-6">
        Atur identitas brand, saran pencarian, dan tombol kontak untuk situs yang
        sedang dipilih di sidebar. Semua bisa diganti di sini tanpa deploy ulang.
      </p>

      {isLoading ? (
        <div className="glass p-6 flex items-center gap-3 text-slate-300">
          <Loader2 size={18} className="animate-spin" /> Memuat pengaturan…
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {/* ---------- Identitas brand ---------- */}
          <div className="glass p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-fuchsia-500/15 text-fuchsia-300">
                <Sparkles size={18} />
              </span>
              <h2 className="font-semibold text-slate-100">Identitas Brand</h2>
            </div>

            <label className="mb-1.5 block text-sm text-slate-300">Nama brand</label>
            <input
              value={brandName}
              onChange={(e) => {
                touch();
                setBrandName(e.target.value);
              }}
              placeholder="mis. AMAN365"
              maxLength={30}
              className="field w-full"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Tampil sebagai logo besar di halaman pencarian (warna-warni otomatis),
              tombol “Penelusuran …”, dan placeholder kotak pencarian.
            </p>

            <label className="mb-1.5 mt-4 block text-sm text-slate-300">
              Saran pencarian (satu per baris)
            </label>
            <textarea
              value={recommendedText}
              onChange={(e) => {
                touch();
                setRecommendedText(e.target.value);
              }}
              rows={5}
              spellCheck={false}
              placeholder={'BRANDKU\nBRANDKU login\nBRANDKU daftar'}
              className="field w-full font-mono text-[13px] leading-relaxed"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Muncul sebagai saran saat pengunjung mengklik kotak pencarian.
              Maksimal 10 baris.
            </p>
          </div>
          {contacts.length === 0 && (
            <div className="glass p-6 text-center text-slate-400">
              Belum ada kontak. Klik “Tambah kontak” untuk membuat tombol pertama.
            </div>
          )}

          {contacts.map((c, i) => (
            <ContactCard
              key={c.id}
              contact={c}
              index={i}
              total={contacts.length}
              onChange={(patch) => updateContact(c.id, patch)}
              onRemove={() => removeContact(c.id)}
              onMove={(dir) => move(c.id, dir)}
            />
          ))}

          {/* Tombol tambah */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(TYPES).map(([type, def]) => (
              <button
                key={type}
                type="button"
                onClick={() => addContact(type)}
                className="glass inline-flex items-center gap-2 px-3.5 py-2 text-sm text-slate-200 hover:text-white hover:border-slate-500 transition"
              >
                <Plus size={15} /> {def.name}
              </button>
            ))}
          </div>

          {error && (
            <div className="glass border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary px-5 py-2.5 text-sm disabled:opacity-60"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Menyimpan…
                </>
              ) : (
                <>
                  <Save size={16} /> Simpan Pengaturan
                </>
              )}
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-300">
                <CheckCircle2 size={16} /> Tersimpan
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function ContactCard({ contact, index, total, onChange, onRemove, onMove }) {
  const def = TYPES[contact.type] || TYPES.link;
  const { Icon } = def;
  const href = contactHref(contact);

  return (
    <div className="glass p-5">
      {/* header baris: jenis + urutkan + hapus */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-9 h-9 rounded-xl grid place-items-center ${def.accent}`}>
          <Icon size={18} />
        </span>

        <select
          value={contact.type}
          onChange={(e) => onChange({ type: e.target.value })}
          className="field py-1.5 pr-8 text-sm"
          aria-label="Jenis kontak"
        >
          {Object.entries(TYPES).map(([type, d]) => (
            <option key={type} value={type}>
              {d.name}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            title="Naikkan"
            className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <GripVertical size={16} className="rotate-90" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Hapus kontak"
            className="p-1.5 rounded-lg text-red-300 hover:bg-red-500/15"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Label bebas */}
      <label className="block text-sm text-slate-300 mb-1.5">
        Nama tombol (label)
      </label>
      <input
        value={contact.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="mis. WhatsApp CS 1, WA Deposit, CS VIP…"
        maxLength={40}
        className="field w-full"
      />
      <p className="mt-1.5 text-xs text-slate-500">
        Teks yang tampil di tombol. Kosongkan untuk memakai nama default “{def.name}”.
      </p>

      {/* Nilai (nomor / username / URL) */}
      <label className="block text-sm text-slate-300 mb-1.5 mt-4">
        {def.valueLabel}
      </label>
      {contact.type === 'telegram' ? (
        <div className="flex items-center">
          <span className="field rounded-r-none border-r-0 text-slate-400 select-none">@</span>
          <input
            value={contact.value}
            onChange={(e) => onChange({ value: e.target.value })}
            placeholder={def.placeholder}
            className="field w-full rounded-l-none"
          />
        </div>
      ) : (
        <input
          value={contact.value}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder={def.placeholder}
          inputMode={contact.type === 'whatsapp' ? 'numeric' : 'text'}
          className="field w-full"
        />
      )}
      <p className="mt-1.5 text-xs text-slate-500">{def.hint}</p>

      {/* Pesan otomatis (WhatsApp saja) */}
      {def.hasMessage && (
        <>
          <label className="block text-sm text-slate-300 mb-1.5 mt-4">
            Pesan otomatis (opsional)
          </label>
          <input
            value={contact.message}
            onChange={(e) => onChange({ message: e.target.value })}
            placeholder="Halo, saya ingin bertanya tentang AMAN365."
            maxLength={300}
            className="field w-full"
          />
        </>
      )}

      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-3 inline-flex items-center gap-1.5 text-xs hover:underline ${def.link}`}
        >
          <ExternalLink size={13} /> Tes tautan
        </a>
      )}
    </div>
  );
}
