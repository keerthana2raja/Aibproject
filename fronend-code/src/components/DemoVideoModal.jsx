import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, VideoOff } from 'lucide-react';
import VideoPlayer from './media/VideoPlayer';

/**
 * In-app demo viewer: blurred backdrop, enterprise chrome, reusable VideoPlayer or empty/error copy.
 */
const DemoVideoModal = ({ open, title, src, onClose, emptyMessage }) => {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Demo video: ${title}` : 'Demo video'}
    >
      <button
        type="button"
        aria-label="Close video"
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-xl transition-opacity duration-200"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-border bg-surface shadow-2xl shadow-black/40 ring-1 ring-black/5 overflow-hidden transition-all duration-200 ease-out">
        <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border bg-surface-muted/80">
          <h2 className="text-sm font-semibold text-text-primary truncate min-w-0 pr-2">{title || 'Demo'}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-muted hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {!src ? (
          <div className="flex flex-col items-center justify-center min-h-[220px] px-6 py-12 bg-surface-3">
            <VideoOff className="w-10 h-10 text-text-muted mb-3" strokeWidth={1.25} />
            <p className="text-[13px] text-text-secondary text-center max-w-md leading-relaxed">
              {emptyMessage ||
                'No demo video is linked for this asset yet. Check back after a file is uploaded or a URL is published.'}
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[calc(90vh-52px)]">
            <VideoPlayer src={src} autoPlay />
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default DemoVideoModal;
