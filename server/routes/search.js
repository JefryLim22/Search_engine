import { Router } from 'express';
import { pagesIndex } from '../meili.js';
import { getSettings } from '../settings.js';
import { resolveSite } from '../sites.js';

const router = Router();

// GET /api/settings — identitas situs + kontak publik untuk homepage.
// Situs ditentukan dari subdomain yang diakses (Host header).
router.get('/settings', (req, res) => {
  const site = resolveSite(req);
  if (!site) return res.status(400).json({ error: 'unknown site' });
  const s = getSettings(site.id);
  // Seluruh isi di bawah memang tampil di homepage publik — aman dipaparkan.
  res.json({
    site: { id: site.id, name: s.brand.name },
    recommended: s.recommended,
    contacts: s.contacts,
  });
});

// GET /api/search?q=&page=&perPage=
// Public web search across crawled pages, with cropped + highlighted snippets.
// Tiap subdomain mencari di index miliknya sendiri.
router.get('/search', async (req, res) => {
  const site = resolveSite(req);
  if (!site) return res.status(400).json({ error: 'unknown site' });
  const { q = '', page = '1', perPage = '10' } = req.query;
  try {
    const result = await pagesIndex(site.id).search(q, {
      page: Math.max(1, Number(page) || 1),
      hitsPerPage: Math.min(50, Math.max(1, Number(perPage) || 10)),
      attributesToHighlight: ['title', 'content'],
      attributesToCrop: ['content'],
      cropLength: 45,
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
