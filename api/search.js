import { findBlockedKeyword } from "./_lib/safety.js";
import { searchImages } from "./_lib/searchService.js";

const VALID_DOMAINS = new Set(["general", "art", "humanities", "stem"]);

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Only GET searches are supported." });
    return;
  }

  const query = String(req.query.query || "").trim();
  const domain = String(req.query.domain || "general").trim().toLowerCase();

  if (!query) {
    sendJson(res, 400, { error: "Please enter a search term." });
    return;
  }

  if (query.length > 120) {
    sendJson(res, 400, { error: "Please keep your search under 120 characters." });
    return;
  }

  if (!VALID_DOMAINS.has(domain)) {
    sendJson(res, 400, { error: "Please choose a valid subject domain." });
    return;
  }

  const blockedKeyword = findBlockedKeyword(query);
  if (blockedKeyword) {
    sendJson(res, 400, {
      error:
        "That search term is not suitable for this classroom image finder. Please try a safer educational term."
    });
    return;
  }

  try {
    const results = await searchImages({ query, domain });
    sendJson(res, 200, results);
  } catch (error) {
    console.error("Search failed:", error);
    sendJson(res, 500, {
      error: "Something went wrong while searching image sources. Please try again."
    });
  }
}
