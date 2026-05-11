import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  Menu,
  UserRound,
  Settings,
  LogOut,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { searchSuggestions } from '../api/search';
import Spinner from './ui/Spinner';

const PAGE_META = {
  '/dashboard': { title: 'Dashboard', sub: 'AIMPLIFY · Enterprise accelerator catalog' },
  '/catalog': { title: 'Asset Catalog', sub: 'AIMPLIFY · Enterprise accelerator catalog' },
  '/submit': { title: 'Submit Asset', sub: 'Register a new accelerator for review' },
  '/pipeline': { title: 'Approval Pipeline', sub: 'Submission status and governance' },
  '/analytics': { title: 'Analytics', sub: 'Usage and deployment metrics' },
  '/settings': { title: 'Settings', sub: 'Preferences and access' },
  '/help': { title: 'Help', sub: 'Documentation and support' },
};

function resolveMeta(pathname) {
  if (pathname.startsWith('/detail/')) {
    return { title: 'Asset Detail', sub: 'AIMPLIFY · Enterprise accelerator catalog' };
  }
  if (pathname.startsWith('/family/')) {
    return { title: 'Platform Family', sub: 'Scope, dependencies, and assets' };
  }
  if (/^\/pipeline\/[^/]+$/.test(pathname)) {
    return { title: 'Submission Review', sub: 'AI findings and governance' };
  }
  if (pathname.startsWith('/catalog/new')) {
    return { title: 'Add to Catalog', sub: 'Register a new asset' };
  }
  const key = Object.keys(PAGE_META).find((k) => pathname.startsWith(k));
  return key ? PAGE_META[key] : { title: 'AIMPLIFY', sub: 'Enterprise accelerator catalog' };
}

const Topbar = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { searchQuery, setSearchQuery } = useSearch();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const searchRef = useRef(null);
  const profileMenuRef = useRef(null);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const { title, sub } = resolveMeta(location.pathname);

  const initials = user?.name
    ? user.name
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  useEffect(() => {
    const close = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setResults(null);
        setQuery('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSearch = (val) => {
    setQuery(val);
    setSearchQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchSuggestions(val.trim());
        setResults(res.data || { assets: [], families: [] });
      } catch {
        setResults({ assets: [], families: [] });
      } finally {
        setSearching(false);
      }
    }, 280);
  };

  const hasHits =
    results && ((results.assets?.length > 0) || (results.families?.length > 0));

  return (
    <header className="sticky top-0 z-10 flex-shrink-0 bg-surface/90 backdrop-blur-md border-b border-border shadow-topbar">
      <div className="h-14 flex items-center px-4 lg:px-6 gap-3 min-w-0">
        <button
          type="button"
          className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-surface-muted -ml-1 shrink-0"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex-shrink">
          <h1 className="text-[15px] font-semibold text-text-primary tracking-tight truncate">{title}</h1>
          <p className="text-[11px] text-text-muted truncate hidden sm:block">{sub}</p>
        </div>

        <div ref={searchRef} className="relative hidden md:flex flex-1 max-w-xs ml-4 lg:ml-8 min-w-0">
          <div
            className={`flex items-center gap-2 w-full rounded-lg border px-3 py-2 text-left text-[12px] shadow-inner transition-colors ${
              showSearch
                ? 'border-brand-400 bg-surface ring-2 ring-brand-500/15'
                : 'border-border bg-surface-muted/80 hover:bg-surface-muted hover:border-border-strong'
            }`}
            onClick={() => {
              setShowSearch(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowSearch(true);
                inputRef.current?.focus();
              }
            }}
            role="search"
          >
            <Search className="w-4 h-4 shrink-0 opacity-70" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowSearch(true)}
              placeholder="Search assets & families…"
              className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-muted/80 outline-none min-w-0 caret-text-primary"
              style={{ color: '#0f172a' }}
              aria-label="Search"
            />
            {searching ? (
              <Spinner size="sm" />
            ) : (
              <kbd className="ml-auto hidden sm:inline-flex text-[10px] font-medium text-text-muted border border-border rounded px-1.5 py-0.5 bg-surface shadow-sm">
                /
              </kbd>
            )}
          </div>

          {query.trim() && !searching && results && (
            <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-[70] overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
              {hasHits ? (
                <>
                  {results.assets?.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted border-b border-border bg-surface-muted/80">
                        Assets
                      </div>
                      {results.assets.slice(0, 5).map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[13px] font-medium text-text-primary hover:bg-surface-muted"
                          onClick={() => {
                            navigate(`/detail/${a.id}`);
                            setShowSearch(false);
                            setQuery('');
                            setResults(null);
                          }}
                        >
                          <span className="text-[10px] font-mono text-text-muted bg-surface-muted px-1.5 py-0.5 rounded shrink-0">
                            {a.id}
                          </span>
                          <span className="truncate flex-1">{a.name}</span>
                          <span className="text-[11px] text-text-muted capitalize shrink-0">{a.family}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.families?.length > 0 && (
                    <div className={results.assets?.length ? 'border-t border-border' : ''}>
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted border-b border-border bg-surface-muted/80">
                        Families
                      </div>
                      {results.families.slice(0, 3).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left hover:bg-surface-muted"
                          onClick={() => {
                            navigate(`/family/${f.id}`);
                            setShowSearch(false);
                            setQuery('');
                            setResults(null);
                          }}
                        >
                          <span className="text-[13px] font-semibold text-text-primary">{f.name}</span>
                          <span className="text-[11px] text-text-muted truncate w-full">{f.tagline}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <button
            type="button"
            className="md:hidden p-2 rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-muted shadow-sm"
            onClick={() => navigate('/catalog')}
            aria-label="Search catalog"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="p-2 rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-muted hover:text-brand-600 shadow-sm transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-surface" />
          </button>

          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((o) => !o)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-border bg-surface shadow-sm hover:border-border-strong hover:shadow-card transition-all"
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-[11px] font-bold text-white shadow-sm ring-2 ring-brand-400/25">
                {initials}
              </div>
              <UserRound className="w-4 h-4 text-text-muted hidden sm:block" strokeWidth={1.5} aria-hidden />
            </button>

            {profileMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] z-[70] min-w-[200px] overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
              >
                <div className="px-3 py-2 border-b border-border">
                  <div className="text-[13px] font-semibold text-text-primary truncate">{user?.name || 'User'}</div>
                  <div className="text-[11px] text-text-muted truncate">{user?.email || ''}</div>
                </div>
                {/* Settings button hidden for demo */}
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="w-4 h-4 shrink-0 opacity-90" strokeWidth={1.5} aria-hidden />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
