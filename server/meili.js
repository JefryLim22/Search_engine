import { MeiliSearch } from 'meilisearch';
import { config } from './config.js';
import { SITES, getSite } from './sites.js';

export const client = new MeiliSearch({
  host: config.meiliHost,
  apiKey: config.meiliMasterKey,
});

// Index halaman hasil crawl, per situs (cari -> 'pages', beer -> 'pages_beer').
export const pagesIndex = (siteId) => client.index(getSite(siteId).index);

const INDEX_SETTINGS = {
  searchableAttributes: ['title', 'description', 'content', 'host'],
  filterableAttributes: ['host', 'lang'],
  sortableAttributes: ['crawledAt'],
  rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
  // Keep stored payloads small: content is only used for snippet cropping.
  displayedAttributes: [
    'id',
    'url',
    'host',
    'title',
    'description',
    'content',
    'lang',
    'crawledAt',
  ],
};

export async function ensureIndex() {
  for (const site of Object.values(SITES)) {
    try {
      await client.getIndex(site.index);
    } catch {
      const task = await client.createIndex(site.index, { primaryKey: 'id' });
      await client.waitForTask(task.taskUid);
    }
    await client.index(site.index).updateSettings(INDEX_SETTINGS);
  }
}
