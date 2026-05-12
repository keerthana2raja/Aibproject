/**
 * Map snake_case submission GET payloads to fields the UI already expects.
 */
export function normalizeSubmissionDetail(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const next = { ...raw };
  if (!next.demoVideoUrl && (next.demo_video_relpath || next.demo_video_url)) {
    next.demoVideoUrl = next.demo_video_relpath || next.demo_video_url;
  }
  if (!next.demoVideoUrl && next.videoUrl) {
    next.demoVideoUrl = next.videoUrl;
  }
  if (!next.demoVideoUrl && next.video_url) {
    next.demoVideoUrl = next.video_url;
  }
  if (!next.submissionAttachments?.length && Array.isArray(next.submission_attachments)) {
    next.submissionAttachments = next.submission_attachments;
  }
  const snakeDiagramUrl =
    (typeof next.architecture_diagram_url === 'string' && next.architecture_diagram_url.trim()) ||
    (typeof next.architectureDiagramUrl === 'string' && next.architectureDiagramUrl.trim()) ||
    '';
  const archFieldUrl =
    typeof next.architecture === 'string' && /^https?:\/\//i.test(next.architecture.trim())
      ? next.architecture.trim()
      : '';
  if (snakeDiagramUrl || archFieldUrl) {
    next.architectureDiagramHref = snakeDiagramUrl || archFieldUrl;
  }
  if (!next.submitedBy && (next.submittedBy || next.submitted_by)) {
    next.submitedBy = next.submittedBy || next.submitted_by;
  }
  if (!next.date && (next.submitted_at || next.createdAt || next.created_at)) {
    next.date = next.submitted_at || next.createdAt || next.created_at;
  }
  if (!next.statusHistory?.length && Array.isArray(next.status_history)) {
    next.statusHistory = next.status_history;
  }
  return next;
}
