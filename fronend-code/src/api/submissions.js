import client from './client';

export const getSubmissions = (params = {}) =>
  client.get('/v1/submissions', { params });

export const getSubmissionById = (id) =>
  client.get(`/v1/submissions/${id}`);

export const createSubmission = (data) =>
  client.post('/v1/submissions', data);

export const updateSubmissionStatus = (id, data) =>
  client.patch(`/v1/submissions/${id}/status`, data);

export const uploadSubmissionAttachments = (submissionId, files) => {
  const fd = new FormData();
  const list = Array.isArray(files) ? files : [...files];
  list.forEach((f) => {
    if (f) fd.append('files', f);
  });
  return client.post(`/v1/submissions/${encodeURIComponent(submissionId)}/files`, fd, {
    timeout: 300000,
  });
};

export const uploadSubmissionDemoVideo = (submissionId, file) => {
  const fd = new FormData();
  fd.append('demo', file);
  return client.post(`/v1/submissions/${encodeURIComponent(submissionId)}/demo-video`, fd, {
    timeout: 300000,
  });
};
