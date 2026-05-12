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
  const over = [];
  for (const file of files) {
    if (!file) continue;
    if (file.size > ATTACHMENT_MAX_BYTES_PER_FILE) {
      over.push(`“${file.name}” (${formatSizeMb(file.size)})`);
    }
  }
  if (over.length) {
    return {
      ok: false,
      message:
        over.length === 1
          ? `Each attachment must be at most 40 MB. This file exceeds the limit: ${over[0]}.`
          : `Each attachment must be at most 40 MB. Over limit: ${over.join('; ')}.`,
    };
  }
  return { ok: true };
}

/** Runs all submission file checks; optional files are skipped when null/empty. */
export function validateAllSubmissionUploads(demoVideoFile, architectureFile, supportingFiles) {
  const demo = validateDemoVideoFile(demoVideoFile);
  const arch = validateArchitectureDiagramFile(architectureFile);
  const att = validateAttachmentFiles(supportingFiles);
  const messages = [];
  if (!demo.ok) messages.push(demo.message);
  if (!arch.ok) messages.push(arch.message);
  if (!att.ok) messages.push(att.message);
  return {
    ok: demo.ok && arch.ok && att.ok,
    demo,
    arch,
    att,
    messages,
  };
}
