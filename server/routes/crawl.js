import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { startCrawl, crawlState } from '../crawler.js';
import { pagesIndex } from '../meili.js';

const router = Router();
router.use(requireAuth);

// POST /api/admin/crawl  { seeds, maxPages, maxDepth, sameHostOnly, delayMs }
router.post('/crawl', (req, res) => {
  const {
    seeds = [],
    maxPages = 50,
    maxDepth = 2,
    sameHostOnly = true,
    delayMs = 800,
  } = req.body || {};

  const list = (Array.isArray(seeds) ? seeds : String(seeds).split(/\s+/))
    .map((s) => s.trim())
    .filter(Boolean);
  if (!list.length) return res.status(400).json({ error: 'at least one seed URL is required' });

  try {
    startCrawl({
      seeds: list,
      maxPages: Math.min(2000, Math.max(1, Number(maxPages) || 50)),
      maxDepth: Math.min(5, Math.max(0, Number(maxDepth) ?? 2)),
      sameHostOnly: sameHostOnly !== false,
      delayMs: Math.max(200, Number(delayMs) || 800),
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// GET /api/admin/crawl/status
router.get('/crawl/status', (req, res) => res.json(crawlState));

// POST /api/admin/crawl/stop
router.post('/crawl/stop', (req, res) => {
  crawlState.stopRequested = true;
  res.json({ ok: true });
});

// GET /api/admin/pages?q=&page=&perPage=  (browse the index)
router.get('/pages', async (req, res) => {
  const { q = '', page = '1', perPage = '20' } = req.query;
  try {
    const result = await pagesIndex().search(q, {
      page: Math.max(1, Number(page) || 1),
      hitsPerPage: Math.min(100, Number(perPage) || 20),
      sort: ['crawledAt:desc'],
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/pages/:id  (remove one page)
router.delete('/pages/:id', async (req, res) => {
  try {
    await pagesIndex().deleteDocument(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/pages  (clear the whole index)
router.delete('/pages', async (req, res) => {
  try {
    await pagesIndex().deleteAllDocuments();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
