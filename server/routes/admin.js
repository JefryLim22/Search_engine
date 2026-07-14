import { Router } from 'express';
import {
  verifyCredentials,
  issueToken,
  clearToken,
  requireAuth,
} from '../auth.js';
import { pagesIndex } from '../meili.js';
import { getSettings, saveSettings } from '../settings.js';
import { SITES, resolveSite } from '../sites.js';

const router = Router();

// Ambil situs target dari ?site= (dipakai semua endpoint admin). 400 bila
// site yang diminta tidak dikenal — jangan diam-diam memakai situs lain.
function siteOr400(req, res) {
  const site = resolveSite(req);
  if (!site) res.status(400).json({ error: 'unknown site' });
  return site;
}

// POST /api/admin/login  { username, password }
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!verifyCredentials(username, password)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  issueToken(res, username);
  res.json({ ok: true, user: { username } });
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  clearToken(res);
  res.json({ ok: true });
});

// GET /api/admin/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: { username: req.user.sub } });
});

// GET /api/admin/sites — daftar situs yang dikelola panel (untuk switcher).
router.get('/sites', requireAuth, (req, res) => {
  const sites = Object.values(SITES).map((site) => ({
    id: site.id,
    name: getSettings(site.id).brand.name,
    host: site.hosts[0],
  }));
  res.json({ sites });
});

// GET /api/admin/stats?site=
router.get('/stats', requireAuth, async (req, res) => {
  const site = siteOr400(req, res);
  if (!site) return;
  try {
    const stats = await pagesIndex(site.id).getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/settings?site= — baca pengaturan situs (untuk form admin)
router.get('/settings', requireAuth, (req, res) => {
  const site = siteOr400(req, res);
  if (!site) return;
  res.json(getSettings(site.id));
});

// PUT /api/admin/settings?site= — simpan pengaturan situs
router.put('/settings', requireAuth, (req, res) => {
  const site = siteOr400(req, res);
  if (!site) return;
  try {
    const saved = saveSettings(site.id, req.body || {});
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
