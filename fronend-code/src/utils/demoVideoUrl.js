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

/** Set to false when the API returns demo URLs; remove this block once backend is stable. */
export const USE_TEMP_DEMO_VIDEO_FALLBACK = true;

/** Short CC0 sample; public GCS “gtv-videos-bucket” URLs often return 403 from browsers. */
export const TEMP_DEMO_VIDEO_URL =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

/**
 * Same as pickDemoVideoRelPath, but uses TEMP_DEMO_VIDEO_URL when the API omits a URL (local testing).
 */
export function pickDemoVideoRelPathOrTestFallback(record) {
  const fromApi = pickDemoVideoRelPath(record);
  if (fromApi) return fromApi;
  if (!USE_TEMP_DEMO_VIDEO_FALLBACK) return '';
  return TEMP_DEMO_VIDEO_URL;
}
