import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { LogIn } from 'lucide-react';
import { api } from '../../lib/api.js';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login({ username, password });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Gagal masuk');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form onSubmit={handleSubmit} className="glass w-full max-w-sm p-8 space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="brand-gradient">AMAN</span>
            <span className="text-slate-100">365</span>
          </h1>
          <p className="text-sm text-slate-400">Masuk untuk mengelola mesin pencari</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 text-red-300 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            className="field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          <LogIn size={18} /> {loading ? 'Memproses…' : 'Masuk'}
        </button>
      </form>
    </div>
  );
}
