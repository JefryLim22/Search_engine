import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Square, Loader2, Zap, Layers, ChevronDown, ListChecks } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useSite } from '../../lib/site.jsx';

/* Ubah teks bebas jadi daftar URL bersih:
   - buang baris kosong & komentar (#)
   - tambah https:// bila belum ada skema
   - buang duplikat */
function parseDomains(text) {
  const seen = new Set();
  const list = [];
  for (let line of text.split('\n')) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    if (!/^https?:\/\//i.test(line)) line = 'https://' + line;
    let norm;
    try {
      norm = new URL(line).toString();
    } catch {
      continue; // lewati yang bukan URL valid
    }
    if (!seen.has(norm)) {
      seen.add(norm);
      list.push(norm);
    }
  }
  return list;
}

export default function Crawl() {
  const { site } = useSite();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [mode, setMode] = useState('fast'); // 'fast' | 'deep'
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxPages, setMaxPages] = useState(50);
  const [maxDepth, setMaxDepth] = useState(0);
  const [delayMs, setDelayMs] = useState(800);
  const [sameHostOnly, setSameHostOnly] = useState(true);
  const [error, setError] = useState('');

  const domains = useMemo(() => parseDomains(text), [text]);

  const { data: status } = useQuery({
    queryKey: ['crawl-status', site],
    queryFn: () => api.crawlStatus(site),
    refetchInterval: (q) => (q.state.data?.running ? 1000 : 4000),
    retry: false,
  });

  const startMutation = useMutation({
    mutationFn: (body) => api.startCrawl(site, body),
    onError: (err) => setError(err.message),
    onSuccess: () => {
      setError('');
      queryClient.invalidateQueries({ queryKey: ['crawl-status', site] });
    },
  });
  const stopMutation = useMutation({ mutationFn: () => api.stopCrawl(site) });

  // Terapkan preset saat memilih mode (bisa ditimpa di Pengaturan lanjutan).
  function chooseMode(m) {
    setMode(m);
    if (m === 'fast') {
      setMaxDepth(0);
      setMaxPages(Math.min(2000, Math.max(domains.length || 50, 50)));
      setSameHostOnly(true);
    } else {
      setMaxDepth(2);
      setMaxPages(50);
      setSameHostOnly(true);
    }
  }

  function start(e) {
    e.preventDefault();
    setError('');
    if (!domains.length) {
      setError('Masukkan minimal satu domain atau URL.');
      return;
    }
    const pages =
      mode === 'fast'
        ? Math.min(2000, Math.max(domains.length, 50))
        : Number(maxPages);
    startMutation.mutate({
      seeds: domains,
      maxPages: pages,
      maxDepth: Number(maxDepth),
      sameHostOnly,
      delayMs: Number(delayMs),
    });
  }

  const running = status?.running;
  const done = (status?.crawled ?? 0) + (status?.queued ?? 0);
  const pct = done > 0 ? Math.round(((status?.crawled ?? 0) / done) * 100) : 0;

  return (
    <div className="max-w-5xl">
      <h1 className="mb-1 text-2xl font-bold text-slate-100">Index Domain</h1>
      <p className="mb-6 max-w-2xl text-slate-400">
        Tempel daftar domain (satu per baris), pilih mode, lalu klik{' '}
        <span className="text-slate-200">Mulai Index</span>. Robot akan mengambil halaman dan
        memasukkannya ke mesin pencari. Hanya index situs yang boleh kamu akses.
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* ---------- FORM ---------- */}
        <form onSubmit={start} className="glass space-y-5 p-5">
          {/* daftar domain */}
          <div>
            <label className="mb-1 flex items-center justify-between text-sm font-medium text-slate-300">
              <span className="flex items-center gap-1.5">
                <ListChecks size={15} /> Daftar domain / URL
              </span>
              {domains.length > 0 && (
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-200">
                  {domains.length} siap
                </span>
              )}
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              spellCheck={false}
              placeholder={'azgaming388.com\nbeerslot365.com\nhttps://contoh.com/artikel'}
              className="field font-mono text-[13px] leading-relaxed"
            />
            <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
              <span>Satu per baris. Tanpa “https://” pun boleh — otomatis ditambahkan.</span>
              {text && (
                <button
                  type="button"
                  onClick={() => setText('')}
                  className="text-slate-400 hover:text-slate-200"
                >
                  Bersihkan
                </button>
              )}
            </div>
          </div>

          {/* pilih mode */}
          <div>
            <p className="mb-2 text-sm font-medium text-slate-300">Mode index</p>
            <div className="grid grid-cols-2 gap-3">
              <ModeCard
                active={mode === 'fast'}
                onClick={() => chooseMode('fast')}
                icon={Zap}
                title="Cepat"
                desc="Index halaman utama tiap domain saja. Pas untuk banyak domain sekaligus."
              />
              <ModeCard
                active={mode === 'deep'}
                onClick={() => chooseMode('deep')}
                icon={Layers}
                title="Menyeluruh"
                desc="Telusuri isi tiap situs mengikuti link (maks 50 halaman/situs)."
              />
            </div>
          </div>

          {/* pengaturan lanjutan */}
          <div className="rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-slate-300"
            >
              <span>Pengaturan lanjutan</span>
              <ChevronDown
                size={16}
                className={`transition ${showAdvanced ? 'rotate-180' : ''}`}
              />
            </button>
            {showAdvanced && (
              <div className="space-y-4 border-t border-white/10 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <Num
                    label="Maks halaman"
                    hint="Total halaman yang diambil."
                    value={maxPages}
                    onChange={setMaxPages}
                    min={1}
                    max={2000}
                  />
                  <Num
                    label="Kedalaman link"
                    hint="0 = homepage saja."
                    value={maxDepth}
                    onChange={setMaxDepth}
                    min={0}
                    max={5}
                  />
                  <Num
                    label="Jeda antar-permintaan (ms)"
                    hint="Lebih besar = lebih sopan."
                    value={delayMs}
                    onChange={setDelayMs}
                    min={200}
                    max={10000}
                    step={100}
                  />
                  <label className="flex items-end gap-2 pb-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={sameHostOnly}
                      onChange={(e) => setSameHostOnly(e.target.checked)}
                      className="accent-indigo-500"
                    />
                    Tetap di domain yang sama
                  </label>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={running || startMutation.isPending || domains.length === 0}
              className="btn-primary"
            >
              {running ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={16} />
              )}
              {running
                ? 'Sedang meng-index…'
                : `Mulai Index${domains.length ? ` (${domains.length})` : ''}`}
            </button>
            <button
              type="button"
              onClick={() => stopMutation.mutate()}
              disabled={!running}
              className="btn-ghost"
            >
              <Square size={16} /> Stop
            </button>
          </div>
        </form>

        {/* ---------- STATUS ---------- */}
        <div className="glass p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-100">Status</h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                running
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-emerald-500/15 text-emerald-300'
              }`}
            >
              {running ? 'Berjalan…' : 'Idle'}
            </span>
          </div>

          {/* progress bar */}
          <div className="mb-4">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all"
                style={{ width: `${running || pct ? pct : 0}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-slate-500">{pct}%</p>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <Stat label="Diambil" value={status?.crawled ?? 0} />
            <Stat label="Terindeks" value={status?.indexed ?? 0} />
            <Stat label="Antrian" value={status?.queued ?? 0} />
            <Stat label="Error / lewati" value={`${status?.errors ?? 0} / ${status?.skipped ?? 0}`} />
          </div>

          {running && (
            <p className="mb-3 truncate text-xs text-slate-400">
              Sedang: <span className="font-mono text-slate-300">{status?.currentUrl}</span>
            </p>
          )}

          <div className="glass-inset h-56 overflow-auto p-3 text-xs font-mono leading-relaxed text-slate-300">
            {(status?.log || []).length === 0 ? (
              <span className="text-slate-500">Log akan muncul di sini saat index berjalan…</span>
            ) : (
              status.log.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeCard({ active, onClick, icon: Icon, title, desc }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition ${
        active
          ? 'border-indigo-400/50 bg-indigo-500/15 shadow-inner'
          : 'border-white/10 bg-white/5 hover:bg-white/10'
      }`}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className={`grid h-7 w-7 place-items-center rounded-lg ${
            active ? 'bg-indigo-500/30 text-indigo-100' : 'bg-white/10 text-slate-300'
          }`}
        >
          <Icon size={15} />
        </span>
        <span className="text-sm font-semibold text-slate-100">{title}</span>
      </div>
      <p className="text-xs leading-snug text-slate-400">{desc}</p>
    </button>
  );
}

function Num({ label, hint, value, onChange, ...rest }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-300">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
        className="field"
      />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="glass-inset p-3">
      <p className="text-xl font-bold text-slate-100">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
