import { Router } from 'express';
import { pagesIndex } from '../meili.js';

const router = Router();

// GET /api/search?q=&page=&perPage=
// Public web search across crawled pages, with cropped + highlighted snippets.
router.get('/search', async (req, res) => {
  const { q = '', page = '1', perPage = '10' } = req.query;
  try {
    const result = await pagesIndex().search(q, {
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
