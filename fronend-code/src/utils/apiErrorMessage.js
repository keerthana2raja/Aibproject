/**
 * Human-readable message from an axios/API error response.
 */
export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const d = error?.response?.data;
  if (error?.code === 'ECONNABORTED') {
    return 'Request timed out. For large files, try again or use a faster connection.';
  }
  if (!error?.response) {
    return 'Network error. Check your connection and try again.';
  }
  if (d && typeof d === 'object') {
    if (typeof d.message === 'string' && d.message.trim()) return d.message.trim();
    if (typeof d.error === 'string' && d.error.trim()) return d.error.trim();
    if (Array.isArray(d.errors)) {
      const parts = d.errors
        .map((e) => (typeof e === 'string' ? e : e?.message || e?.msg || e?.detail))
        .filter(Boolean);
      if (parts.length) return parts.join(' ');
    }
  }
  return fallback;
}
