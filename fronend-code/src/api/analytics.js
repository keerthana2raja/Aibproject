import client from './client';

export const getAnalyticsSummary = () => client.get('/v1/analytics/summary');
