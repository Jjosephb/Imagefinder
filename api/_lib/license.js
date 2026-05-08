export function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicaliseLicense(rawLicense) {
  const raw = stripHtml(rawLicense);
  if (!raw) return null;

  const s = raw
    .toUpperCase()
    .replace(/CREATIVE COMMONS/g, "CC")
    .replace(/ATTRIBUTION-NONCOMMERCIAL/g, "CC BY-NC")
    .replace(/ATTRIBUTION/g, "CC BY")
    .replace(/PUBLIC-DOMAIN/g, "PUBLIC DOMAIN")
    .replace(/[_–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  const hasNoDerivatives =
    /\bND\b/.test(s) ||
    s.includes("NO DERIV") ||
    s.includes("NODERIV") ||
    s.includes("NO-DERIV");

  const hasShareAlike =
    /\bSA\b/.test(s) ||
    s.includes("SHAREALIKE") ||
    s.includes("SHARE-ALIKE");

  const isRestrictive =
    s.includes("ALL RIGHTS RESERVED") ||
    s.includes("COPYRIGHTED") ||
    s.includes("IN COPYRIGHT") ||
    s.includes("RESTRICTED") ||
    s.includes("UNKNOWN") ||
    s.includes("FAIR USE");

  if (hasNoDerivatives || hasShareAlike || isRestrictive) return null;

  if (
    s === "CC0" ||
    s.includes("CC0") ||
    s.includes("PUBLIC DOMAIN") ||
    s.includes("PDM") ||
    s.includes("NO KNOWN COPYRIGHT") ||
    s.includes("NASA IMAGE USE POLICY")
  ) {
    return "CC0 / Public Domain";
  }

  if (
    s === "BY" ||
    s === "CC BY" ||
    s === "CC-BY" ||
    /^CC[- ]BY[- ]?4\.0$/.test(s) ||
    /^CC[- ]BY[- ]?3\.0$/.test(s) ||
    /^CC[- ]BY[- ]?2\.0$/.test(s) ||
    /^CC[- ]BY( |-|$)/.test(s)
  ) {
    if (!s.includes("NC") && !s.includes("ND") && !s.includes("SA")) return "CC BY";
  }

  if (
    s === "BY-NC" ||
    s === "CC BY-NC" ||
    s === "CC-BY-NC" ||
    /^CC[- ]BY[- ]NC( |-|$)/.test(s)
  ) {
    if (!s.includes("ND") && !s.includes("SA")) return "CC BY-NC";
  }

  return null;
}

export function enforceAllowedLicense(item) {
  const licenseType = canonicaliseLicense(item.licenseType);
  if (!licenseType) return null;

  const output = {
    imageUrl: item.imageUrl,
    title: item.title,
    author: item.author,
    source: item.source,
    licenseType,
    originalLink: item.originalLink
  };

  return Object.values(output).every((value) => String(value || "").trim()) ? output : null;
}
