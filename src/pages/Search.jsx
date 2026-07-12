import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api, hostOf } from '../lib/api.js';

/* Rekomendasi keyword yang muncul di search box (autocomplete).
   Tambah/kurangi di sini sesuka hati. */
const RECOMMENDED = [
  'AZGAMING388',
  'AZGAMING388 login',
  'AZGAMING388 daftar',
  'AZGAMING388 link alternatif',
  'AZGAMING388 rtp',
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const page = Number(searchParams.get('page') || '1');
  const [input, setInput] = useState(query);

  useEffect(() => {
    setInput(query);
  }, [query]);

  const hasQuery = query.trim().length > 0;

  const { data, isFetching, isError } = useQuery({
    queryKey: ['websearch', query, page],
    queryFn: () => api.search({ q: query, page: String(page), perPage: '10' }),
    enabled: hasQuery,
    placeholderData: keepPreviousData,
  });

  function runSearch(q) {
    const t = (q ?? input).trim();
    if (t) setSearchParams({ q: t });
  }

  function submit(e) {
    e.preventDefault();
    runSearch(input);
  }

  function goPage(p) {
    setSearchParams({ q: query, page: String(p) });
    window.scrollTo({ top: 0 });
  }

  /* ---------- HOMEPAGE (ala google.com) ---------- */
  if (!hasQuery) {
    return (
      <div className="g-root flex min-h-screen flex-col bg-white">
        {/* top bar */}
        <div className="flex items-center justify-end gap-4 px-5 py-4 text-sm text-[#202124]">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="hidden hover:underline sm:inline"
          >
            Gmail
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="hidden hover:underline sm:inline"
          >
            Gambar
          </a>
          <GridIcon />
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#4285F4] to-[#34A853] text-sm font-medium text-white"
          >
            A
          </span>
        </div>

        {/* center */}
        <div className="flex flex-1 flex-col items-center px-4 pb-40" style={{ marginTop: '14vh' }}>
          <Logo className="mb-7" size="home" />

          <form onSubmit={submit} className="w-full max-w-[584px]">
            <SearchBox input={input} setInput={setInput} onSearch={runSearch} />
            <div className="mt-7 flex justify-center gap-3">
              <button type="submit" className="g-btn">
                Penelusuran AMAN365
              </button>
              <button type="submit" className="g-btn">
                Saya Lagi Beruntung
              </button>
            </div>
          </form>
        </div>

        <Footer />
        <LiveChatButton />
      </div>
    );
  }

  /* ---------- SERP (halaman hasil) ---------- */
  const total = data?.estimatedTotalHits ?? 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="g-root min-h-screen bg-white text-[#202124]">
      {/* header */}
      <header className="border-b border-[#ebebeb]">
        <div className="flex flex-col gap-3 px-4 pt-5 sm:flex-row sm:items-center sm:gap-6 sm:px-6 md:pl-[150px]">
          <Link to="/" className="shrink-0 self-start sm:self-center">
            <Logo size="serp" />
          </Link>
          <form onSubmit={submit} className="w-full max-w-[640px]">
            <SearchBox input={input} setInput={setInput} onSearch={runSearch} compact />
          </form>
        </div>
        {/* tabs */}
        <nav className="mt-3 flex gap-6 px-4 text-sm text-[#5f6368] sm:px-6 md:pl-[150px]">
          <span className="flex items-center gap-1.5 border-b-[3px] border-[#1a73e8] pb-2.5 font-medium text-[#1a73e8]">
            Semua
          </span>
          <span className="pb-2.5">Gambar</span>
          <span className="pb-2.5">Video</span>
          <span className="pb-2.5">Berita</span>
          <span className="hidden pb-2.5 sm:inline">Maps</span>
        </nav>
      </header>

      {/* stats */}
      <div className="px-4 pt-3 text-[13px] text-[#70757a] sm:px-6 md:pl-[150px]">
        {isError
          ? 'Gagal memuat hasil.'
          : `Sekitar ${total.toLocaleString('id-ID')} hasil${isFetching ? ' · memuat…' : ''}`}
      </div>

      {/* results */}
      <div className="max-w-[652px] px-4 py-4 sm:px-6 md:pl-[150px]">
        {isError && (
          <div className="rounded-lg border border-[#fbc02d] bg-[#fef7e0] p-4 text-sm text-[#5f6368]">
            Tidak dapat terhubung ke server pencarian.
          </div>
        )}

        <div className="space-y-7">
          {(data?.hits || []).map((hit) => (
            <Result key={hit.id} hit={hit} />
          ))}
        </div>

        {data && data.hits.length === 0 && !isError && (
          <div className="py-8 text-sm text-[#4d5156]">
            <p className="mb-3">
              Hasil penelusuran untuk <strong>{query}</strong> tidak ditemukan.
            </p>
            <p className="mb-1">Saran:</p>
            <ul className="list-inside list-disc space-y-1 text-[#4d5156]">
              <li>Pastikan semua kata dieja dengan benar.</li>
              <li>Coba kata kunci yang berbeda.</li>
              <li>Coba kata kunci yang lebih umum.</li>
            </ul>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} goPage={goPage} />
        )}
      </div>

      <Footer serp />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Logo({ className = '', size = 'home' }) {
  // "AMAN365" dalam palet Google
  const letters = [
    ['A', '#4285F4'],
    ['M', '#EA4335'],
    ['A', '#FBBC05'],
    ['N', '#4285F4'],
    ['3', '#34A853'],
    ['6', '#EA4335'],
    ['5', '#4285F4'],
  ];
  const px = size === 'home' ? 'text-[64px] sm:text-[80px]' : 'text-[26px]';
  return (
    <span
      className={`select-none font-medium leading-none tracking-tight ${px} ${className}`}
      style={{ fontFamily: '"Google Sans", "Product Sans", Arial, sans-serif' }}
    >
      {letters.map(([ch, color], i) => (
        <span key={i} style={{ color }}>
          {ch}
        </span>
      ))}
    </span>
  );
}

