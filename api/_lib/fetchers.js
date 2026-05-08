import { fetchJson, fetchJsonOrNull, withQuery } from "./http.js";
import {
  normalizeMetObjects,
  normalizeNasa,
  normalizeOpenverse,
  normalizePubChem,
  normalizeSmithsonian,
  normalizeWikimedia
} from "./normalizers.js";

const PAGE_SIZE = 36;

export async function fetchOpenverse(query) {
  const url = withQuery("https://api.openverse.org/v1/images/", {
    q: query,
    page_size: PAGE_SIZE,
    license: "cc0,by,by-nc",
    mature: "false",
    unstable__include_sensitive_results: "false"
  });

  const data = await fetchJson(url);
  return normalizeOpenverse(data);
}

export async function fetchWikimediaCommons(query) {
  const url = withQuery("https://commons.wikimedia.org/w/api.php", {
    action: "query",
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: PAGE_SIZE,
    gsrsearch: query,
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1200",
    format: "json",
    origin: "*"
  });

  const data = await fetchJson(url);
  return normalizeWikimedia(data);
}

export async function fetchMetMuseum(query) {
  const searchUrl = withQuery("https://collectionapi.metmuseum.org/public/collection/v1/search", {
    q: query,
    hasImages: "true"
  });

  const searchData = await fetchJson(searchUrl);
  const objectIds = Array.isArray(searchData?.objectIDs) ? searchData.objectIDs.slice(0, 28) : [];

  const settledObjects = await Promise.allSettled(
    objectIds.map((id) =>
      fetchJson(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`, {
        timeoutMs: 10000
      })
    )
  );

  const objects = settledObjects
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  return normalizeMetObjects(objects);
}

export async function fetchSmithsonian(query) {
  const apiKey = process.env.SMITHSONIAN_API_KEY;

  if (!apiKey) {
    return [];
  }

  const url = withQuery("https://api.si.edu/openaccess/api/v1.0/search", {
    api_key: apiKey,
    q: `${query} AND online_media_type:Images`,
    rows: PAGE_SIZE,
    start: "0"
  });

  const data = await fetchJson(url);
  return normalizeSmithsonian(data);
}

export async function fetchNasa(query) {
  const url = withQuery("https://images-api.nasa.gov/search", {
    q: query,
    media_type: "image",
    page_size: PAGE_SIZE
  });

  const data = await fetchJson(url);
  return normalizeNasa(data);
}

export async function fetchPubChem(query) {
  const cidUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(
    query
  )}/cids/JSON?name_type=word`;

  const cidData = await fetchJsonOrNull(cidUrl);
  const cids = cidData?.IdentifierList?.CID?.slice(0, 16) || [];

  if (!cids.length) {
    return [];
  }

  const propertyUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cids.join(
    ","
  )}/property/Title,IUPACName/JSON`;

  const propertyData = await fetchJson(propertyUrl);
  return normalizePubChem(propertyData?.PropertyTable?.Properties || []);
}
