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

export const analyzeText = (text) => request('POST', '/analyze', { text });
export const analyzeBatch = (texts) => request('POST', '/analyze/batch', { texts });
export const fetchModelMetrics = () => request('GET', '/model/metrics');
export const fetchSubreddit = (name) => request('GET', `/subreddit/${encodeURIComponent(name)}`);
