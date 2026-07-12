import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { ensureIndex } from './meili.js';
import searchRoutes from './routes/search.js';
import adminRoutes from './routes/admin.js';
import crawlRoutes from './routes/crawl.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '4mb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Public web search + admin (auth + crawl control + pages) APIs
app.use('/api', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', crawlRoutes);

// Serve the built SPA in production (dist/ is created by `npm run build`).
const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'not found' });
  }
  res.sendFile(path.join(distDir, 'index.html'));
});

async function start() {
  try {
    await ensureIndex();
    console.log('[meili] index ready');
  } catch (err) {
    console.warn(
      `[meili] could not initialize index (is Meilisearch running?): ${err.message}`
    );
  }
  app.listen(config.port, () => {
    console.log(`[api] listening on http://localhost:${config.port}`);
  });
}

start();
