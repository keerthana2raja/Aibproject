import React, { useState } from 'react';
import { Paperclip, FileText, Download } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { suggestedFilenameFromUrl, triggerDownloadFromUrl } from '../utils/downloadFromUrl';

export function formatAttachmentBytes(bytes) {
  if (bytes == null || typeof bytes !== 'number' || !Number.isFinite(bytes)) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let u = 0;
  let n = bytes;
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024;
    u++;
  }
  const shown = u === 0 || n >= 10 ? Math.round(n) : Number(n.toFixed(1));
  return `${shown} ${units[u]}`;
}

function safeFilenameFromLabel(name, href) {
  const n = typeof name === 'string' ? name.trim() : '';
  if (
    n &&
    !n.includes('..') &&
    !/[\\/]/u.test(n) &&
    n.length < 240
  ) {
    return n;
  }
  return suggestedFilenameFromUrl(href, 'attachment');
}

/**
 * attachments: `{ name?, relpath?, bytes?, mimetype? }[]` or legacy strings
 * @param {{ showGetButton?: boolean }} — set false where downloads are duplicated (e.g. Submission Review architecture).
 */
const AttachedDocumentsPanel = ({ attachments, resolveHref, className = '', showGetButton = true }) => {
  const toast = useToast();
  const [busyIdx, setBusyIdx] = useState(null);

  if (!attachments?.length) return null;

  const handleGet = async (e, idx, href, label) => {
    e.preventDefault();
    const key = String(idx);
    setBusyIdx(key);
    try {
      await triggerDownloadFromUrl(href, safeFilenameFromLabel(label, href));
      toast.success('Download started');
    } catch {
      toast.error('Opening file in a new tab — save from the browser if needed.');
      window.open(href, '_blank', 'noopener,noreferrer');
    } finally {
      setBusyIdx(null);
    }
  };

  return (
    <section
      className={`rounded-xl border border-border bg-surface shadow-card card-hover overflow-hidden ${className}`.trim()}
    >
      <h2 className="flex items-center gap-2 px-4 py-3.5 border-b border-border bg-surface-muted/40">
        <Paperclip className="w-[18px] h-[18px] text-brand-700 shrink-0" strokeWidth={2} />
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-800">Attached documents</span>
      </h2>
      <ul className="divide-y divide-border">
        {attachments.map((file, idx) => {
          const name = typeof file === 'string' ? file : file?.name || 'Document';
          const relpath = typeof file === 'object' && file?.relpath ? file.relpath : null;
          const bytes = typeof file === 'object' && file?.bytes != null ? file.bytes : null;
          const href = relpath && resolveHref ? resolveHref(relpath) : null;
          const loading = busyIdx === String(idx);

          return (
            <li
              key={`${name}-${idx}`}
              className="flex items-center gap-3 px-4 py-3.5 bg-surface hover:bg-surface-muted/30 transition-colors"
            >
              <FileText className="w-[18px] h-[18px] text-brand-600/80 shrink-0" strokeWidth={1.75} />
              <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                <span className="text-[13px] font-semibold text-brand-900 truncate">{name}</span>
                <span className="text-[12px] text-text-muted tabular-nums sm:ml-auto sm:text-right">
                  {formatAttachmentBytes(bytes)}
                </span>
              </div>
              {showGetButton ? (
                href ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={(e) => handleGet(e, idx, href, name)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-200 bg-brand-50/80 text-[12px] font-semibold text-brand-800 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 transition-colors disabled:opacity-65"
                  >
                    <Download className="w-3.5 h-3.5" strokeWidth={2} />
                    {loading ? '…' : 'Get'}
                  </button>
                ) : (
                  <span
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-muted text-[12px] font-semibold text-text-muted cursor-not-allowed opacity-70"
                    title="No file path available for download"
                  >
                    <Download className="w-3.5 h-3.5" strokeWidth={2} />
                    Get
                  </span>
                )
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default AttachedDocumentsPanel;
