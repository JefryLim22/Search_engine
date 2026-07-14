import { Routes, Route, Navigate } from 'react-router-dom';
import Search from './pages/Search.jsx';
import Login from './pages/admin/Login.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Crawl from './pages/admin/Crawl.jsx';
import Pages from './pages/admin/Pages.jsx';
import Settings from './pages/admin/Settings.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import { SiteProvider } from './lib/site.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Search />} />
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <SiteProvider>
              <AdminLayout />
            </SiteProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="crawl" element={<Crawl />} />
        <Route path="pages" element={<Pages />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
