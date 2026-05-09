import client from './client';

export const postActivityLog = (body) =>
  client.post('/v1/activity', body);
