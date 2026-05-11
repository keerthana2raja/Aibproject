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

/** Shown only when API omits a demo URL — short CC0 clip. */
export const FALLBACK_DEMO_VIDEO_URL =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

export function pickDemoVideoRelPathOrFallback(record) {
  const fromApi = pickDemoVideoRelPath(record);
  if (fromApi) return fromApi;
  return FALLBACK_DEMO_VIDEO_URL;
}
