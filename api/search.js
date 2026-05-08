const OPENVERSE_ENDPOINT = 'https://api.openverse.org/v1/images/';
const WIKIMEDIA_ENDPOINT = 'https://commons.wikimedia.org/w/api.php';
const NASA_ENDPOINT = 'https://images-api.nasa.gov/search';

const ALLOWED_LICENSES = new Set(['pdm', 'cc0', 'by', 'by-sa', 'by-nc', 'by-nc-sa', 'nasa']);

const LICENSE_RANK = {
  pdm: 100,
  cc0: 98,
  nasa: 92,
  by: 88,
  'by-sa': 82,
  'by-nc': 68,
  'by-nc-sa': 64,
  unknown: 10
};

const SOURCE_RANK = {
  wikimedia: 9,
  openverse: 8,
  nasa: 8
};

function cleanText(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normaliseLicence(value = '') {
  const v = String(value).toLowerCase().replace(/^cc-/, '').replace(/\s+/g, '-');
  if (v.includes('public-domain') || v.includes('pdm') || v === 'pd' || v === 'publicdomain') return 'pdm';
  if (v.includes('cc0') || v.includes('zero')) return 'cc0';
  if (v.includes('by-nc-sa')) return 'by-nc-sa';
  if (v.includes('by-nc')) return 'by-nc';
  if (v.includes('by-sa')) return 'by-sa';
  if (v === 'by' || v.includes('cc-by-4') || v.includes('cc-by-3') || v.includes('attribution')) return 'by';
  if (v.includes('nasa')) return 'nasa';
  return 'unknown';
}

function licenceLabel(code) {
  const labels = {
    pdm: 'Public domain',
    cc0: 'CC0',
    by: 'CC BY',
    'by-sa': 'CC BY-SA',
    'by-nc': 'CC BY-NC',
    'by-nc-sa': 'CC BY-NC-SA',
    nasa: 'NASA educational/informational use',
    unknown: 'Unknown'
  };
  return labels[code] || code;
}

function buildAttribution(item) {
  const title = item.title || 'Untitled image';
  const creator = item.creator || item.sourceName || 'Unknown creator';
  const licence = licenceLabel(item.license);
  const source = item.sourceName || item.source;
  return `${title} — ${creator}, ${source}, ${licence}. Source: ${item.landingUrl || item.imageUrl}`;
}

function inferFit({ title, description, query, imageType }) {
  const haystack = `${title || ''} ${description || ''}`.toLowerCase();
  const qTerms = String(query)
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 2);
  const termHits = qTerms.filter((word) => haystack.includes(word)).length;

  let fit = termHits * 8;
  if (imageType === 'diagram') {
    if (/diagram|schematic|illustration|labelled|labeled|chart|drawing|vector|svg|structure|cycle|process/.test(haystack)) fit += 28;
    if (/photo|portrait|landscape|people|astronaut/.test(haystack)) fit -= 8;
  }
  if (imageType === 'labelled') {
    if (/labelled|labeled|annotated|diagram|structure|anatomy|map/.test(haystack)) fit += 32;
  }
  if (imageType === 'photo') {
    if (/photo|photograph|image|field|specimen/.test(haystack)) fit += 15;
    if (/diagram|schema|svg|icon/.test(haystack)) fit -= 6;
  }
  if (imageType === 'background') {
    if (/wallpaper|background|landscape|photo|nebula|microscope|texture/.test(haystack)) fit += 18;
  }

  return fit;
}

function scoreItem(item, query, imageType) {
  const licence = LICENSE_RANK[item.license] || 0;
  const source = SOURCE_RANK[item.source] || 0;
  const size = Math.min(24, Math.floor(((item.width || 0) * (item.height || 0)) / 180000));
  const fit = inferFit({ title: item.title, description: item.description, query, imageType });
  return licence + source + size + fit;
}

function matchesLicence(item, licenceFilter) {
  if (!licenceFilter || licenceFilter === 'classroom') {
    return ['pdm', 'cc0', 'by', 'by-sa', 'by-nc', 'by-nc-sa', 'nasa'].includes(item.license);
  }
  if (licenceFilter === 'commercialSafe') {
    return ['pdm', 'cc0', 'by', 'by-sa', 'nasa'].includes(item.license);
  }
  if (licenceFilter === 'mostOpen') {
    return ['pdm', 'cc0'].includes(item.license);
  }
  return true;
}

