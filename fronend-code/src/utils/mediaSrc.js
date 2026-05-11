/** Absolute URL for streamed media (video) when API is on another origin. */
export function resolveMediaSrc(urlPath) {
  if (!urlPath) return '';
  if (/^https?:\/\//i.test(urlPath)) return urlPath;
  const path = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  const base = import.meta.env.VITE_API_BASE_URL;
  if (base !== undefined && base !== null && String(base).trim() !== '') {
    return `${String(base).replace(/\/$/, '')}${path}`;
  }
  return path;
}

/**
 * Attachment `relpath` from API: may be an absolute https URL (e.g. blob storage) or a server upload key.
 */
export function resolveAttachmentHref(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const trimmed = s.replace(/^\/+/, '');
  if (trimmed.startsWith('v1/')) return resolveMediaSrc(`/${trimmed}`);
  return resolveMediaSrc(`/v1/uploads/${trimmed}`);
}
