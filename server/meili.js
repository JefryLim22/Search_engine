import { MeiliSearch } from 'meilisearch';
import { config } from './config.js';

export const client = new MeiliSearch({
  host: config.meiliHost,
  apiKey: config.meiliMasterKey,
});

// The index stores crawled web pages.
export const pagesIndex = () => client.index(config.meiliIndex);

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
  try {
    await client.getIndex(config.meiliIndex);
  } catch {
    const task = await client.createIndex(config.meiliIndex, { primaryKey: 'id' });
    await client.waitForTask(task.taskUid);
  }
  await pagesIndex().updateSettings(INDEX_SETTINGS);
}
