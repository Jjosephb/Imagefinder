export function withQuery(baseUrl, params) {
  const url = new URL(baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs || 12000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "TeacherOnCallImageFinder/1.0; educational-image-search",
        ...(options.headers || {})
      },
      signal: controller.signal
    });

    if (!response.ok) {
      const error = new Error(`Request failed with status ${response.status}`);
      error.status = response.status;
      error.url = url;
      throw error;
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchJsonOrNull(url, options = {}) {
  try {
    return await fetchJson(url, options);
  } catch (error) {
    if (error.status === 404 || error.status === 400) return null;
    throw error;
  }
}
