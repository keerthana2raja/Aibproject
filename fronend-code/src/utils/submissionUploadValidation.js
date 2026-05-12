/** Client-side limits aligned with submission upload APIs */

export const DEMO_VIDEO_MAX_BYTES = 120 * 1024 * 1024;
export const ARCHITECTURE_DIAGRAM_MAX_BYTES = 20 * 1024 * 1024;
export const ATTACHMENT_MAX_BYTES_PER_FILE = 40 * 1024 * 1024;

const DEMO_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const ARCH_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'image/webp',
  'application/pdf',
]);

function formatSizeMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function demoVideoByExtension(name) {
  return /\.(mp4|webm|mov)$/i.test(name || '');
}

function architectureByExtension(name) {
  return /\.(png|jpe?g|svg|webp|pdf)$/i.test(name || '');
}

/** @param {File | null | undefined} file */
export function validateDemoVideoFile(file) {
  if (!file) return { ok: true };
  if (file.size > DEMO_VIDEO_MAX_BYTES) {
    return {
      ok: false,
      message: `Demo video must be at most 120 MB (this file is ${formatSizeMb(file.size)}).`,
    };
  }
  const mimeOk = file.type && DEMO_MIME.has(file.type);
  const extOk = demoVideoByExtension(file.name);
  if (!mimeOk && !extOk) {
    return { ok: false, message: 'Demo video must be MP4, WebM, or MOV.' };
  }
  return { ok: true };
}

/** @param {File | null | undefined} file */
export function validateArchitectureDiagramFile(file) {
  if (!file) return { ok: true };
  if (file.size > ARCHITECTURE_DIAGRAM_MAX_BYTES) {
    return {
      ok: false,
      message: `Architecture diagram must be at most 20 MB (this file is ${formatSizeMb(file.size)}).`,
    };
  }
  const mimeOk = file.type && ARCH_MIME.has(file.type);
  const extOk = architectureByExtension(file.name);
  if (!mimeOk && !extOk) {
    return {
      ok: false,
      message: 'Architecture diagram must be PNG, JPG, SVG, WebP, or PDF.',
    };
  }
  return { ok: true };
}

/** @param {File[]} files */
export function validateAttachmentFiles(files) {
  if (!files?.length) return { ok: true };
  for (const file of files) {
    if (!file) continue;
    if (file.size > ATTACHMENT_MAX_BYTES_PER_FILE) {
      return {
        ok: false,
        message: `Each attachment must be at most 40 MB (“${file.name}” is ${formatSizeMb(file.size)}).`,
      };
    }
  }
  return { ok: true };
}
