import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Phone, Send, Save, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { api, waLink, tgLink } from '../../lib/api.js';

export default function Settings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    whatsappNumber: '',
    whatsappMessage: '',
    whatsappNumber2: '',
    whatsappMessage2: '',
    telegramUsername: '',
    liveChatUrl: '',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: api.adminSettings,
    retry: false,
  });

  // Isi form saat data pertama kali termuat.
  useEffect(() => {
    if (data) {
      setForm({
        whatsappNumber: data.whatsappNumber || '',
        whatsappMessage: data.whatsappMessage || '',
        whatsappNumber2: data.whatsappNumber2 || '',
        whatsappMessage2: data.whatsappMessage2 || '',
        telegramUsername: data.telegramUsername || '',
        liveChatUrl: data.liveChatUrl || '',
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: api.updateSettings,
    onError: (err) => {
      setError(err.message);
      setSaved(false);
    },
    onSuccess: (res) => {
      setError('');
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-settings'] });
      setForm({
        whatsappNumber: res.whatsappNumber || '',
        whatsappMessage: res.whatsappMessage || '',
        whatsappNumber2: res.whatsappNumber2 || '',
        whatsappMessage2: res.whatsappMessage2 || '',
        telegramUsername: res.telegramUsername || '',
        liveChatUrl: res.liveChatUrl || '',
      });
      setTimeout(() => setSaved(false), 2500);
    },
  });

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  function submit(e) {
    e.preventDefault();
    mutation.mutate(form);
  }

  const previewWa = waLink(form.whatsappNumber, form.whatsappMessage);
  const previewWa2 = waLink(form.whatsappNumber2, form.whatsappMessage2);
  const previewTg = tgLink(form.telegramUsername);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-100 mb-1">Pengaturan Kontak</h1>
      <p className="text-slate-400 mb-6">
        Atur tombol WhatsApp CS 1, WhatsApp CS 2, Telegram &amp; Live Chat yang tampil di
        halaman utama. Jika nomor atau link terblokir, cukup ganti di sini — tidak perlu
        deploy ulang.
      </p>

      {isLoading ? (
        <div className="glass p-6 flex items-center gap-3 text-slate-300">
          <Loader2 size={18} className="animate-spin" /> Memuat pengaturan…
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {/* WhatsApp CS 1 */}
          <div className="glass p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-9 h-9 rounded-xl grid place-items-center bg-emerald-500/15 text-emerald-300">
                <Phone size={18} />
              </span>
              <h2 className="font-semibold text-slate-100">Tombol WhatsApp CS 1</h2>
            </div>

            <label className="block text-sm text-slate-300 mb-1.5">
              Nomor WhatsApp CS 1
            </label>
            <input
              value={form.whatsappNumber}
              onChange={(e) => set('whatsappNumber', e.target.value)}
              placeholder="Contoh: 6281234567890"
              inputMode="numeric"
              className="field w-full"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Format internasional tanpa tanda “+”. Awali kode negara (Indonesia: 62).
              Kosongkan untuk menyembunyikan tombol WhatsApp CS 1.
            </p>

            <label className="block text-sm text-slate-300 mb-1.5 mt-4">
              Pesan otomatis (opsional)
            </label>
            <input
              value={form.whatsappMessage}
              onChange={(e) => set('whatsappMessage', e.target.value)}
              placeholder="Halo, saya ingin bertanya tentang AMAN365."
              className="field w-full"
            />

            {previewWa && (
              <a
                href={previewWa}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:underline"
              >
                <ExternalLink size={13} /> Tes tautan WhatsApp CS 1
              </a>
            )}
          </div>

          {/* WhatsApp CS 2 */}
          <div className="glass p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-9 h-9 rounded-xl grid place-items-center bg-emerald-500/15 text-emerald-300">
                <Phone size={18} />
              </span>
              <h2 className="font-semibold text-slate-100">Tombol WhatsApp CS 2</h2>
            </div>

            <label className="block text-sm text-slate-300 mb-1.5">
              Nomor WhatsApp CS 2
            </label>
            <input
              value={form.whatsappNumber2}
              onChange={(e) => set('whatsappNumber2', e.target.value)}
              placeholder="Contoh: 6281234567891"
              inputMode="numeric"
              className="field w-full"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Format internasional tanpa tanda “+”. Awali kode negara (Indonesia: 62).
              Kosongkan untuk menyembunyikan tombol WhatsApp CS 2.
            </p>

            <label className="block text-sm text-slate-300 mb-1.5 mt-4">
              Pesan otomatis (opsional)
            </label>
            <input
              value={form.whatsappMessage2}
              onChange={(e) => set('whatsappMessage2', e.target.value)}
              placeholder="Halo, saya ingin bertanya tentang AMAN365."
              className="field w-full"
            />

            {previewWa2 && (
              <a
                href={previewWa2}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:underline"
              >
                <ExternalLink size={13} /> Tes tautan WhatsApp CS 2
              </a>
            )}
          </div>

          {/* Telegram */}
          <div className="glass p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-9 h-9 rounded-xl grid place-items-center bg-sky-500/15 text-sky-300">
                <Send size={18} />
              </span>
              <h2 className="font-semibold text-slate-100">Tombol Telegram</h2>
            </div>

            <label className="block text-sm text-slate-300 mb-1.5">
              Username Telegram
            </label>
            <div className="flex items-center">
              <span className="field rounded-r-none border-r-0 text-slate-400 select-none">@</span>
              <input
                value={form.telegramUsername}
                onChange={(e) => set('telegramUsername', e.target.value)}
                placeholder="aman365cs"
                className="field w-full rounded-l-none"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Cukup username tanpa “@” (mis. <span className="text-slate-400">aman365cs</span>).
              Otomatis jadi t.me/username. Kosongkan untuk menyembunyikan tombol Telegram.
            </p>

            {previewTg && (
              <a
                href={previewTg}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-sky-300 hover:underline"
              >
                <ExternalLink size={13} /> Tes tautan Telegram
              </a>
            )}
          </div>

          {/* Live Chat */}
          <div className="glass p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-9 h-9 rounded-xl grid place-items-center bg-indigo-500/15 text-indigo-300">
                <MessageCircle size={18} />
              </span>
              <h2 className="font-semibold text-slate-100">Tombol Live Chat</h2>
            </div>

            <label className="block text-sm text-slate-300 mb-1.5">
              URL Live Chat
            </label>
            <input
              value={form.liveChatUrl}
              onChange={(e) => set('liveChatUrl', e.target.value)}
              placeholder="https://direct.lc.chat/14863773"
              className="field w-full"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Tempel link Live Chat lengkap (harus diawali http:// atau https://).
              Kosongkan untuk menyembunyikan tombol Live Chat.
            </p>

            {form.liveChatUrl && /^https?:\/\//i.test(form.liveChatUrl) && (
              <a
                href={form.liveChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:underline"
              >
                <ExternalLink size={13} /> Tes tautan Live Chat
              </a>
            )}
          </div>

          {error && (
            <div className="glass border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
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
