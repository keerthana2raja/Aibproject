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
