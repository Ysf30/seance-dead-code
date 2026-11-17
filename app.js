// app.js — Séance UI wiring. Runs in the browser as an ES module.
// Acorn is loaded as a classic script (vendor/acorn.js) and read via window.acorn.
import { analyzeFiles, languageOf } from './src/analyze.js';
import { parseGitHubUrl, fetchRepo } from './src/github.js';
import { toMarkdown, download } from './src/export.js';
import { DEMO_FILES } from './fixtures/demo-data.js';

const $ = (id) => document.getElementById(id);
const statusEl = $('status');
const resultsEl = $('results');

let currentResult = null;
const buriedIds = new Set();
let revivalKit = [];
let detailItem = null;

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle('error', isError);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function runAnalysis(files, label) {
  if (!window.acorn || typeof window.acorn.parse !== 'function') {
    setStatus('Parser failed to load (vendor/acorn.js). Reload the page.', true);
    return;
  }
  setStatus(`Analysing ${label}…`);
  try {
    const result = analyzeFiles(files, window.acorn);
    currentResult = result;
    buriedIds.clear();
    revivalKit = [];
    detailItem = null;
    renderResult(result);
    setStatus(result.items.length
      ? `Found ${result.items.length} dead item${result.items.length === 1 ? '' : 's'} in ${result.filesScanned} file${result.filesScanned === 1 ? '' : 's'}.`
      : `No ghosts here — ${result.filesScanned} file${result.filesScanned === 1 ? '' : 's'} scanned, nothing dead found.`);
  } catch (e) {
    setStatus(`Analysis failed: ${e.message}`, true);
  }
}

