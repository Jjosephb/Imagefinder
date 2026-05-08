import { stripHtml } from "./license.js";

function clean(value, fallback = "Unknown") {
  const cleaned = stripHtml(value);
  return cleaned || fallback;
}

function firstNonEmpty(...values) {
  return values.find((value) => clean(value, "") !== "") || "";
}

function wikipediaFilePageFromTitle(title) {
  if (!title) return "";
  return `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`;
}

export function normalizeOpenverse(payload) {
  const results = Array.isArray(payload?.results) ? payload.results : [];

  return results
    .map((item) => ({
      imageUrl: firstNonEmpty(item.url, item.thumbnail),
      title: clean(item.title, "Untitled image"),
      author: clean(item.creator, "Unknown creator"),
      source: clean(item.source ? `Openverse / ${item.source}` : "Openverse"),
      licenseType: clean(item.license, ""),
      originalLink: clean(item.foreign_landing_url, item.url || "")
    }))
    .filter((item) => item.imageUrl && item.originalLink);
}

export function normalizeWikimedia(payload) {
  const pages = Object.values(payload?.query?.pages || {});

  return pages
    .map((page) => {
      const imageInfo = page.imageinfo?.[0] || {};
      const metadata = imageInfo.extmetadata || {};

      const title = firstNonEmpty(
        metadata.ObjectName?.value,
        page.title?.replace(/^File:/, ""),
        metadata.ImageDescription?.value
      );

      const author = firstNonEmpty(
        metadata.Artist?.value,
        metadata.Credit?.value,
        metadata.Author?.value,
        "Unknown Wikimedia contributor"
      );

      const license = firstNonEmpty(
        metadata.LicenseShortName?.value,
        metadata.UsageTerms?.value,
        metadata.License?.value
      );

      return {
        imageUrl: firstNonEmpty(imageInfo.thumburl, imageInfo.url),
        title: clean(title, "Untitled Wikimedia image"),
        author: clean(author, "Unknown Wikimedia contributor"),
        source: "Wikimedia Commons",
        licenseType: clean(license, ""),
        originalLink: wikipediaFilePageFromTitle(page.title || metadata.CanonicalTitle?.value)
      };
    })
    .filter((item) => item.imageUrl && item.originalLink);
}

export function normalizeMetObjects(objects) {
  return objects
    .filter((item) => item?.isPublicDomain === true && (item.primaryImageSmall || item.primaryImage))
    .map((item) => ({
      imageUrl: item.primaryImageSmall || item.primaryImage,
      title: clean(item.title, "Untitled artwork"),
      author: clean(item.artistDisplayName, "The Metropolitan Museum of Art"),
      source: "The Metropolitan Museum of Art",
      licenseType: "CC0 / Public Domain",
      originalLink: clean(item.objectURL, `https://www.metmuseum.org/art/collection/search/${item.objectID}`)
    }));
}

export function normalizeSmithsonian(payload) {
  const rows = Array.isArray(payload?.response?.rows) ? payload.response.rows : [];

  return rows
    .map((row) => {
      const content = row.content || {};
      const descriptive = content.descriptiveNonRepeating || {};
      const freetext = content.freetext || {};
      const mediaItems = descriptive.online_media?.media || [];

      const imageMedia = mediaItems.find((media) => {
        const url = String(media.content || "");
        const type = String(media.type || "").toLowerCase();
        return type.includes("image") || /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url);
      });

      const rights = firstNonEmpty(
        descriptive?.online_media?.usage?.access,
        descriptive?.online_media?.usage?.text,
        imageMedia?.usage?.access,
        imageMedia?.rights,
        "CC0 / Public Domain"
      );

      const creator =
        freetext.name?.find((entry) =>
          /artist|maker|creator|author|photographer/i.test(entry.label || "")
        )?.content ||
        freetext.name?.[0]?.content ||
        descriptive.data_source ||
        "Smithsonian Institution";

      return {
        imageUrl: clean(imageMedia?.content, ""),
        title: clean(descriptive.title?.content || row.title, "Untitled Smithsonian item"),
        author: clean(creator, "Smithsonian Institution"),
        source: "Smithsonian Open Access",
        licenseType: clean(rights, "CC0 / Public Domain"),
        originalLink: clean(
          descriptive.record_link,
          row.id ? `https://www.si.edu/object/${encodeURIComponent(row.id)}` : ""
        )
      };
    })
    .filter((item) => item.imageUrl && item.originalLink);
}

export function normalizeNasa(payload) {
  const items = Array.isArray(payload?.collection?.items) ? payload.collection.items : [];

  return items
    .map((item) => {
      const data = item.data?.[0] || {};
      const imageLink =
        item.links?.find((link) => link.render === "image" && link.href)?.href ||
        item.links?.find((link) => /\.(jpg|jpeg|png|webp)(\?|$)/i.test(link.href || ""))?.href;

      const nasaId = data.nasa_id;
      const author = firstNonEmpty(data.photographer, data.secondary_creator, data.center, "NASA");
      const copyright = firstNonEmpty(data.copyright, "");

      return {
        imageUrl: clean(imageLink, ""),
        title: clean(data.title, "Untitled NASA image"),
        author: clean(author, "NASA"),
        source: "NASA Image and Video Library",
        licenseType: copyright ? `Copyrighted: ${copyright}` : "Public Domain",
        originalLink: nasaId
          ? `https://images.nasa.gov/details/${encodeURIComponent(nasaId)}`
          : clean(item.href, "")
      };
    })
    .filter((item) => item.imageUrl && item.originalLink);
}

export function normalizePubChem(properties) {
  const rows = Array.isArray(properties) ? properties : [];

  return rows
    .filter((compound) => compound.CID)
    .map((compound) => {
      const cid = compound.CID;
      const title = compound.Title || compound.IUPACName || `PubChem compound ${cid}`;

      return {
        imageUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/PNG?record_type=2d&image_size=large`,
        title: clean(title, `PubChem compound ${cid}`),
        author: "PubChem / National Library of Medicine",
        source: "PubChem",
        licenseType: "Public Domain",
        originalLink: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`
      };
    });
}
