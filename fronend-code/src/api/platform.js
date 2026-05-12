import client from './client';

/** GET `/v1/platform/counts` — public dashboard-style counts for login / marketing surfaces */
export const getPlatformCounts = (config = {}) => client.get('/v1/platform/counts', config);
