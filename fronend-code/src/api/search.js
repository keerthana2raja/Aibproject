import client from './client';

export const searchSuggestions = (q) =>
  client.get('/v1/search', { params: { q } });