function renderResult(result) {
  resultsEl.hidden = false;
  $('stats').innerHTML = [
    [result.filesScanned, 'files scanned'],
    [result.filesSkipped.length, 'files skipped'],
    [result.items.length, 'dead items'],
    [result.deadLines, 'lines of dead code'],
  ].map(([n, label]) => `<div class="stat"><b>${n}</b><span>${label}</span></div>`).join('');

  const skippedNote = result.filesSkipped.length
    ? ` Skipped: ${result.filesSkipped.map((s) => `${s.path} (${s.reason})`).join('; ')}.`
    : '';
  const heuristicNote = result.items.some((i) => i.heuristic)
    ? ' Python results are heuristic (regex-based), not AST-exact.'
    : '';
  $('scope-note').textContent =
    'Scope: only the files you supplied were analysed. Exported symbols may have consumers outside this set — check the safety rating before burying.' +
    skippedNote + heuristicNote;

  const yard = $('graveyard');
  if (!result.items.length) {
    yard.innerHTML = '<div class="empty-state">🕊️ No ghosts here. This codebase rests in peace.</div>';
  } else {
    yard.innerHTML = result.items.map((item) => {
      const stateClass = item.state === 'buried' ? ' buried' : item.state === 'resurrected' ? ' resurrected' : '';
      const badge = item.state === 'buried' ? '⚰️ BURIED'
        : item.state === 'resurrected' ? '🌙 RESURRECTED'
        : `✝ ${item.kind.toUpperCase()}`;
      return `<div class="tombstone${stateClass}" data-id="${item.id}" tabindex="0" role="button" aria-label="Tombstone for ${escapeHtml(item.name)}">
        <div class="rip">R.I.P.</div>
        <div class="tomb-name">${escapeHtml(item.name)}</div>
        <div class="tomb-meta">${escapeHtml(item.file)}:${item.line}</div>
        <div><span class="badge kind-${item.kind}">${badge}</span></div>
      </div>`;
    }).join('');
  }
  $('detail').hidden = true;
  renderLists();
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderLists() {
  if (!currentResult) return;
  const buried = currentResult.items.filter((i) => i.state === 'buried');
  $('burial-count').textContent = buried.length;
  $('burial-list').innerHTML = buried.length
    ? buried.map((i) => `<li><code>${escapeHtml(i.name)}</code> — ${escapeHtml(i.file)}:${i.line}</li>`).join('')
    : '<li>Nothing buried yet.</li>';
  $('revival-count').textContent = revivalKit.length;
  $('revival-list').innerHTML = revivalKit.length
    ? revivalKit.map((i) => `<li><code>${escapeHtml(i.name)}</code> — ${escapeHtml(i.file)}:${i.line}</li>`).join('')
    : '<li>Nothing resurrected yet.</li>';
}

function openDetail(id) {
  const item = currentResult.items.find((i) => i.id === id);
  if (!item) return;
  detailItem = item;
  $('detail-title').textContent = `🪦 ${item.name}`;
  $('detail-meta').textContent = `${item.file}:${item.line} · kind: ${item.kind} · state: ${item.state}${item.heuristic ? ' · heuristic Python scan' : ''}`;
  $('detail-snippet').textContent = item.snippet || '(no snippet)';
  $('detail-cause').textContent = `Cause of death: ${item.cause}.`;
  $('detail-explanation').textContent = item.explanation.text;
  $('detail-safety').textContent = `Deletion safety: ${item.explanation.safety.toUpperCase()}.`;
  $('detail').hidden = false;
  $('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function refreshTombstone(item) {
  const el = document.querySelector(`.tombstone[data-id="${item.id}"]`);
  if (!el) return;
  el.classList.toggle('buried', item.state === 'buried');
  el.classList.toggle('resurrected', item.state === 'resurrected');
  const badge = el.querySelector('.badge');
  badge.textContent = item.state === 'buried' ? '⚰️ BURIED'
    : item.state === 'resurrected' ? '🌙 RESURRECTED'
    : `✝ ${item.kind.toUpperCase()}`;
}

// --- Input flows ---

$('btn-analyze-url').addEventListener('click', async () => {
  const url = $('repo-url').value.trim();
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    setStatus('That does not look like a GitHub repository URL. Example: https://github.com/owner/repo', true);
    return;
  }
  setStatus(`Fetching ${parsed.owner}/${parsed.repo} from GitHub…`);
  try {
    const { files, skipped } = await fetchRepo(parsed.owner, parsed.repo);
    if (!files.length) {
      setStatus('No analysable code files found in that repo (looking for .js/.jsx/.ts/.tsx/.mjs/.py).', true);
      return;
    }
    const result = analyzeFiles(files, window.acorn);
    result.filesSkipped = [...(result.filesSkipped || []), ...skipped];
    currentResult = result;
    buriedIds.clear();
    revivalKit = [];
    renderResult(result);
    setStatus(`Found ${result.items.length} dead items in ${result.filesScanned} files from ${parsed.owner}/${parsed.repo}.`);
  } catch (e) {
    setStatus(e.message, true);
  }
});

$('btn-analyze-files').addEventListener('click', async () => {
  const input = $('file-input');
  if (!input.files || !input.files.length) {
    setStatus('Choose one or more code files first.', true);
    return;
  }
  setStatus('Reading files…');
  const files = [];
  for (const f of input.files) {
    if (!languageOf(f.name)) continue;
    files.push({ path: f.name, source: await f.text() });
  }
  if (!files.length) {
    setStatus('No analysable files selected (looking for .js/.jsx/.ts/.tsx/.mjs/.py).', true);
    return;
  }
  runAnalysis(files, `${files.length} uploaded file${files.length === 1 ? '' : 's'}`);
});

$('btn-analyze-paste').addEventListener('click', () => {
  const source = $('paste-box').value;
  if (!source.trim()) {
    setStatus('Paste some code first.', true);
    return;
  }
  const ext = $('paste-ext').value;
  runAnalysis([{ path: `pasted.${ext}`, source }], 'pasted code');
});

$('btn-demo').addEventListener('click', () => {
  runAnalysis(DEMO_FILES.map((f) => ({ ...f })), 'the demo repo');
});

// --- Graveyard interactions (event delegation) ---

$('graveyard').addEventListener('click', (e) => {
  const stone = e.target.closest('.tombstone');
  if (stone) openDetail(stone.dataset.id);
});
$('graveyard').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    const stone = e.target.closest('.tombstone');
    if (stone) { e.preventDefault(); openDetail(stone.dataset.id); }
  }
});

$('detail-close').addEventListener('click', () => { $('detail').hidden = true; detailItem = null; });

$('detail-bury').addEventListener('click', () => {
  if (!detailItem) return;
  detailItem.state = detailItem.state === 'buried' ? 'open' : 'buried';
  if (detailItem.state === 'buried') buriedIds.add(detailItem.id);
  else buriedIds.delete(detailItem.id);
  refreshTombstone(detailItem);
  renderLists();
  openDetail(detailItem.id);
});

$('detail-resurrect').addEventListener('click', () => {
  if (!detailItem) return;
  detailItem.state = detailItem.state === 'resurrected' ? 'open' : 'resurrected';
  if (detailItem.state === 'resurrected' && !revivalKit.some((i) => i.id === detailItem.id)) {
    revivalKit.push(detailItem);
  } else if (detailItem.state !== 'resurrected') {
    revivalKit = revivalKit.filter((i) => i.id !== detailItem.id);
  }
  refreshTombstone(detailItem);
  renderLists();
  openDetail(detailItem.id);
});

// --- Export ---

$('btn-export-md').addEventListener('click', () => {
  if (!currentResult) return;
  download('seance-report.md', toMarkdown(currentResult, buriedIds, revivalKit), 'text/markdown');
});

$('btn-export-json').addEventListener('click', () => {
  if (!currentResult) return;
  download('seance-result.json', JSON.stringify(currentResult, null, 2), 'application/json');
});
