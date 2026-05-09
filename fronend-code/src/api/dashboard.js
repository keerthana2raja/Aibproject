import client from './client';

/** Avoid stale dashboard data when switching routes or re-clicking nav (browser HTTP cache). */
const noCache = {
  headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
};

export const getDashboardStats = () =>
  client.get('/v1/dashboard/stats', noCache);

export const getPopularAssets = (limit = 6) =>
  client.get('/v1/dashboard/popular', { params: { limit }, ...noCache });

export const getDashboardActivity = (limit = 15) =>
  client.get('/v1/dashboard/activity', { params: { limit }, ...noCache });
