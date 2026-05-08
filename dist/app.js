const DEFAULT_SOURCES = ['openverse', 'wikimedia', 'nasa'];
const STORAGE_KEY = 'edu-image-finder:selected:v2';

const stopWords = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'into', 'onto', 'what', 'when', 'where', 'which', 'using',
  'use', 'used', 'about', 'below', 'above', 'following', 'shown', 'shows', 'question', 'students', 'marks', 'mark',
  'explain', 'describe', 'identify', 'compare', 'contrast', 'label', 'labelled', 'labeled', 'image', 'diagram', 'figure'
]);

let results = [];
let selected = loadSelected();

const el = {
  form: document.getElementById('searchForm'),
  query: document.getElementById('query'),
  questionText: document.getElementById('questionText'),
  imageType: document.getElementById('imageType'),
  licence: document.getElementById('licence'),
  searchButton: document.getElementById('searchButton'),
  generateTerms: document.getElementById('generateTerms'),
  createPlaceholder: document.getElementById('createPlaceholder'),
  clearTray: document.getElementById('clearTray'),
  copyAttributions: document.getElementById('copyAttributions'),
  copyJson: document.getElementById('copyJson'),
  savedCount: document.getElementById('savedCount'),
  savedList: document.getElementById('savedList'),
  resultsGrid: document.getElementById('resultsGrid'),
  resultsTitle: document.getElementById('resultsTitle'),
  errorBox: document.getElementById('errorBox'),
  toast: document.getElementById('toast')
};

el.form.addEventListener('submit', searchImages);
el.generateTerms.addEventListener('click', useQuestionText);
el.createPlaceholder.addEventListener('click', createPlaceholder);
el.clearTray.addEventListener('click', () => {
  selected = [];
  saveSelected();
  renderSaved();
  renderResults();
  showToast('Image tray cleared');
});
el.copyAttributions.addEventListener('click', exportAttributions);
el.copyJson.addEventListener('click', exportJson);

renderSaved();

function loadSelected() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSelected() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
  } catch {
    // localStorage can fail in private browsing; the app can still work without persistence.
  }
}

function sourceValues() {
  return Array.from(document.querySelectorAll('input[name="sources"]:checked')).map((input) => input.value);
}

async function searchImages(event) {
  event.preventDefault();
  const query = el.query.value.trim();
  if (query.length < 2) {
    showToast('Enter a more specific search term');
    return;
  }

  const sources = sourceValues();
  if (!sources.length) {
    showToast('Select at least one source');
    return;
  }

  setLoading(true);
  clearErrors();
  renderSkeletons();

  try {
    const params = new URLSearchParams({
      q: query,
      type: el.imageType.value,
      licence: el.licence.value,
      sources: sources.join(','),
      limit: '24'
    });

    const response = await fetch(`/api/search?${params.toString()}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Search failed with ${response.status}`);
    }

    results = data.results || [];
    renderErrors(data.errors || []);
    renderResults();

    if (!results.length) showToast('No results matched the current filters');
  } catch (error) {
    results = [];
    renderErrors([{ source: 'app', message: error.message }]);
    renderResults('Search failed');
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  el.searchButton.disabled = isLoading;
  el.searchButton.textContent = isLoading ? 'Searching…' : 'Search';
  if (isLoading) el.resultsTitle.textContent = 'Searching sources…';
}

function renderSkeletons() {
  el.resultsGrid.innerHTML = Array.from({ length: 8 }).map(() => '<div class="skeleton"></div>').join('');
}

function renderResults(customTitle) {
  const savedIds = new Set(selected.map((item) => item.id));
  el.resultsTitle.textContent = customTitle || `${results.length} images found`;

  if (!results.length) {
    el.resultsGrid.innerHTML = `<div class="empty-state"><h3>No results displayed.</h3><p>Try a more specific search, loosen the licence filter, or create a placeholder.</p></div>`;
    return;
  }

  el.resultsGrid.innerHTML = results.map((item) => resultCardHtml(item, savedIds.has(item.id))).join('');

  el.resultsGrid.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const item = results.find((candidate) => candidate.id === id);
      if (!item) return;
      const action = button.dataset.action;
      if (action === 'save') addSelected(item);
      if (action === 'copy-attribution') copyText(item.attribution);
      if (action === 'copy-html') copyText(buildEmbedHtml(item));
    });
  });
}

