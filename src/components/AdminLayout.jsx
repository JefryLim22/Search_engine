import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Globe, FileText, LogOut, Search, MessageCircle, ExternalLink } from 'lucide-react';
import { api } from '../lib/api.js';
import { useSite } from '../lib/site.jsx';

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
    isActive
      ? 'bg-gradient-to-r from-indigo-500/30 to-fuchsia-500/20 text-white border border-white/10 shadow-inner'
      : 'text-slate-400 hover:bg-white/5 hover:text-white'
  }`;

// Warna aksen per situs supaya selalu jelas sedang mengelola brand yang mana.
const SITE_ACCENTS = {
  cari: 'bg-indigo-400',
  beer: 'bg-amber-400',
};

function SiteSwitcher() {
  const { site, setSite } = useSite();
  const { data } = useQuery({
    queryKey: ['sites'],
    queryFn: api.sites,
    staleTime: 60_000,
    retry: false,
  });
  const sites = data?.sites || [];
  if (sites.length < 2) return null;

  return (
    <div className="px-3 pt-3">
      <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Kelola situs
      </p>
      <div className="space-y-1">
        {sites.map((s) => {
          const active = s.id === site;
          return (
            <div
              key={s.id}
              className={`flex items-center gap-1 rounded-xl border transition ${
                active
                  ? 'border-white/15 bg-white/10 text-white shadow-inner'
                  : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <button
                onClick={() => setSite(s.id)}
                className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    SITE_ACCENTS[s.id] || 'bg-slate-400'
                  } ${active ? '' : 'opacity-40'}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{s.name}</span>
                  <span className="block truncate text-[11px] text-slate-500">{s.host}</span>
                </span>
              </button>
              {active && (
                <a
                  href={`https://${s.host}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Buka situs"
                  className="mr-2 shrink-0 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleLogout() {
    await api.logout();
    queryClient.clear();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-screen flex p-3 gap-3">
      <aside className="glass w-64 shrink-0 flex flex-col">
        <div className="px-6 py-5 border-b border-white/10">
          <h1 className="text-lg font-bold">
            <span className="brand-gradient">AMAN</span>
            <span className="text-slate-100">365</span>
          </h1>
          <p className="text-xs text-slate-400">Panel Mesin Pencari</p>
        </div>
        <SiteSwitcher />
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/admin" end className={linkClass}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/admin/crawl" className={linkClass}>
            <Globe size={18} /> Index Domain
          </NavLink>
          <NavLink to="/admin/pages" className={linkClass}>
            <FileText size={18} /> Halaman Terindeks
          </NavLink>
          <NavLink to="/admin/settings" className={linkClass}>
            <MessageCircle size={18} /> Pengaturan Situs
          </NavLink>
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <Search size={18} /> Buka Pencarian
          </Link>
        </nav>
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={18} /> Keluar
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
