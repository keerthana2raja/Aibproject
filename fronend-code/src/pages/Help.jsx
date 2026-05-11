import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  BookOpen,
  Video,
  Terminal,
  MessageCircle,
  Mail,
  ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchSuggestions } from '../api/search';
import { getHelp } from '../api/help';
import Spinner from '../components/ui/Spinner';
import PageLoader from '../components/ui/PageLoader';
import ErrorState from '../components/ui/ErrorState';

const ICON_MAP = {
  book: BookOpen,
  video: Video,
  terminal: Terminal,
  message: MessageCircle,
  mail: Mail,
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
        <span className="text-[12px] font-semibold text-text-primary pr-2">{question}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-muted flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={1.5}
        />
      </button>
      {isOpen && (
        <div className="text-[12px] text-text-secondary pb-3 leading-relaxed pr-6">
          {answer}
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
      className={`bg-surface border border-border p-3 text-left transition-colors focus-ring ${
        isClickable ? 'hover:border-border-mid cursor-pointer' : 'opacity-95 cursor-default'
      }`}
    >
      <div className="w-8 h-8 border border-border bg-surface-3 flex items-center justify-center mb-2">
        <Icon className="w-4 h-4 text-text-muted" strokeWidth={1.5} />
      </div>
      <div className="text-[12px] font-semibold text-text-primary">{title}</div>
      <div className="text-[10px] text-text-muted mt-0.5">{subtitle}</div>
    </button>
  );
};

const Help = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [helpPayload, setHelpPayload] = useState(null);
  const [helpError, setHelpError] = useState(null);
  const debounceRef = useRef(null);

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

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const t = q.trim();
    if (!t) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchSuggestions(t);
        setResults(res.data.data || { assets: [], families: [] });
      } catch {
        setResults({ assets: [], families: [], _error: true });
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [q]);

  const openApiDocs = () => {
    window.open(`${window.location.origin}/api-docs`, '_blank', 'noopener,noreferrer');
  };

  const hasHits =
    results &&
    ((results.assets && results.assets.length > 0) || (results.families && results.families.length > 0));

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
  const contact = helpPayload?.contact || { title: 'Contact', description: '', buttons: [] };

  return (
    <div className="p-3 lg:p-4 flex flex-col gap-4 flex-1 max-w-[960px] w-full mx-auto">
      <div>
        <h2 className="text-[13px] font-semibold text-text-primary">Help</h2>
        <p className="text-[11px] text-text-muted mt-0.5">
          {helpPayload?.subtitle ||
            'Search uses the live registry API; topics below are loaded from GET /v1/help.'}
        </p>
      </div>

      <div className="relative max-w-lg">
        <Search
          className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted"
          strokeWidth={1.5}
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search catalog (assets & families from server)…"
          className="w-full pl-8 pr-8 py-2 border border-border bg-surface text-[12px] outline-none focus:border-border-mid focus:ring-1 focus:ring-border-mid"
        />
        {searching && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Spinner size="sm" color="muted" />
          </div>
        )}
      </div>

      {q.trim() && !searching && results && (
        <div className="border border-border bg-surface p-3 text-[11px] max-w-lg">
          {results._error ? (
            <span className="text-text-muted">Search unavailable. Ensure the API is running.</span>
          ) : hasHits ? (
            <ul className="space-y-1 divide-y divide-border">
              {(results.assets || []).map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/detail/${a.id}`);
                      setQ('');
                      setResults(null);
                    }}
                    className="w-full text-left py-2 hover:bg-surface-3 focus-ring"
                  >
                    <span className="font-mono text-[10px] text-text-secondary">{a.id}</span>
                    <span className="block font-medium text-text-primary">{a.name}</span>
                    <span className="text-text-muted capitalize">{a.family}</span>
                  </button>
                </li>
              ))}
              {(results.families || []).map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/family/${f.id}`);
                      setQ('');
                      setResults(null);
                    }}
                    className="w-full text-left py-2 hover:bg-surface-3 focus-ring"
                  >
                    <span className="font-semibold text-text-primary">{f.name}</span>
                    <span className="block text-text-muted truncate">{f.tagline}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-text-muted">No catalog matches.</span>
          )}
        </div>
      )}

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

      <div className="bg-surface border border-border p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-2">
          Frequently asked
        </div>
        {faqs.map((f) => (
          <FaqItem key={f.question} question={f.question} answer={f.answer} />
        ))}
      </div>

      <div className="bg-surface border border-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold text-text-primary">{contact.title}</div>
          {contact.description ? (
            <div className="text-[11px] text-text-muted mt-0.5">{contact.description}</div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {(contact.buttons || []).map((b) => {
            const BtnIcon = ICON_MAP[b.icon] || MessageCircle;
            const primary = (b.variant || '').toLowerCase() === 'primary';
            return (
              <button
                key={`${b.label}-${b.icon}`}
                type="button"
                className={
                  primary
                    ? 'inline-flex items-center gap-1.5 px-3 py-1.5 btn-primary'
                    : 'inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-surface text-[12px] font-semibold text-text-secondary hover:bg-surface-3 focus-ring'
                }
              >
                <BtnIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                {b.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Help;
