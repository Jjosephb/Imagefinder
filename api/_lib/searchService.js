import {
  fetchMetMuseum,
  fetchNasa,
  fetchOpenverse,
  fetchPubChem,
  fetchSmithsonian,
  fetchWikimediaCommons
} from "./fetchers.js";
import { enforceAllowedLicense } from "./license.js";

const DOMAIN_FETCHERS = {
  general: [fetchOpenverse, fetchWikimediaCommons],
  art: [fetchMetMuseum, fetchSmithsonian, fetchOpenverse, fetchWikimediaCommons],
  humanities: [fetchMetMuseum, fetchSmithsonian, fetchOpenverse, fetchWikimediaCommons],
  stem: [fetchNasa, fetchPubChem, fetchOpenverse, fetchWikimediaCommons]
};

const BLOCKED_METADATA_TERMS = [
  "book cover",
  "front cover",
  "back cover",
  "dust jacket",
  "title page",
  "index page",
  "pdf page",
  "scan of",
  "scanned page",
  "blank page",
  "page from",
  "text page",
  "bookplate",
  "binding",
  "spine of",
  "cover of",
  "volume cover",
  "journal cover",
  "newspaper page",
  "magazine cover"
];

function isUsefulImage(item) {
  const text = `${item.title} ${item.originalLink}`.toLowerCase();
  return !BLOCKED_METADATA_TERMS.some((term) => text.includes(term));
}

function dedupeByImageAndLink(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = `${item.imageUrl}|${item.originalLink}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scoreItem(item, query, domain) {
  const title = item.title.toLowerCase();
  const source = item.source.toLowerCase();
  const q = query.toLowerCase();
  const queryTerms = q.split(/\s+/).filter(Boolean);

  let score = 0;

  for (const term of queryTerms) {
    if (title.includes(term)) score += 5;
  }

  if (title.includes(q)) score += 12;
  if (title.includes("diagram")) score += 12;
  if (title.includes("labelled") || title.includes("labeled")) score += 8;
  if (title.includes("illustration")) score += 7;
  if (title.includes("map")) score += 5;
  if (title.includes("chart")) score += 5;
  if (title.includes("model")) score += 4;
  if (title.includes("structure")) score += 4;
  if (title.includes("schematic")) score += 5;
  if (title.includes("photograph")) score += 2;

  if (domain === "stem") {
    if (source.includes("pubchem")) score += 9;
    if (source.includes("nasa")) score += 8;
    if (source.includes("wikimedia")) score += 6;
    if (source.includes("openverse")) score += 3;
  } else if (domain === "art" || domain === "humanities") {
    if (source.includes("metropolitan")) score += 9;
    if (source.includes("smithsonian")) score += 8;
    if (source.includes("wikimedia")) score += 3;
    if (source.includes("openverse")) score += 2;
  } else {
    if (source.includes("wikimedia")) score += 5;
    if (source.includes("openverse")) score += 4;
  }

  if (title.includes("cover")) score -= 30;
  if (title.includes("page")) score -= 18;
  if (title.includes("scan")) score -= 18;
  if (title.includes("book")) score -= 8;

  return score;
}

function sortResults(items, query, domain) {
  return [...items].sort((a, b) => scoreItem(b, query, domain) - scoreItem(a, query, domain));
}

export async function searchImages({ query, domain }) {
  const fetchers = DOMAIN_FETCHERS[domain] || DOMAIN_FETCHERS.general;

  const settled = await Promise.allSettled(fetchers.map((fetcher) => fetcher(query)));

  const rawResults = settled.flatMap((result) => {
    if (result.status === "fulfilled") return result.value;
    console.warn("Image source failed:", result.reason?.message || result.reason);
    return [];
  });

  const strictResults = rawResults
    .map(enforceAllowedLicense)
    .filter(Boolean)
    .filter((item) => item.imageUrl && item.title && item.source && item.licenseType)
    .filter(isUsefulImage);

  const uniqueResults = dedupeByImageAndLink(strictResults);
  const sortedResults = sortResults(uniqueResults, query, domain);
  const limit = Number(process.env.RESULT_LIMIT || 48);

  return sortedResults.slice(0, limit).map((item) => ({
    imageUrl: item.imageUrl,
    title: item.title,
    author: item.author,
    source: item.source,
    licenseType: item.licenseType,
    originalLink: item.originalLink
  }));
}
