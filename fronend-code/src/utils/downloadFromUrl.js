/** Prefer a sane filename when saving a blob-backed download */
export function suggestedFilenameFromUrl(url, fallback = 'download') {
  try {
    const pathname = new URL(url).pathname;
    const base = pathname.split('/').filter(Boolean).pop() || fallback;
    return decodeURIComponent(String(base).split('?')[0]) || fallback;
  } catch {
    return fallback;
  }
}

function buildAuthorizedFetchParts(url, options = {}) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('aimplify_token') : null;
  const headers = { ...options.extraHeaders };

  let needsAuth = false;
  if (/^\/v1\//i.test(url)) {
    needsAuth = true;
  } else if (token && /^https?:\/\//i.test(url)) {
    const base = import.meta.env.VITE_API_BASE_URL;
    const b = typeof base === 'string' ? base.trim().replace(/\/$/, '') : '';
    if (b && url.startsWith(b)) needsAuth = true;
  }

  if (needsAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const resolvedUrl = /^https?:\/\//i.test(url)
    ? url
    : new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost').toString();

  const fetchInit = {
    mode: 'cors',
    credentials: /^https?:\/\//i.test(url) ? 'omit' : 'same-origin',
    headers: Object.keys(headers).length ? headers : undefined,
  };

  return { resolvedUrl, fetchInit };
}

/** Fetch binary for downloads or clipboard paste (handles Bearer for `/v1/...`). */
export async function fetchUrlAsBlob(url, options = {}) {
  if (!url) throw new Error('Missing URL');
  const { resolvedUrl, fetchInit } = buildAuthorizedFetchParts(url, options);
  const res = await fetch(resolvedUrl, fetchInit);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

/**
 * Downloads a remote file via fetch → blob → object URL (works when `<a download>` is ignored cross-origin).
 */
export async function triggerDownloadFromUrl(url, filename, options = {}) {
  const blob = await fetchUrlAsBlob(url, options);
  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download =
      filename || suggestedFilenameFromUrl(url);
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
