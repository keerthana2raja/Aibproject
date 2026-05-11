import client from './client';

/** Normalize `{ data: { ... } }` or `{ ... }` API envelopes */
export const unwrapSubmissionResponse = (axiosResponse) =>
  axiosResponse?.data?.data !== undefined ? axiosResponse.data.data : axiosResponse?.data;

export const getSubmissions = (params = {}) =>
  client.get('/v1/submissions', { params });

/** GET `/v1/submissions/{assetId}` — includes demo_video_relpath, architecture, submission_attachments */
export const getSubmissionById = (assetId) =>
  client.get(`/v1/submissions/${encodeURIComponent(assetId)}`);

export const createSubmission = (data) =>
  client.post('/v1/submissions', data);

export const updateSubmissionStatus = (id, data) =>
  client.patch(`/v1/submissions/${id}/status`, data);

/** POST `/v1/submissions/{assetId}/files` — form field `files`, max 40 MB per file (validate client-side) */
export const uploadSubmissionAttachments = (assetId, files) => {
  const fd = new FormData();
  const list = Array.isArray(files) ? files : [...files];
  list.forEach((f) => {
    if (f) fd.append('files', f);
  });
  return client.post(`/v1/submissions/${encodeURIComponent(assetId)}/files`, fd, {
    timeout: 300000,
  });
};

/** POST `/v1/submissions/{assetId}/demo-video` — form field `demo`; response includes demo_video_relpath */
export const uploadSubmissionDemoVideo = (assetId, file) => {
  const fd = new FormData();
  fd.append('demo', file);
  return client.post(`/v1/submissions/${encodeURIComponent(assetId)}/demo-video`, fd, {
    timeout: 300000,
  });
};

/** POST `/v1/submissions/{assetId}/architecture` — form field `architecture`; response includes architecture URL/relpath */
export const uploadSubmissionArchitectureDiagram = (assetId, file) => {
  const fd = new FormData();
  fd.append('architecture', file);
  return client.post(`/v1/submissions/${encodeURIComponent(assetId)}/architecture`, fd, {
    timeout: 300000,
  });
};
