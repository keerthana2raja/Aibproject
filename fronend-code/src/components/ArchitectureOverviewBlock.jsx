import React, { useState } from 'react';
import { Download, Copy, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { parseArchitectureField, copyImageUrlToClipboard } from '../utils/architectureDisplay';
import {
  suggestedFilenameFromUrl,
  triggerDownloadFromUrl,
} from '../utils/downloadFromUrl';

/**
 * prose: written architecture narrative from the submission form.
 * diagramHref: URL for uploaded diagram (may match `architecture` when API stores URL there).
 */
export default function ArchitectureOverviewBlock({ prose, diagramHref }) {
  const toast = useToast();
  const [busy, setBusy] = useState(null);

  const parsed = diagramHref ? parseArchitectureField(diagramHref) : { kind: 'empty' };

  if (!prose?.trim() && parsed.kind === 'empty') return null;

  const run = async (key, fn) => {
    setBusy(key);
    try {
      await fn();
    } catch {
      toast.error('That action failed. Try downloading or copying the link instead.');
    } finally {
      setBusy(null);
    }
  };

  const fileNameGuess = diagramHref ? suggestedFilenameFromUrl(diagramHref, 'architecture-diagram') : 'architecture';

  const handleDownloadDiagram = () =>
    run('dl', async () => {
      if (!diagramHref) return;
      await triggerDownloadFromUrl(diagramHref, fileNameGuess);
      toast.success('Download started');
    });

  const handleCopyLink = () =>
    run('link', async () => {
      if (!diagramHref) return;
      await navigator.clipboard.writeText(diagramHref);
      toast.success('Architecture link copied to clipboard.');
    });

  const handleCopyImage = () =>
    run('img', async () => {
      if (!diagramHref) return;
      await copyImageUrlToClipboard(diagramHref);
      toast.success('Image copied — paste into email or a document.');
    });

  const diagramToolbar =
    parsed.kind === 'image' ? (
      <div className="flex flex-wrap gap-2 px-3 py-3 border-t border-border bg-surface-muted/35">
        <button
          type="button"
          disabled={busy === 'dl'}
          onClick={() => handleDownloadDiagram()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-200 bg-brand-50/90 text-[12px] font-semibold text-brand-900 hover:bg-brand-100 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
        >
          <Download className="w-3.5 h-3.5" strokeWidth={2} />
          {busy === 'dl' ? '…' : 'Download'}
        </button>
        <button
          type="button"
          disabled={busy === 'link'}
          onClick={() => handleCopyLink()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-[12px] font-semibold text-text-primary hover:bg-surface-muted disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
        >
          <Copy className="w-3.5 h-3.5" strokeWidth={2} />
          Copy link
        </button>
        <button
          type="button"
          disabled={busy === 'img'}
          onClick={() => handleCopyImage()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-[12px] font-semibold text-text-primary hover:bg-surface-muted disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
        >
          <ImageIcon className="w-3.5 h-3.5" strokeWidth={2} />
          {busy === 'img' ? '…' : 'Copy image'}
        </button>
        <a
          href={parsed.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-transparent text-[12px] font-semibold text-brand-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
        >
          <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
          Open
        </a>
      </div>
    ) : null;

  return (
    <div className="mb-2">
      <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wide mb-0.5">
        Architecture overview
      </div>
      {prose?.trim() ? (
        <p className="text-[12px] text-text-secondary leading-relaxed">{prose.trim()}</p>
      ) : null}

      {parsed.kind === 'image' ? (
        <div className="mt-3 rounded-xl border border-border bg-surface overflow-hidden shadow-inner">
          <div className="bg-white flex justify-center items-center max-h-[min(480px,60vh)] p-3">
            <img
              src={parsed.resolved}
              alt="Architecture diagram for this submission"
              className="max-h-[min(440px,55vh)] w-auto max-w-full object-contain"
              loading="lazy"
            />
          </div>
          {diagramToolbar}
        </div>
      ) : null}

      {parsed.kind === 'pdf' ? (
        <div className="mt-3 space-y-2">
          <div className="rounded-xl border border-border overflow-hidden bg-surface-muted/30">
            <iframe title="Architecture diagram PDF" src={parsed.href} className="w-full min-h-[360px]" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy === 'dl'}
              onClick={() => handleDownloadDiagram()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-200 bg-brand-50 text-[12px] font-semibold text-brand-900 hover:bg-brand-100 disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={2} />
              Download PDF
            </button>
            <button
              type="button"
              disabled={busy === 'link'}
              onClick={() => handleCopyLink()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-[12px] font-semibold text-text-primary hover:bg-surface-muted disabled:opacity-60"
            >
              <Copy className="w-3.5 h-3.5" strokeWidth={2} />
              Copy link
            </button>
          </div>
        </div>
      ) : null}

      {parsed.kind === 'link' ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <a
            href={parsed.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono text-brand hover:underline break-all flex-1 min-w-0"
          >
            {diagramHref.length > 80 ? `${diagramHref.slice(0, 76)}…` : diagramHref}
          </a>
          <button
            type="button"
            disabled={busy === 'dl'}
            onClick={() => handleDownloadDiagram()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-brand-200 bg-brand-50 text-[11px] font-semibold text-brand-900 shrink-0"
          >
            <Download className="w-3 h-3" strokeWidth={2} />
            Download
          </button>
          <button
            type="button"
            disabled={busy === 'link'}
            onClick={() => handleCopyLink()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-surface text-[11px] font-semibold shrink-0"
          >
            Copy link
          </button>
        </div>
      ) : null}
    </div>
  );
}
