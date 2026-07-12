import { Router } from 'express';
import {
  verifyCredentials,
  issueToken,
  clearToken,
  requireAuth,
} from '../auth.js';
import { pagesIndex } from '../meili.js';
import { getSettings, saveSettings } from '../settings.js';

const router = Router();

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

// GET /api/admin/stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const stats = await pagesIndex().getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/settings — baca pengaturan kontak (untuk form admin)
router.get('/settings', requireAuth, (req, res) => {
  res.json(getSettings());
});

// PUT /api/admin/settings — simpan pengaturan kontak
router.put('/settings', requireAuth, (req, res) => {
  try {
    const saved = saveSettings(req.body || {});
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