function resultCardHtml(item, isSaved) {
  return `<article class="result-card">
    <div class="image-wrap"><img src="${escapeAttr(safeUrl(item.thumbUrl || item.imageUrl))}" alt="${escapeAttr(item.title || 'Image')}" loading="lazy"></div>
    <div class="card-body">
      <div class="badge-row">
        <span class="badge ${escapeAttr(item.license || '')}">${escapeHtml(item.licenseLabel || 'Licence')}</span>
        <span class="badge light">${escapeHtml(item.sourceName || item.source || 'Source')}</span>
      </div>
      <h3>${escapeHtml(item.title || 'Untitled image')}</h3>
      <p>${escapeHtml(item.description || 'No description supplied.')}</p>
      <dl>
        <div><dt>Creator</dt><dd>${escapeHtml(item.creator || 'Unknown')}</dd></div>
        <div><dt>Size</dt><dd>${item.width && item.height ? `${escapeHtml(item.width)} × ${escapeHtml(item.height)}` : 'Not supplied'}</dd></div>
      </dl>
      <div class="card-actions">
        <button class="primary" data-action="save" data-id="${escapeAttr(item.id)}" ${isSaved ? 'disabled' : ''}>${isSaved ? 'Saved' : 'Use image'}</button>
        <button class="secondary" data-action="copy-attribution" data-id="${escapeAttr(item.id)}">Copy attribution</button>
        <button class="secondary" data-action="copy-html" data-id="${escapeAttr(item.id)}">Copy HTML</button>
      </div>
      <div class="link-row">
        <a href="${escapeAttr(safeUrl(item.imageUrl))}" target="_blank" rel="noreferrer">Open image</a>
        ${item.landingUrl ? `<a href="${escapeAttr(safeUrl(item.landingUrl))}" target="_blank" rel="noreferrer">Open source page</a>` : ''}
        ${item.licenseUrl ? `<a href="${escapeAttr(safeUrl(item.licenseUrl))}" target="_blank" rel="noreferrer">Licence</a>` : ''}
      </div>
    </div>
  </article>`;
}

function renderSaved() {
  el.savedCount.textContent = String(selected.length);
  const hasItems = selected.length > 0;
  el.clearTray.disabled = !hasItems;
  el.copyAttributions.disabled = !hasItems;
  el.copyJson.disabled = !hasItems;

  if (!hasItems) {
    el.savedList.innerHTML = '<p class="muted">Saved images and placeholders will appear here.</p>';
    return;
  }

  el.savedList.innerHTML = selected.map((item) => `<article class="saved-item">
    <img src="${escapeAttr(safeUrl(item.thumbUrl || item.imageUrl))}" alt="" loading="lazy">
    <div>
      <strong>${escapeHtml(item.title || 'Untitled image')}</strong>
      <span>${escapeHtml(item.licenseLabel || 'Licence')}</span>
      <div class="mini-actions">
        <button data-saved-action="copy-html" data-id="${escapeAttr(item.id)}">Copy HTML</button>
        <button data-saved-action="copy-attribution" data-id="${escapeAttr(item.id)}">Copy attribution</button>
        <button data-saved-action="remove" data-id="${escapeAttr(item.id)}">Remove</button>
      </div>
    </div>
  </article>`).join('');

  el.savedList.querySelectorAll('[data-saved-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = selected.find((candidate) => candidate.id === button.dataset.id);
      const action = button.dataset.savedAction;
      if (action === 'remove') removeSelected(button.dataset.id);
      if (!item) return;
      if (action === 'copy-html') copyText(buildEmbedHtml(item));
      if (action === 'copy-attribution') copyText(item.attribution);
    });
  });
}

function addSelected(item) {
  if (selected.some((saved) => saved.id === item.id)) return;
  selected = [item, ...selected].slice(0, 30);
  saveSelected();
  renderSaved();
  renderResults();
  showToast('Saved to image tray');
}

function removeSelected(id) {
  selected = selected.filter((item) => item.id !== id);
  saveSelected();
  renderSaved();
  renderResults();
  showToast('Removed from image tray');
}

function exportAttributions() {
  const text = selected.length
    ? selected.map((item, index) => `${index + 1}. ${item.attribution}`).join('\n')
    : 'No saved images yet.';
  copyText(text);
}

