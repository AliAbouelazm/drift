const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }
  const resp = await fetch(`${BASE_URL}${path}`, opts);
  if (!resp.ok) {
    const error = await resp.json().catch(() => ({ detail: resp.statusText }));
    throw new Error(error.detail || resp.statusText);
  }
  return resp.json();
}

async function fetchRedditPosts(name) {
  const url = `https://www.reddit.com/r/${name}/hot.json?limit=100`;
  const resp = await fetch(url);
  if (resp.status === 404) throw new Error(`Subreddit r/${name} not found`);
  if (resp.status === 403) throw new Error(`Subreddit r/${name} is private or quarantined`);
  if (!resp.ok) throw new Error(`Reddit returned ${resp.status}`);

  const data = await resp.json();
  const children = data?.data?.children || [];
  const posts = [];
  for (const child of children) {
    const d = child?.data || {};
    let text = (d.selftext || '').trim();
    if (!text || text === '[removed]' || text === '[deleted]') {
      text = (d.title || '').trim();
    }
    if (!text) continue;
    const timestamp = new Date(d.created_utc * 1000).toISOString();
    posts.push({ text, timestamp });
  }
  if (posts.length === 0) throw new Error(`No usable posts found in r/${name}`);
  return posts;
}

export const analyzeText = (text) => request('POST', '/analyze', { text });
export const analyzeBatch = (texts) => request('POST', '/analyze/batch', { texts });
export const fetchModelMetrics = () => request('GET', '/model/metrics');

export async function fetchSubreddit(name) {
  try {
    const posts = await fetchRedditPosts(name);
    return request('POST', '/analyze/subreddit', { subreddit: name, posts });
  } catch {
    return request('GET', `/subreddit/${encodeURIComponent(name)}`);
  }
}
