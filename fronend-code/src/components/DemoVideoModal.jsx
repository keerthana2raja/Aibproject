import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Full-viewport overlay with blurred backdrop; centered HTML5 video with native controls.
 */
const DemoVideoModal = ({ open, title, src, onClose }) => {
  const videoRef = useRef(null);
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
    if (!open || !videoRef.current) return;
    videoRef.current.play().catch(() => {});
  }, [open, src]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !src) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Demo video: ${title}` : 'Demo video'}
    >
      <button
        type="button"
        aria-label="Close video"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-4xl max-h-[85vh] flex flex-col rounded-xl border border-white/20 bg-surface shadow-2xl shadow-black/40 ring-1 ring-black/5 overflow-hidden transition-all duration-200 ease-out">
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
        <div className="bg-black flex items-center justify-center min-h-[200px] max-h-[calc(85vh-52px)]">
          <video
            ref={videoRef}
            key={src}
            className="w-full max-h-[calc(85vh-52px)] object-contain"
            controls
            controlsList="nodownload"
            playsInline
            preload="metadata"
            src={src}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DemoVideoModal;