function SearchBox({ input, setInput, onSearch, compact = false }) {
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1); // index yang disorot keyboard
  const wrapRef = useRef(null);

  // Bangun daftar saran dari input.
  const q = input.trim().toLowerCase();
  const suggestions = (
    q
      ? RECOMMENDED.filter((s) => s.toLowerCase().includes(q) && s.toLowerCase() !== q)
      : RECOMMENDED
  ).slice(0, 8);

  const open = focused && suggestions.length > 0;

  useEffect(() => {
    setActive(-1); // reset sorotan tiap kali input berubah
  }, [input]);

  function choose(s) {
    setInput(s);
    setFocused(false);
    onSearch(s);
  }

  function onKeyDown(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      if (active >= 0) {
        e.preventDefault();
        choose(suggestions[active]);
      }
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  }

  return (
    <div
      ref={wrapRef}
      className="relative"
      onBlur={(e) => {
        // tutup hanya jika fokus keluar dari komponen
        if (!wrapRef.current?.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      {/* baris input */}
      <div
        className={`flex items-center gap-3 border border-[#dfe1e5] bg-white px-4 ${
          compact ? 'h-11' : 'h-12'
        } ${
          open
            ? 'rounded-t-[24px] border-b-[#e8eaed] shadow-[0_1px_6px_rgba(32,33,36,0.28)]'
            : 'rounded-full transition hover:shadow-[0_1px_6px_rgba(32,33,36,0.28)] focus-within:shadow-[0_1px_6px_rgba(32,33,36,0.28)] focus-within:border-[#dfe1e5]'
        }`}
      >
        <SearchIcon />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          autoFocus
          autoComplete="off"
          placeholder="Telusuri AMAN365 atau ketik URL"
          className="h-full flex-1 bg-transparent text-[16px] text-[#202124] outline-none placeholder:text-[#80868b]"
          style={{ fontFamily: 'Arial, sans-serif' }}
        />
        <MicIcon />
        <CameraIcon />
      </div>

      {/* dropdown saran */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 overflow-hidden rounded-b-[24px] border border-t-0 border-[#dfe1e5] bg-white pb-2 shadow-[0_4px_6px_rgba(32,33,36,0.28)]">
          <div className="mx-4 mb-1 border-t border-[#e8eaed]" />
          {suggestions.map((s, i) => (
            <button
              key={s}
              type="button"
              // pakai mousedown agar tidak memicu blur sebelum klik
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(s)}
              onMouseEnter={() => setActive(i)}
              className={`flex w-full items-center gap-4 px-4 py-1.5 text-left ${
                active === i ? 'bg-[#f1f3f4]' : 'hover:bg-[#f8f9fa]'
              }`}
            >
              <TrendIcon />
              <span className="text-[16px] text-[#202124]" style={{ fontFamily: 'Arial, sans-serif' }}>
                {renderSuggestion(s, q)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// tebalkan bagian saran yang BELUM diketik (ala Google)
function renderSuggestion(s, q) {
  if (!q) return <strong className="font-normal">{s}</strong>;
  const idx = s.toLowerCase().indexOf(q);
  if (idx === -1) return <strong className="font-medium">{s}</strong>;
  const before = s.slice(0, idx);
  const match = s.slice(idx, idx + q.length);
  const after = s.slice(idx + q.length);
  return (
    <>
      <span className="font-normal">{before}</span>
      <span className="font-normal">{match}</span>
      <strong className="font-medium">{after}</strong>
    </>
  );
}

function Result({ hit }) {
  const f = hit._formatted || {};
  const title = f.title || hit.title || hit.url;
  const snippet = f.content || hit.description || '';
  const host = hostOf(hit.url);
  let path = '';
  try {
    path = decodeURIComponent(new URL(hit.url).pathname).replace(/\/$/, '');
  } catch {
    /* ignore */
  }
  const crumb = path
    ? `${host} › ${path.split('/').filter(Boolean).join(' › ')}`
    : host;

  return (
    <div className="max-w-[600px]" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="mb-1 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#ecedef] bg-white text-[12px] font-medium text-[#5f6368]">
          {host.replace(/^www\./, '').charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[14px] text-[#202124]">{host.replace(/^www\./, '')}</div>
          <div className="truncate text-[12px] text-[#4d5156]">{crumb}</div>
        </div>
      </div>
      <a
        href={hit.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="group block"
      >
        <h3
          className="text-[20px] leading-[1.3] text-[#1a0dab] group-hover:underline"
          dangerouslySetInnerHTML={{ __html: title }}
        />
      </a>
      <p
        className="mt-1 line-clamp-2 text-[14px] leading-[1.58] text-[#4d5156]"
        dangerouslySetInnerHTML={{ __html: snippet }}
      />
    </div>
  );
}

function Pagination({ page, totalPages, goPage }) {
  const windowSize = 10;
  const start = Math.max(1, page - 5);
  const end = Math.min(totalPages, start + windowSize - 1);
  const nums = [];
  for (let p = start; p <= end; p++) nums.push(p);

  return (
    <div className="mt-12 flex flex-col items-center gap-2">
      <div
        className="flex select-none items-end text-[26px] font-medium"
        style={{ fontFamily: '"Google Sans", Arial, sans-serif' }}
      >
        <PageArrow dir="prev" disabled={page <= 1} onClick={() => page > 1 && goPage(page - 1)} />
        <span className="mx-1 flex">
          {nums.map((p) => (
            <button
              key={p}
              onClick={() => goPage(p)}
              className={`w-9 text-center text-[15px] ${
                p === page ? 'font-medium text-[#4d5156]' : 'text-[#1a0dab] hover:underline'
              }`}
            >
              {p}
            </button>
          ))}
        </span>
        <PageArrow
          dir="next"
          disabled={page >= totalPages}
          onClick={() => page < totalPages && goPage(page + 1)}
        />
      </div>
      <div className="flex gap-16 text-[13px] text-[#4d5156]">
        <button
          onClick={() => page > 1 && goPage(page - 1)}
          disabled={page <= 1}
          className="hover:underline disabled:invisible"
        >
          Sebelumnya
        </button>
        <button
          onClick={() => page < totalPages && goPage(page + 1)}
          disabled={page >= totalPages}
          className="hover:underline disabled:invisible"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}

function PageArrow({ dir, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2 text-[13px] ${disabled ? 'invisible' : 'text-[#1a0dab] hover:underline'}`}
    >
      {dir === 'prev' ? '‹' : '›'}
    </button>
  );
}

function Footer({ serp = false }) {
  return (
    <footer className={`${serp ? 'mt-8' : 'mt-auto'} bg-[#f2f2f2] text-[14px] text-[#70757a]`}>
      <div className="border-b border-[#dadce0] px-6 py-3 md:pl-[150px]">Indonesia</div>
      <div className="flex flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between md:px-[150px]">
        <div className="flex flex-wrap gap-6">
          <span>Tentang</span>
          <span>Cara Kerja</span>
          <span>Privasi</span>
        </div>
        <div className="flex flex-wrap gap-6">
          <span>Setelan</span>
          <span>Bantuan</span>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- Tombol Live Chat mengambang ---------------- */
function LiveChatButton() {
  return (
    <a
      href="https://direct.lc.chat/14863773"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Buka Live Chat"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-br from-[#1a73e8] to-[#34A853] py-3 pl-3.5 pr-5 text-white shadow-[0_4px_14px_rgba(26,115,232,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(26,115,232,0.55)] active:translate-y-0 sm:bottom-6 sm:right-6"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      {/* ikon chat dalam lingkaran + titik online berdenyut */}
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
        <ChatIcon />
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34ff8f] opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-[#1a73e8] bg-[#34ff8f]" />
        </span>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-semibold">Live Chat</span>
        <span className="text-[11px] font-medium text-white/80">Online 24 Jam</span>
      </span>
    </a>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8l-4 4V5a1 1 0 0 1 1-1Z"
        fill="currentColor"
      />
      <circle cx="8.5" cy="10.5" r="1.3" fill="#1a73e8" />
      <circle cx="12" cy="10.5" r="1.3" fill="#1a73e8" />
      <circle cx="15.5" cy="10.5" r="1.3" fill="#1a73e8" />
    </svg>
  );
}

/* ---------------- icons (SVG inline, warna Google) ---------------- */

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" className="shrink-0 fill-[#9aa0a6]">
      <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.49 4.49 0 0 1 9.5 14z" />
    </svg>
  );
}

function TrendIcon() {
  // ikon jam/riwayat ala saran Google
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" className="shrink-0 fill-[#9aa0a6]">
      <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 1 1 2.05 4.95l-1.42 1.42A9 9 0 1 0 13 3zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className="shrink-0 cursor-pointer">
      <path fill="#4285F4" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3z" />
      <path fill="#34A853" d="M11 18.92v2.08a1 1 0 1 0 2 0v-2.08z" />
      <path fill="#FBBC05" d="M12 15a3 3 0 0 1-3-3H7a5 5 0 0 0 4 4.9V15z" />
      <path fill="#EA4335" d="M12 15v1.9A5 5 0 0 0 17 12h-2a3 3 0 0 1-3 3z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className="ml-1 shrink-0 cursor-pointer">
      <path fill="#4285F4" d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 4.5A1.5 1.5 0 1 1 12 10a1.5 1.5 0 0 1 0 3.5z" />
      <path
        fill="#EA4335"
        d="M9 3 7.17 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h5.5v-2H4V7h4.05l.59-.65L9.88 5h4.24l1.24 1.35.59.65H20v4h2V7a2 2 0 0 0-2-2h-3.17L15 3z"
      />
      <path fill="#34A853" d="M18 15v2h-2v2h2v2h2v-2h2v-2h-2v-2z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className="hidden fill-[#5f6368] sm:block">
      <path d="M6 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    </svg>
  );
}
