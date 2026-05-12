import { resolveAttachmentHref } from './mediaSrc';
import { fetchUrlAsBlob } from './downloadFromUrl';

/**
 * Decide how to render `submission.architecture` — prose vs uploaded diagram URL, etc.
 */
export function parseArchitectureField(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return { kind: 'empty' };

  if (/^https?:\/\//i.test(raw)) {
    const resolved = resolveAttachmentHref(raw);
    const pathForExt = raw.split(/[?#]/)[0].toLowerCase();
    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(pathForExt)) {
      return { kind: 'image', href: raw, resolved };
    }
    if (/\.pdf$/i.test(pathForExt)) {
      return { kind: 'pdf', href: raw, resolved };
    }
    return { kind: 'link', href: raw, resolved };
  }

  return { kind: 'text', text: value };
}

/** Copy image pixels to clipboard (supported in Chromium; fails on unsupported browsers or blocked CORS). */
export async function copyImageUrlToClipboard(url) {
  if (!url) throw new Error('Missing URL');
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.clipboard?.write !== 'function' ||
    typeof ClipboardItem === 'undefined'
  ) {
    throw new Error('Clipboard paste of images not supported in this browser.');
  }

  const blob = await fetchUrlAsBlob(url);
  if (!blob.type.startsWith('image/')) {
    throw new Error('Not an image');
  }

  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
}
