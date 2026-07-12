import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api.js';

// Guards admin routes by checking the session via /api/admin/me.
export default function ProtectedRoute({ children }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: api.me,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-400">
        Memuat…
      </div>
    );
  }
  if (isError || !data?.user) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
