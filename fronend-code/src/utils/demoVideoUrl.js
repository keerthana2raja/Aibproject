/**
 * Picks a demo video path or absolute URL from catalog assets, submissions, or raw API shapes.
 */
export function pickDemoVideoRelPath(record) {
  if (!record || typeof record !== 'object') return '';
  const v =
    record.demoVideoUrl ??
    record.demo_video_url ??
    record.demo_video_relpath ??
    record.videoUrl ??
    record.video_url ??
    record.demoVideo;
  if (v == null || v === '') return '';
  return String(v).trim();
}

/** Hover / tooltip copy for Launch demo / Preview controls. */
export function demoVideoTooltipText(assetDisplayName, hasVideoUrl) {
  const safe = String(assetDisplayName ?? '').trim();
  const label = safe || 'This asset';
  if (hasVideoUrl) return `${label} demo video`;
  return 'Demo video not available';
}
