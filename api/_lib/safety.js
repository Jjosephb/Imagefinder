const BLOCKED_KEYWORDS = [
  "porn",
  "pornography",
  "explicit",
  "nude",
  "nudity",
  "sex",
  "sexual",
  "gore",
  "graphic violence",
  "beheading",
  "murder",
  "suicide",
  "self harm",
  "self-harm",
  "weapon",
  "gun",
  "rifle",
  "knife attack",
  "bomb",
  "terrorist",
  "torture",
  "execution"
];

function normaliseSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_\-.,;:!?()[\]{}"'`~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findBlockedKeyword(rawQuery) {
  const safeQuery = normaliseSearchText(rawQuery);

  return BLOCKED_KEYWORDS.find((keyword) => {
    const phrase = normaliseSearchText(keyword);
    const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    const pattern = new RegExp(`(^|\\s)${escapedPhrase}(\\s|$)`, "i");
    return pattern.test(safeQuery);
  });
}
