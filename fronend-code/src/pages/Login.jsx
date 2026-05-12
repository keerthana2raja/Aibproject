import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  Database,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import { getPlatformCounts } from '../api/platform';
import infovisionLogo from '../assets/Infovision_Logo.png';

const COUNTS_CACHE_KEY = 'aimplify_login_platform_counts_v1';

function readPlatformCountsCache() {
  try {
    const raw = sessionStorage.getItem(COUNTS_CACHE_KEY);
    if (!raw) return null;
    const { rows, v } = JSON.parse(raw);
    if (v !== 2 || !Array.isArray(rows)) return null;
    return rows;
  } catch {
    return null;
  }
}

function writePlatformCountsCache(rows) {
  try {
    sessionStorage.setItem(COUNTS_CACHE_KEY, JSON.stringify({ v: 2, rows }));
  } catch {
    /* ignore quota / private mode */
  }
}

const FAMILY_NUMBER_COLORS = {
  family_atlas:    'text-teal-500',
  family_forge:    'text-orange-500',
  family_nexus:    'text-violet-500',
  family_relay:    'text-green-500',
  family_sentinel: 'text-red-500',
};

function coerceNumber(val) {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim() !== '' && Number.isFinite(Number(val))) return Number(val);
  return null;
}

function humanizeLabel(key) {
  return String(key)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-./]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Walk nested objects; collect numeric leaves as stat rows */
function flattenCountsPayload(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  const rows = [];
  const walk = (o, prefix = '') => {
    for (const [key, val] of Object.entries(o)) {
      const path = prefix ? `${prefix}_${key}` : key;
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        walk(val, path);
      } else if (!Array.isArray(val)) {
        const n = coerceNumber(val);
        if (n !== null) rows.push({ id: path, label: humanizeLabel(path), value: n });
      }
    }
  };
  walk(obj);
  rows.sort((a, b) => a.label.localeCompare(b.label));
  return rows;
}

/**
 * Use inner payload only when `{ data: { ...counts } }` wraps stats — not when `data` is the families array.
 */
function unwrapCountsResponse(res) {
  const body = res?.data;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  if (body.data != null && typeof body.data === 'object' && !Array.isArray(body.data)) {
    return body.data;
  }
  return body;
}

/** Map `/v1/platform/counts` body: totals + `data[]` families + generic numeric fields */
function rowsFromPlatformCounts(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return [];

  const rows = [];
  const seen = new Set();

  const push = (id, label, value, tagline) => {
    const n = coerceNumber(value);
    if (n === null) return;
    if (seen.has(id)) return;
    seen.add(id);
    const row = { id, label, value: n };
    if (tagline) row.tagline = tagline;
    rows.push(row);
  };

  const { totalFamilies, totalAssets, data, ...rest } = body;

  push('totalFamilies', 'Total families', totalFamilies);
  push('totalAssets', 'Total assets', totalAssets);

  if (Array.isArray(data)) {
    for (const item of data) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const key = typeof item.key === 'string' ? item.key : '';
      const id = key ? `family_${key}` : `family_${seen.size}`;
      const label =
        typeof item.name === 'string' && item.name.trim() ? item.name.trim() : humanizeLabel(key || id);
      const tagline =
        typeof item.tagline === 'string' && item.tagline.trim() ? item.tagline.trim() : '';
      push(id, label, item.assetCount, tagline);
    }
  }

  const extra = flattenCountsPayload(rest);
  for (const r of extra) {
    if (!seen.has(r.id)) {
      rows.push(r);
      seen.add(r.id);
    }
  }

  return rows;
}

function StatCardSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-5 shadow-sm animate-pulse" aria-hidden>
      <div className="h-7 w-8 rounded bg-slate-200" />
      <div className="mt-2 h-2.5 w-12 rounded bg-slate-200" />
    </div>
  );
}

function StatCard({ row }) {
  const color = FAMILY_NUMBER_COLORS[row.id] ?? 'text-brand-600';
  const formatted =
    row.value >= 1_000_000
      ? `${(row.value / 1_000_000).toFixed(1)}M`
      : row.value >= 10_000
        ? `${(row.value / 1_000).toFixed(1)}K`
        : String(row.value);

  return (
    <article
      className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-5 shadow-sm hover:shadow-md transition-shadow"
      aria-label={`${row.label}: ${formatted}`}
    >
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{formatted}</p>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{row.label}</p>
    </article>
  );
}

