import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import { pagesIndex } from './meili.js';
import { SITE_IDS, DEFAULT_SITE } from './sites.js';

// Identify the bot honestly so site owners can recognize / block it.
export const USER_AGENT =
  'AMAN365Bot/0.1 (+local self-hosted search engine; obeys robots.txt)';

const MAX_CONTENT_CHARS = 5000;

// Observable crawl state, satu per situs (tiap situs maksimal satu job).
function newCrawlState() {
  return {
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
}

export const crawlStates = Object.fromEntries(
  SITE_IDS.map((id) => [id, newCrawlState()])
);

export function getCrawlState(siteId) {
  return crawlStates[siteId] || crawlStates[DEFAULT_SITE];
}

function log(state, msg) {
  state.log.unshift(`${new Date().toLocaleTimeString()}  ${msg}`);
  if (state.log.length > 60) state.log.pop();
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
 * Crawl from seed URLs (breadth-first) and index each HTML page into the
 * site's own index. Resolves when the crawl finishes/stops.
 */
export async function runCrawl(siteId, {
  seeds = [],
  maxPages = 50,
  maxDepth = 2,
  sameHostOnly = true,
  delayMs = 800,
}) {
  const state = getCrawlState(siteId);
  Object.assign(state, {
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
  state.queued = queue.length;
  log(state, `crawl started · ${queue.length} seed(s) · max ${maxPages} pages, depth ${maxDepth}`);

  while (queue.length && state.crawled < maxPages && !state.stopRequested) {
    const { url, depth } = queue.shift();
    state.queued = queue.length;
    state.currentUrl = url;

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
      state.skipped++;
      log(state, `skip (robots.txt): ${url}`);
      continue;
    }

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
        redirect: 'follow',
        signal: AbortSignal.timeout(12000),
      });
      state.crawled++;

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('text/html')) {
        state.skipped++;
        log(state, `skip (${res.status}, ${contentType.split(';')[0] || 'n/a'}): ${url}`);
      } else {
        const { doc, links } = extractPage(res.url, await res.text());
        await pagesIndex(siteId).addDocuments([doc]);
        state.indexed++;
        log(state, `indexed: ${doc.title}`);

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
          state.queued = queue.length;
        }
      }
    } catch (err) {
      state.errors++;
      log(state, `error: ${url} — ${err.message}`);
    }

    await sleep(delayMs);
  }

  state.running = false;
  state.finishedAt = new Date().toISOString();
  state.currentUrl = null;
  log(
    state,
    state.stopRequested
      ? `stopped · ${state.indexed} indexed`
      : `finished · ${state.indexed} indexed, ${state.errors} error(s)`
  );
  return { indexed: state.indexed, crawled: state.crawled };
}

// Fire-and-forget starter used by the API (returns immediately).
export function startCrawl(siteId, opts) {
  const state = getCrawlState(siteId);
  if (state.running) throw new Error('a crawl is already running for this site');
  runCrawl(siteId, opts).catch((err) => {
    state.running = false;
    state.finishedAt = new Date().toISOString();
    log(state, `crawl crashed: ${err.message}`);
  });
  return { ok: true };
}
