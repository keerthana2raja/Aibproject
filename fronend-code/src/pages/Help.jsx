import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Video,
  Terminal,
  MessageCircle,
  ChevronDown,
} from 'lucide-react';
import { getHelp } from '../api/help';
import PageLoader from '../components/ui/PageLoader';
import ErrorState from '../components/ui/ErrorState';

/** Align copy with app nav: "Catalog" (API may still return British "catalogue"). */
function helpDisplayText(text) {
  if (text == null || typeof text !== 'string') return text;
  return text.replace(/\bcatalogue\b/gi, 'Catalog');
}

const ICON_MAP = {
  book: BookOpen,
  video: Video,
  terminal: Terminal,
  message: MessageCircle,
};

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 text-left focus-ring"
      >
        <span className="text-[12px] font-semibold text-text-primary pr-2">{helpDisplayText(question)}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-muted flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={1.5}
        />
      </button>
      {isOpen && (
        <div className="text-[12px] text-text-secondary pb-3 leading-relaxed pr-6">
          {helpDisplayText(answer)}
        </div>
      )}
    </div>
  );
};

const Tile = ({ iconKey, title, subtitle, action, onSwagger }) => {
  const Icon = ICON_MAP[iconKey] || BookOpen;
  const handleClick = () => {
    if (action === 'swagger') onSwagger?.();
  };
  const isClickable = action === 'swagger';

  return (
    <button
      type="button"
      onClick={isClickable ? handleClick : undefined}
      disabled={!isClickable}
      className={`card p-3 text-left transition-colors focus-ring ${
        isClickable
          ? 'card-hover hover:border-border-mid cursor-pointer'
          : 'opacity-95 cursor-default'
      }`}
    >
      <div className="w-8 h-8 border border-border bg-surface-3 rounded-lg flex items-center justify-center mb-2">
        <Icon className="w-4 h-4 text-text-muted" strokeWidth={1.5} />
      </div>
      <div className="text-[12px] font-semibold text-text-primary">{helpDisplayText(title)}</div>
      <div className="text-[10px] text-text-muted mt-0.5">{helpDisplayText(subtitle)}</div>
    </button>
  );
};

const Help = () => {
  const [helpPayload, setHelpPayload] = useState(null);
  const [helpError, setHelpError] = useState(null);

  const loadHelp = async () => {
    setHelpError(null);
    try {
      const res = await getHelp();
      setHelpPayload(res.data.data || null);
    } catch (e) {
      setHelpError(e.response?.data?.message || 'Failed to load help content.');
      setHelpPayload(null);
    }
  };

  useEffect(() => {
    loadHelp();
  }, []);

  const openApiDocs = () => {
    window.open(`${window.location.origin}/api-docs`, '_blank', 'noopener,noreferrer');
  };

  if (!helpPayload && !helpError) {
    return <PageLoader message="Loading help…" />;
  }

  if (helpError && !helpPayload) {
    return (
      <div className="p-6 flex flex-1 items-center justify-center max-w-[960px] w-full mx-auto">
        <ErrorState message={helpError} onRetry={loadHelp} />
      </div>
    );
  }

  const tiles = helpPayload?.resourceTiles || [];
  const faqs = helpPayload?.faqs || [];

  return (
    <div className="p-3 lg:p-4 flex flex-col gap-4 flex-1 max-w-[960px] w-full mx-auto">
      <div>
        <h2 className="text-[13px] font-semibold text-text-primary">Help</h2>
        <p className="text-[11px] text-text-muted mt-0.5">
          {helpPayload?.subtitle
            ? helpDisplayText(helpPayload.subtitle)
            : 'Search uses the live registry API; topics below are loaded from GET /v1/help.'}
        </p>
      </div>


      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {tiles.map((t, idx) => (
          <Tile
            key={`${t.title}-${idx}`}
            iconKey={t.icon}
            title={t.title}
            subtitle={t.subtitle}
            action={t.action}
            onSwagger={openApiDocs}
          />
        ))}
      </div>

      <div className="card card-hover p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-2">
          Frequently asked
        </div>
        {faqs.map((f) => (
          <FaqItem key={f.question} question={f.question} answer={f.answer} />
        ))}
      </div>

    </div>
  );
};

export default Help;
