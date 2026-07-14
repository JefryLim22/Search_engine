import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FileText, Activity, Globe, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useSite } from '../../lib/site.jsx';

export default function Dashboard() {
  const { site } = useSite();
  const { data: sites } = useQuery({
    queryKey: ['sites'],
    queryFn: api.sites,
    staleTime: 60_000,
    retry: false,
  });
  const siteName = sites?.sites?.find((s) => s.id === site)?.name || site;

  const { data: stats, isError } = useQuery({
    queryKey: ['stats', site],
    queryFn: () => api.stats(site),
    retry: false,
    refetchInterval: 5000,
  });
  const { data: status } = useQuery({
    queryKey: ['crawl-status', site],
    queryFn: () => api.crawlStatus(site),
    retry: false,
    refetchInterval: 3000,
  });

  const cards = [
    {
      label: 'Halaman Terindeks',
      value: stats?.numberOfDocuments?.toLocaleString('id-ID') ?? '—',
      icon: FileText,
      color: 'text-indigo-300 bg-indigo-500/15',
    },
    {
      label: 'Status Crawler',
      value: status?.running ? 'Berjalan…' : 'Idle',
      icon: status?.running ? Activity : CheckCircle2,
      color: status?.running ? 'text-amber-300 bg-amber-500/15' : 'text-emerald-300 bg-emerald-500/15',
    },
    {
      label: 'Index',
      value: stats?.isIndexing ? 'Mengindeks…' : 'Siap',
      icon: Globe,
      color: 'text-fuchsia-300 bg-fuchsia-500/15',
    },
  ];

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-100 mb-1">Dashboard</h1>
      <p className="text-slate-400 mb-6">
        Ringkasan mesin pencari &amp; crawler — situs{' '}
        <span className="font-semibold text-slate-200">{siteName}</span>.
      </p>

      {isError && (
        <div className="glass border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-200 mb-6">
          Tidak dapat mengambil statistik. Pastikan Meilisearch berjalan.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="glass p-5">
            <div className={`w-10 h-10 rounded-xl grid place-items-center mb-3 ${c.color}`}>
              <c.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-slate-100">{c.value}</p>
            <p className="text-sm text-slate-400">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="glass p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-100">Mulai cepat</h2>
          <Link to="/admin/crawl" className="btn-primary px-4 py-1.5 text-sm">
            <Globe size={15} /> Index Domain
          </Link>
        </div>
        <ol className="list-inside list-decimal space-y-1.5 text-sm text-slate-300">
          <li>
            Buka{' '}
            <Link to="/admin/crawl" className="text-indigo-300 hover:underline">
              Index Domain
            </Link>{' '}
            → tempel daftar domain (satu per baris, bulk boleh banyak sekaligus).
          </li>
          <li>
            Pilih mode: <span className="text-slate-200">Cepat</span> (homepage tiap domain) atau{' '}
            <span className="text-slate-200">Menyeluruh</span> (telusuri isi situs).
          </li>
          <li>Klik “Mulai Index” — robot mengambil halaman (hormati robots.txt) dan mengisi mesin pencari.</li>
          <li>
            Cari hasilnya di{' '}
            <Link to="/" className="text-indigo-300 hover:underline">
              halaman pencarian
            </Link>
            .
          </li>
        </ol>
      </div>
    </div>
  );
}
