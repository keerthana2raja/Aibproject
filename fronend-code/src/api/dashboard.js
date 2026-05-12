import client from './client';

// F3 FIX: Removed the `no-cache` / `Pragma: no-cache` headers that were
// previously sent on every call.  Those headers bypassed the CDN edge cache
// entirely, making the Cache-Control headers added on the server (B3 fix)
// ineffective.  Backend Cache-Control headers now drive freshness; the
// browser/CDN will serve the cached response for up to 60 s automatically.

export const getDashboardStats = () =>
  client.get('/v1/dashboard/stats');

export const getPopularAssets = (limit = 6) =>
  client.get('/v1/dashboard/popular', { params: { limit } });

export const getDashboardActivity = (limit = 15) =>
  client.get('/v1/dashboard/activity', { params: { limit } });
