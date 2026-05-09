import client from './client';

export const getFamilies = () =>
  client.get('/v1/families');

export const getFamilyByKey = (key) =>
  client.get(`/v1/families/${key}`);
