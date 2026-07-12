import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, Globe, FileText, LogOut, Search, MessageCircle } from 'lucide-react';
import { api } from '../lib/api.js';

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
    isActive
      ? 'bg-gradient-to-r from-indigo-500/30 to-fuchsia-500/20 text-white border border-white/10 shadow-inner'
      : 'text-slate-400 hover:bg-white/5 hover:text-white'
  }`;

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
            <MessageCircle size={18} /> Pengaturan Kontak
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
