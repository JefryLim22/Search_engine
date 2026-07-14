import { useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import { api, hostOf } from '../../lib/api.js';
import { useSite } from '../../lib/site.jsx';

export default function Pages() {
  const { site } = useSite();
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const params = { q, page: String(page), perPage: '20' };
  const { data, isFetching } = useQuery({
    queryKey: ['pages', site, params],
    queryFn: () => api.pages(site, params),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pages'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deletePage(site, id),
    onSuccess: invalidate,
  });
  const clearMutation = useMutation({
    mutationFn: () => api.clearPages(site),
    onSuccess: invalidate,
  });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Halaman Terindeks</h1>
          <p className="text-slate-400">Semua halaman yang tersimpan di index.</p>
        </div>
        <button
          onClick={() => {
            if (confirm('Hapus SEMUA halaman dari index?')) clearMutation.mutate();
          }}
          className="btn-danger"
        >
          <AlertTriangle size={16} /> Kosongkan Index
        </button>
      </div>

      <input
        value={q}
        onChange={(e) => {
          setPage(1);
          setQ(e.target.value);
        }}
        placeholder="Filter halaman terindeks…"
        className="field mb-4"
      />

      <div className="glass divide-y divide-white/5 overflow-hidden">
        {(data?.hits || []).map((p) => (
          <div key={p.id} className="flex items-start gap-3 p-4 hover:bg-white/5 transition">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{hostOf(p.url)}</span>
                {p.lang && (
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300">
                    {p.lang}
                  </span>
                )}
              </div>
              <p className="font-medium text-slate-100 truncate">{p.title}</p>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex max-w-full items-center gap-1 truncate text-xs text-emerald-400/90 hover:underline"
              >
                {p.url} <ExternalLink size={11} />
              </a>
            </div>
            <button
              onClick={() => deleteMutation.mutate(p.id)}
              className="shrink-0 rounded-lg p-1.5 text-red-300 hover:bg-red-500/10"
              title="Hapus dari index"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {data && data.hits.length === 0 && (
          <div className="p-10 text-center text-slate-500">Index masih kosong. Jalankan crawl dulu.</div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
        <span>
          {(data?.estimatedTotalHits ?? 0).toLocaleString('id-ID')} halaman
          {isFetching && ' · memuat…'}
        </span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost">
            Sebelumnya
          </button>
          <span>
            {page} / {data?.totalPages || 1}
          </span>
          <button
            disabled={page >= (data?.totalPages || 1)}
            onClick={() => setPage((p) => p + 1)}
            className="btn-ghost"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}
