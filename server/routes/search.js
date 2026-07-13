import { Router } from 'express';
import { pagesIndex } from '../meili.js';
import { getSettings } from '../settings.js';

const router = Router();

// GET /api/settings — pengaturan kontak publik (WA & Live Chat) untuk homepage.
router.get('/settings', (req, res) => {
  const s = getSettings();
  // Hanya paparkan field yang aman untuk publik.
  res.json({
    whatsappNumber: s.whatsappNumber,
    whatsappMessage: s.whatsappMessage,
    whatsappNumber2: s.whatsappNumber2,
    whatsappMessage2: s.whatsappMessage2,
    telegramUsername: s.telegramUsername,
    liveChatUrl: s.liveChatUrl,
  });
});

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
