// github.js — fetch a public repo via the unauthenticated GitHub REST API.
// No token is used or requested. Rate limit (unauthenticated): 60 req/hour.
// File contents come from raw.githubusercontent.com (no API quota).

const MAX_FILES = 100;
const MAX_FILE_BYTES = 200 * 1024;
const CODE_EXT = new Set(['js', 'jsx', 'ts', 'tsx', 'mjs', 'py']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'vendor', '__pycache__', 'coverage']);

export function parseGitHubUrl(url) {
  const m = url.trim().match(/^https?:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?(?:\/.*)?$/);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (res.status === 403) {
    const remaining = res.headers.get('x-ratelimit-remaining');
    if (remaining === '0') throw new Error('GitHub API rate limit hit (60 requests/hour unauthenticated). Paste code or upload files instead.');
    throw new Error(`GitHub request failed (HTTP ${res.status}).`);
  }
  if (res.status === 404) throw new Error('Repository not found on GitHub. Check the URL and that the repo is public.');
  if (!res.ok) throw new Error(`GitHub request failed (HTTP ${res.status}).`);
  return res.json();
}

// Returns {files: [{path, source}], skipped: [{path, reason}]}.
export async function fetchRepo(owner, repo) {
  const meta = await getJson(`https://api.github.com/repos/${owner}/${repo}`);
  const branch = meta.default_branch || 'main';
  const tree = await getJson(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  if (tree.truncated) throw new Error('Repository is too large to analyse (tree truncated). Upload files instead.');
  const codeFiles = (tree.tree || [])
    .filter((e) => e.type === 'blob')
    .filter((e) => {
      const parts = e.path.split('/');
      if (parts.some((p) => SKIP_DIRS.has(p))) return false;
      const ext = e.path.split('.').pop().toLowerCase();
      return CODE_EXT.has(ext);
    })
    .slice(0, MAX_FILES);

  const files = [];
  const skipped = [];
  for (const entry of codeFiles) {
    if (entry.size && entry.size > MAX_FILE_BYTES) {
      skipped.push({ path: entry.path, reason: 'file too large (>200 KB)' });
      continue;
    }
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${entry.path}`);
      if (!res.ok) { skipped.push({ path: entry.path, reason: `fetch failed (HTTP ${res.status})` }); continue; }
      const source = await res.text();
      if (source.length > MAX_FILE_BYTES) { skipped.push({ path: entry.path, reason: 'file too large (>200 KB)' }); continue; }
      files.push({ path: entry.path, source });
    } catch (e) {
      skipped.push({ path: entry.path, reason: `fetch failed: ${e.message}` });
    }
  }
  return { files, skipped };
}
