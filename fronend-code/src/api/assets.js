import client from './client';

export const getAssets = (params = {}) =>
  client.get('/v1/assets', { params });

export const getAssetById = (id) =>
  client.get(`/v1/assets/${id}`);

export const getAssetStats = () =>
  client.get('/v1/assets/stats');

export const getAssetsByFamily = (key) =>
  client.get(`/v1/assets/family/${key}`);

export const createAsset = (payload) =>
  client.post('/v1/assets', payload);

/** Multipart field name must be `demo`. MP4, WebM, or MOV. */
export const uploadAssetDemoVideo = (assetId, file) => {
  const fd = new FormData();
  fd.append('demo', file);
  return client.post(`/v1/assets/${encodeURIComponent(assetId)}/demo-video`, fd, {
    timeout: 300000,
  });
};