function exportJson() {
  const payload = selected.map((item) => ({
    type: 'educational-image',
    title: item.title,
    imageUrl: item.imageUrl,
    thumbUrl: item.thumbUrl,
    source: item.sourceName,
    sourceUrl: item.landingUrl,
    creator: item.creator,
    licence: item.licenseLabel,
    licenceUrl: item.licenseUrl,
    attribution: item.attribution,
    importedAt: new Date().toISOString()
  }));
  copyText(JSON.stringify(payload, null, 2));
}

function createPlaceholder() {
  const query = el.query.value.trim() || 'image needed';
  const type = el.imageType.value;
  const src = buildPlaceholderSvg(query, type);
  addSelected({
    id: `placeholder-${Date.now()}`,
    source: 'placeholder',
    sourceName: 'Teacher-created placeholder',
    title: `Placeholder: ${query}`,
    description: 'Placeholder inserted until a suitable image is selected.',
    creator: 'Created in Educational Image Finder',
    imageUrl: src,
    thumbUrl: src,
    landingUrl: '',
    license: 'placeholder',
    licenseLabel: 'Teacher-created placeholder',
    licenseUrl: '',
    attribution: `Placeholder created by teacher for: ${query}.`
  });
}

function useQuestionText() {
  const derived = deriveSearchTerms(el.questionText.value);
  if (derived) {
    el.query.value = derived;
    showToast('Search terms generated from question text');
  } else {
    showToast('Paste more question text first');
  }
}

function deriveSearchTerms(questionText) {
  const words = questionText
    .toLowerCase()
    .replace(/[−–—]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  const counts = new Map();
  words.forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
  const ranked = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, 8)
    .map(([word]) => word);

  const text = questionText.toLowerCase();
  const boosters = [];
  if (/meiosis|mitosis|chromosome|dna|gene|karyotype|cell|membrane|enzyme|ecosystem|food web/.test(text)) boosters.push('biology');
  if (/ionic|covalent|molecule|atom|bond|reaction|precipitate|acid|base|titration/.test(text)) boosters.push('chemistry');
  if (/force|velocity|energy|circuit|wave|resistance|voltage|current|magnet/.test(text)) boosters.push('physics');
  if (/planet|moon|eclipse|tide|galaxy|star|season|earth|orbit/.test(text)) boosters.push('astronomy');

  return Array.from(new Set([...ranked, ...boosters])).join(' ');
}

function buildPlaceholderSvg(query, type) {
  const label = escapeHtml(query || 'Image placeholder');
  const kind = escapeHtml(type || 'diagram');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
    <rect width="1200" height="720" rx="32" fill="#f8fafc"/>
    <rect x="56" y="56" width="1088" height="608" rx="28" fill="#ffffff" stroke="#cbd5e1" stroke-width="6" stroke-dasharray="24 18"/>
    <circle cx="600" cy="268" r="78" fill="#e2e8f0"/>
    <path d="M546 404h108m-54-54v108" stroke="#64748b" stroke-width="20" stroke-linecap="round"/>
    <text x="600" y="515" text-anchor="middle" font-family="Inter, Arial" font-size="38" font-weight="700" fill="#0f172a">Image placeholder</text>
    <text x="600" y="570" text-anchor="middle" font-family="Inter, Arial" font-size="28" fill="#475569">${label}</text>
    <text x="600" y="617" text-anchor="middle" font-family="Inter, Arial" font-size="22" fill="#64748b">Type: ${kind}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildEmbedHtml(item) {
  return `<figure class="test-image">
  <img src="${safeUrl(item.imageUrl)}" alt="${escapeHtml(item.title || 'Image')}" />
  <figcaption>${escapeHtml(item.attribution || 'Attribution required.')}</figcaption>
</figure>`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
  } catch {
    showToast('Copy failed — select and copy manually');
  }
}

function renderErrors(errors) {
  const meaningful = errors.filter((err) => err && err.message);
  if (!meaningful.length) {
    clearErrors();
    return;
  }
  el.errorBox.classList.remove('hidden');
  el.errorBox.innerHTML = `<strong>Search notes</strong>${meaningful.map((err) => `<p>${escapeHtml(err.source || 'source')}: ${escapeHtml(err.message)}</p>`).join('')}`;
}

function clearErrors() {
  el.errorBox.classList.add('hidden');
  el.errorBox.innerHTML = '';
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.remove('hidden');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => el.toast.classList.add('hidden'), 2300);
}

function safeUrl(url) {
  if (!url) return '#';
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'data:'].includes(parsed.protocol) ? url : '#';
  } catch {
    return '#';
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#096;');
}