const Login = () => {
  const navigate = useNavigate();
  const { login, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  const cachedRows = readPlatformCountsCache();
  const [countsLoading, setCountsLoading] = useState(cachedRows === null);
  const [countsError, setCountsError] = useState(null);
  const [countsRows, setCountsRows] = useState(cachedRows ?? []);
  const fetchSeq = useRef(0);

  const fetchCounts = useCallback(async (signal, opts = {}) => {
    const { silent = false } = opts;
    const seq = ++fetchSeq.current;
    let aborted = false;
    if (!silent) {
      setCountsLoading(true);
    }
    setCountsError(null);
    try {
      const res = await getPlatformCounts(signal ? { signal } : {});
      if (seq !== fetchSeq.current) return;
      const inner = unwrapCountsResponse(res);
      const rows = rowsFromPlatformCounts(
        typeof inner === 'object' && inner !== null && !Array.isArray(inner) ? inner : {},
      );
      setCountsRows(rows);
      writePlatformCountsCache(rows);
    } catch (e) {
      if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError') {
        aborted = true;
        return;
      }
      if (seq !== fetchSeq.current) return;
      const msg = e.response?.data?.message || e.message || 'Unable to load platform metrics.';
      setCountsError(msg);
      if (!silent) setCountsRows([]);
    } finally {
      if (!aborted && seq === fetchSeq.current) setCountsLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    const hasCache = readPlatformCountsCache() !== null;
    void fetchCounts(ac.signal, { silent: hasCache });
    return () => ac.abort();
  }, [fetchCounts]);

  const displayRows = useMemo(
    () => countsRows.filter((r) => r.id.startsWith('family_')),
    [countsRows],
  );

  const totalAssetsCount = useMemo(
    () => countsRows.find((r) => r.id === 'totalAssets')?.value ?? null,
    [countsRows],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.message);
    }
  };

  const showSkeletonGrid = countsLoading && countsRows.length === 0;

  const showEmptyCounts = !countsLoading && !countsError && displayRows.length === 0;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row antialiased">

      {/* ── Left: blue panel ── */}
      <div className="flex flex-col justify-between bg-brand-700 px-8 py-10 lg:w-[55%] lg:px-14 lg:py-14">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 mb-10">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <Layers className="h-6 w-6 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[15px] font-extrabold tracking-tight text-white leading-none">AIMPLIFY</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200 mt-0.5">by InfoVision</p>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            AI Capabilities &amp;<br />Accelerator Platform
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-blue-100/90">
            Discover, deploy, and demonstrate InfoVision&apos;s AI assets — from prompt libraries and
            agent patterns to production-ready accelerators.
          </p>

          {/* Platform snapshot */}
          <section
            className="mt-10 rounded-2xl bg-white/10 ring-1 ring-white/15 p-5"
            aria-labelledby="platform-snapshot-heading"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2
                  id="platform-snapshot-heading"
                  className="text-[11px] font-bold uppercase tracking-widest text-blue-100"
                >
                  Platform Snapshot
                </h2>
                <p className="text-[11px] text-blue-200/80 mt-0.5">Live counts from your environment</p>
              </div>
              <button
                type="button"
                onClick={() => void fetchCounts(undefined, { silent: false })}
                disabled={countsLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 ring-1 ring-white/20 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-white/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${countsLoading ? 'animate-spin' : ''}`} strokeWidth={2} aria-hidden />
                Refresh
              </button>
            </div>

            {countsError && (
              <div role="alert" className="mb-3 flex gap-2 rounded-lg bg-amber-400/20 ring-1 ring-amber-300/30 px-3 py-2 text-xs text-amber-100">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-300 mt-0.5" strokeWidth={2} />
                <span>{countsError}</span>
              </div>
            )}

            <div
              className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3"
              aria-busy={showSkeletonGrid}
              aria-live="polite"
            >
              {showSkeletonGrid ? (
                Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
              ) : showEmptyCounts ? (
                <div className="col-span-3 sm:col-span-5 py-6 text-center text-sm text-blue-200">
                  No platform data
                </div>
              ) : (
                displayRows.map((row) => <StatCard key={row.id} row={row} />)
              )}
            </div>
          </section>
        </div>

      </div>

      {/* ── Right: login panel ── */}
      <div className="flex flex-col justify-between bg-slate-100 px-6 py-10 lg:w-[45%] lg:px-14 lg:py-14">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[420px]">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_4px_32px_-8px_rgba(15,23,42,0.10)]">
              {/* InfoVision logo */}
              <div className="mb-6 text-center">
                <img
                  src={infovisionLogo}
                  alt="InfoVision"
                  className="mx-auto h-16 w-auto max-w-[240px] object-contain"
                  draggable={false}
                />
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Enterprise sign in
                </p>
              </div>
              <hr className="border-slate-100 mb-6" />

              <h2 className="text-[18px] font-bold text-slate-900">Sign in</h2>
              <p className="mt-1 text-[13px] text-slate-500">Use your InfoVision credentials</p>

              {error && (
                <div
                  className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" strokeWidth={2} />
                  <span className="text-[13px] text-red-800">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@infovision.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/15 transition-[box-shadow,border-color]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-[14px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/15 transition-[box-shadow,border-color]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showPwd ? 'Hide password' : 'Show password'}
                    >
                      {showPwd
                        ? <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                        : <Eye className="h-4 w-4" strokeWidth={1.75} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-xl bg-brand-600 py-3.5 text-[15px] font-semibold text-white shadow-sm hover:bg-brand-700 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
                >
                  {authLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner size="sm" color="white" />
                      Signing in…
                    </span>
                  ) : 'Sign in'}
                </button>
              </form>

              <p className="mt-5 text-center text-[12px] text-slate-500">
                Access issues?{' '}
                <a
                  href="mailto:it@infovision.com"
                  className="font-semibold text-brand-600 hover:underline underline-offset-2"
                >
                  Contact IT
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Page footer */}
        <footer className="pt-6 text-center text-[12px] text-slate-400">
          © 2026 InfoVision, Inc. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Login;
