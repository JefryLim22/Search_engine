const BASE = '/api';

async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      /* non-json error */
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export const api = {
  // public web search
  search: (params) => req(`/search?${new URLSearchParams(params)}`),

  // auth
  login: (body) => req('/admin/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => req('/admin/logout', { method: 'POST' }),
  me: () => req('/admin/me'),
  stats: () => req('/admin/stats'),

  // crawl control
  startCrawl: (body) => req('/admin/crawl', { method: 'POST', body: JSON.stringify(body) }),
  crawlStatus: () => req('/admin/crawl/status'),
  stopCrawl: () => req('/admin/crawl/stop', { method: 'POST' }),

  // indexed pages
  pages: (params) => req(`/admin/pages?${new URLSearchParams(params)}`),
  deletePage: (id) => req(`/admin/pages/${id}`, { method: 'DELETE' }),
  clearPages: () => req('/admin/pages', { method: 'DELETE' }),
};