function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = `${item.imageUrl || ''}|${item.landingUrl || ''}|${item.title || ''}`.toLowerCase();
    if (!key.trim() || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function fetchJson(url, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'EduImageFinder/2.0 (educational image search app)'
      }
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function searchOpenverse(query, limit, imageType) {
  const q = imageType === 'diagram' || imageType === 'labelled' ? `${query} diagram illustration` : query;
  const params = new URLSearchParams({
    q,
    page_size: String(Math.min(limit, 20)),
    mature: 'false'
  });
  const data = await fetchJson(`${OPENVERSE_ENDPOINT}?${params.toString()}`);
  return (data.results || []).map((r) => {
    const license = normaliseLicence(r.license);
    const item = {
      id: `openverse-${r.id}`,
      source: 'openverse',
      sourceName: r.source ? `Openverse / ${r.source}` : 'Openverse',
      title: cleanText(r.title) || 'Untitled Openverse image',
      description: cleanText(r.description || ''),
      creator: cleanText(r.creator || r.provider || ''),
      creatorUrl: r.creator_url || '',
      imageUrl: r.url || r.thumbnail || '',
      thumbUrl: r.thumbnail || r.url || '',
      landingUrl: r.foreign_landing_url || r.url || '',
      license,
      licenseLabel: licenceLabel(license),
      licenseUrl: r.license_url || '',
      width: Number(r.width) || null,
      height: Number(r.height) || null,
      provider: r.provider || r.source || '',
      raw: { openverseId: r.id }
    };
    item.attribution = buildAttribution(item);
    return item;
  }).filter((item) => item.imageUrl);
}

async function searchWikimedia(query, limit, imageType) {
  const enhanced = imageType === 'diagram' || imageType === 'labelled'
    ? `${query} diagram schematic illustration`
    : query;

  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: enhanced,
    gsrlimit: String(Math.min(limit, 20)),
    prop: 'imageinfo',
    iiprop: 'url|mime|size|dimensions|extmetadata',
    iiurlwidth: '900'
  });
  const data = await fetchJson(`${WIKIMEDIA_ENDPOINT}?${params.toString()}`);
  const pages = Object.values(data?.query?.pages || {});
  return pages.map((page) => {
    const ii = page.imageinfo?.[0] || {};
    const meta = ii.extmetadata || {};
    const value = (key) => cleanText(meta[key]?.value || '');
    const rawLicence = value('LicenseShortName') || value('UsageTerms') || value('Copyrighted');
    const license = normaliseLicence(rawLicence);
    const item = {
      id: `wikimedia-${page.pageid}`,
      source: 'wikimedia',
      sourceName: 'Wikimedia Commons',
      title: cleanText(value('ObjectName') || page.title?.replace(/^File:/, '') || 'Wikimedia Commons image'),
      description: cleanText(value('ImageDescription') || page.title || ''),
      creator: cleanText(value('Artist') || value('Credit') || ii.user || 'Wikimedia Commons contributor'),
      creatorUrl: '',
      imageUrl: ii.url || ii.thumburl || '',
      thumbUrl: ii.thumburl || ii.url || '',
      landingUrl: ii.descriptionurl || '',
      license,
      licenseLabel: licenceLabel(license),
      licenseUrl: value('LicenseUrl') || '',
      width: Number(ii.width) || null,
      height: Number(ii.height) || null,
      provider: 'Wikimedia Commons',
      raw: { pageid: page.pageid, title: page.title }
    };
    item.attribution = buildAttribution(item);
    return item;
  }).filter((item) => item.imageUrl && item.license !== 'unknown');
}

async function searchNasa(query, limit) {
  const params = new URLSearchParams({
    q: query,
    media_type: 'image',
    page_size: String(Math.min(limit, 20))
  });
  const data = await fetchJson(`${NASA_ENDPOINT}?${params.toString()}`);
  const items = data?.collection?.items || [];
  return items.map((entry, index) => {
    const d = entry.data?.[0] || {};
    const link = entry.links?.find((l) => l.rel === 'preview' || l.render === 'image') || entry.links?.[0] || {};
    const nasaId = d.nasa_id || '';
    const item = {
      id: `nasa-${nasaId || index}`,
      source: 'nasa',
      sourceName: 'NASA Image and Video Library',
      title: cleanText(d.title || 'NASA image'),
      description: cleanText(d.description || d.description_508 || ''),
      creator: cleanText(d.center || 'NASA'),
      creatorUrl: '',
      imageUrl: link.href || '',
      thumbUrl: link.href || '',
      landingUrl: nasaId ? `https://images.nasa.gov/details/${encodeURIComponent(nasaId)}` : entry.href || '',
      license: 'nasa',
      licenseLabel: licenceLabel('nasa'),
      licenseUrl: 'https://www.nasa.gov/nasa-brand-center/images-and-media/',
      width: null,
      height: null,
      provider: 'NASA',
      raw: { nasaId, center: d.center, dateCreated: d.date_created }
    };
    item.attribution = `${item.title} — ${item.creator || 'NASA'}, NASA Image and Video Library. NASA should be acknowledged as the source. Source: ${item.landingUrl}`;
    return item;
  }).filter((item) => item.imageUrl);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const query = cleanText(req.query.q || '');
  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters.' });
  }

  const imageType = cleanText(req.query.type || 'diagram');
  const licenceFilter = cleanText(req.query.licence || 'classroom');
  const limit = Math.min(Math.max(Number(req.query.limit || 16), 1), 30);
  const requestedSources = cleanText(req.query.sources || 'openverse,wikimedia,nasa')
    .split(',')
    .map((source) => source.trim().toLowerCase())
    .filter(Boolean);

  const tasks = [];
  const errors = [];

  if (requestedSources.includes('openverse')) {
    tasks.push(searchOpenverse(query, limit, imageType).catch((err) => {
      errors.push({ source: 'openverse', message: err.message });
      return [];
    }));
  }
  if (requestedSources.includes('wikimedia')) {
    tasks.push(searchWikimedia(query, limit, imageType).catch((err) => {
      errors.push({ source: 'wikimedia', message: err.message });
      return [];
    }));
  }
  if (requestedSources.includes('nasa')) {
    tasks.push(searchNasa(query, limit).catch((err) => {
      errors.push({ source: 'nasa', message: err.message });
      return [];
    }));
  }

  if (!tasks.length) {
    return res.status(400).json({ error: 'Select at least one source.' });
  }

  const settled = await Promise.all(tasks);
  let results = dedupe(settled.flat())
    .filter((item) => ALLOWED_LICENSES.has(item.license))
    .filter((item) => matchesLicence(item, licenceFilter));

  results = results
    .map((item) => ({ ...item, score: scoreItem(item, query, imageType) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
  return res.status(200).json({
    query,
    imageType,
    licenceFilter,
    count: results.length,
    errors,
    results
  });
}
