import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import { pagesIndex } from './meili.js';

// Identify the bot honestly so site owners can recognize / block it.
export const USER_AGENT =
  'AMAN365Bot/0.1 (+local self-hosted search engine; obeys robots.txt)';

const MAX_CONTENT_CHARS = 5000;

// Shared, observable crawl state (single crawl job at a time).
export const crawlState = {
  running: false,
  startedAt: null,
  finishedAt: null,
  crawled: 0,
  indexed: 0,
  errors: 0,
  skipped: 0,
  queued: 0,
  maxPages: 0,
  currentUrl: null,
  stopRequested: false,
  log: [],
};

function log(msg) {
  crawlState.log.unshift(`${new Date().toLocaleTimeString()}  ${msg}`);
  if (crawlState.log.length > 60) crawlState.log.pop();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const urlId = (url) => createHash('sha1').update(url).digest('hex');

function normalizeUrl(raw, base) {
  try {
    const u = new URL(raw, base);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    u.hash = '';
    return u.toString();
  } catch {
    return null;
  }
}

// --- robots.txt (simplified: honors Disallow for our UA and for '*') ---
function parseRobots(text) {
  const disallow = [];
  let applies = false;
  for (let line of text.split(/\r?\n/)) {
    line = line.replace(/#.*$/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (field === 'user-agent') {
      applies = value === '*' || USER_AGENT.toLowerCase().includes(value.toLowerCase());
    } else if (field === 'disallow' && applies && value) {
      disallow.push(value);
    }
  }
  return disallow;
}

async function fetchRobots(origin) {
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    return parseRobots(await res.text());
  } catch {
    return [];
  }
}

const isAllowed = (pathname, disallow) =>
  !disallow.some((d) => d === '/' || pathname.startsWith(d));

// --- page extraction ---
function extractPage(finalUrl, html) {
  const $ = cheerio.load(html);
  $('script, style, noscript, svg, template, iframe').remove();

  const u = new URL(finalUrl);
  const title = ($('title').first().text() || '').trim().slice(0, 300) || u.host;
  const description = ($('meta[name="description"]').attr('content') || '')
    .trim()
    .slice(0, 500);
  const lang = ($('html').attr('lang') || '').slice(0, 10);
  const content = $('body').text().replace(/\s+/g, ' ').trim().slice(0, MAX_CONTENT_CHARS);

  const links = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) links.push(href);
  });

  const doc = {
    id: urlId(finalUrl),
    url: finalUrl,
    host: u.host,
    title,
    description,
    lang,
    content,
    crawledAt: new Date().toISOString(),
  };
  return { doc, links };
}

/**
 * Crawl from seed URLs (breadth-first) and index each HTML page.
 * Resolves when the crawl finishes/stops.
 */
export async function runCrawl({
  seeds = [],
  maxPages = 50,
  maxDepth = 2,
  sameHostOnly = true,
  delayMs = 800,
}) {
  Object.assign(crawlState, {
    running: true,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    crawled: 0,
    indexed: 0,
    errors: 0,
    skipped: 0,
    queued: 0,
    maxPages,
    currentUrl: null,
    stopRequested: false,
    log: [],
  });

  const queue = [];
  const seen = new Set();
  const robotsCache = new Map();
  const seedHosts = new Set();

  for (const s of seeds) {
    const n = normalizeUrl(s);
    if (n && !seen.has(n)) {
      seen.add(n);
      queue.push({ url: n, depth: 0 });
      try {
        seedHosts.add(new URL(n).host);
      } catch {
        /* ignore */
      }
    }
  }
  crawlState.queued = queue.length;
  log(`crawl started · ${queue.length} seed(s) · max ${maxPages} pages, depth ${maxDepth}`);

  while (queue.length && crawlState.crawled < maxPages && !crawlState.stopRequested) {
    const { url, depth } = queue.shift();
    crawlState.queued = queue.length;
    crawlState.currentUrl = url;

    let origin;
    let host;
    let pathname;
    try {
      const u = new URL(url);
      origin = u.origin;
      host = u.host;
      pathname = u.pathname;
    } catch {
      continue;
    }

    if (!robotsCache.has(origin)) robotsCache.set(origin, await fetchRobots(origin));
    if (!isAllowed(pathname, robotsCache.get(origin))) {
      crawlState.skipped++;
      log(`skip (robots.txt): ${url}`);
      continue;
    }

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
        redirect: 'follow',
        signal: AbortSignal.timeout(12000),
      });
      crawlState.crawled++;

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('text/html')) {
        crawlState.skipped++;
        log(`skip (${res.status}, ${contentType.split(';')[0] || 'n/a'}): ${url}`);
      } else {
        const { doc, links } = extractPage(res.url, await res.text());
        await pagesIndex().addDocuments([doc]);
        crawlState.indexed++;
        log(`indexed: ${doc.title}`);

        if (depth < maxDepth) {
          for (const raw of links) {
            const n = normalizeUrl(raw, res.url);
            if (!n || seen.has(n)) continue;
            try {
              if (sameHostOnly && !seedHosts.has(new URL(n).host)) continue;
            } catch {
              continue;
            }
            seen.add(n);
            queue.push({ url: n, depth: depth + 1 });
          }
          crawlState.queued = queue.length;
        }
      }
    } catch (err) {
      crawlState.errors++;
      log(`error: ${url} — ${err.message}`);
    }

    await sleep(delayMs);
  }

  crawlState.running = false;
  crawlState.finishedAt = new Date().toISOString();
  crawlState.currentUrl = null;
  log(
    crawlState.stopRequested
      ? `stopped · ${crawlState.indexed} indexed`
      : `finished · ${crawlState.indexed} indexed, ${crawlState.errors} error(s)`
  );
  return { indexed: crawlState.indexed, crawled: crawlState.crawled };
}

// Fire-and-forget starter used by the API (returns immediately).
export function startCrawl(opts) {
  if (crawlState.running) throw new Error('a crawl is already running');
  runCrawl(opts).catch((err) => {
    crawlState.running = false;
    crawlState.finishedAt = new Date().toISOString();
    log(`crawl crashed: ${err.message}`);
  });
  return { ok: true };
}
