/**
 * Map snake_case submission GET payloads to fields the UI already expects.
 */
export function normalizeSubmissionDetail(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const next = { ...raw };
  if (!next.demoVideoUrl && (next.demo_video_relpath || next.demo_video_url)) {
    next.demoVideoUrl = next.demo_video_relpath || next.demo_video_url;
  }
  if (!next.submissionAttachments?.length && Array.isArray(next.submission_attachments)) {
    next.submissionAttachments = next.submission_attachments;
  }
  return next;
}
