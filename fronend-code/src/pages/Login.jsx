import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  FolderSearch,
  Package,
  Users,
  TrendingUp,
  GitPullRequest,
  Sparkles,
  Database,
  Shield,
  Activity,
  Box,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import { getPlatformCounts } from '../api/platform';

const COUNTS_CACHE_KEY = 'aimplify_login_platform_counts_v1';

function readPlatformCountsCache() {
  try {
    const raw = sessionStorage.getItem(COUNTS_CACHE_KEY);
    if (!raw) return null;
    const { rows, v } = JSON.parse(raw);
    if (v !== 1 || !Array.isArray(rows)) return null;
    return rows;
  } catch {
    return null;
  }
}

function writePlatformCountsCache(rows) {
  try {
    sessionStorage.setItem(COUNTS_CACHE_KEY, JSON.stringify({ v: 1, rows }));
  } catch {
    /* ignore quota / private mode */
  }
}

const ICON_GRADIENTS = [
  'from-sky-500 to-blue-600 shadow-sky-500/25',
  'from-indigo-500 to-violet-600 shadow-indigo-500/25',
  'from-emerald-500 to-teal-600 shadow-emerald-500/25',
  'from-amber-500 to-orange-600 shadow-amber-500/25',
  'from-violet-500 to-purple-600 shadow-violet-500/25',
  'from-rose-500 to-pink-600 shadow-rose-500/25',
];

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

function iconForStatKey(keyId) {
  const k = keyId.toLowerCase();
  if (k.includes('asset')) return Package;
  if (k.includes('family')) return FolderSearch;
  if (k.includes('user') || k.includes('contributor')) return Users;
  if (k.includes('deploy')) return TrendingUp;
  if (k.includes('submission') || k.includes('pipeline') || k.includes('reg')) return GitPullRequest;
  if (k.includes('accel')) return Sparkles;
  if (k.includes('audit') || k.includes('activity')) return Activity;
  if (k.includes('catalog')) return Database;
  if (k.includes('policy') || k.includes('govern')) return Shield;
  if (k.includes('demo')) return Box;
  return Layers;
}

function StatCardSkeleton({ index }) {
  return (
    <div
      className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm overflow-hidden motion-reduce:animate-none"
      aria-hidden
    >
      <div className="h-10 w-10 rounded-xl bg-slate-200/70 motion-safe:animate-[pulse_2s_ease-in-out_infinite]" />
      <div className="mt-4 h-8 w-16 rounded-md bg-slate-200/60 motion-safe:animate-[pulse_2s_ease-in-out_infinite]" />
      <div className="mt-2 h-3 w-24 rounded bg-slate-200/55 motion-safe:animate-[pulse_2s_ease-in-out_infinite]" />
      <div
        className="mt-4 h-1 rounded-full bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 motion-safe:animate-[pulse_2s_ease-in-out_infinite]"
        style={{ animationDelay: `${index * 120}ms` }}
      />
    </div>
  );
}

function StatCard({ row, index }) {
  const Icon = iconForStatKey(row.id);
  const grad = ICON_GRADIENTS[index % ICON_GRADIENTS.length];
  const formatted =
    row.value >= 1_000_000
      ? `${(row.value / 1_000_000).toFixed(1)}M`
      : row.value >= 10_000
        ? `${(row.value / 1_000).toFixed(1)}K`
        : String(row.value);

  return (
    <article
      className="group relative rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-sky-200/80 hover:shadow-[0_12px_40px_-12px_rgba(14,165,233,0.18)]"
      aria-label={`${row.label}: ${formatted}`}
    >
      <div
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-white shadow-lg`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </div>
      <p className="mt-4 text-2xl sm:text-[1.65rem] font-bold tabular-nums tracking-tight text-slate-900">
        {formatted}
      </p>
      <p className="mt-1 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 leading-snug">
        {row.label}
      </p>
      <div
        className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-sky-200/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
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
      const inner = res?.data?.data ?? res?.data ?? {};
      const rows = flattenCountsPayload(
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

  const displayRows = useMemo(() => countsRows, [countsRows]);

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50/40 text-slate-900 antialiased">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 left-1/2 h-80 w-[min(100%,48rem)] -translate-x-1/2 rounded-full bg-gradient-to-b from-sky-100/60 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-100/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-10 lg:pb-16 lg:pt-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_min(100%,420px)] lg:gap-14 xl:gap-16">
          {/* —— Marketing + stats —— */}
          <div className="min-w-0">
            <header className="mb-8 lg:mb-10">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-lg shadow-brand-700/25 ring-4 ring-white">
                  <Layers className="h-7 w-7 text-white" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700">AIMPLIFY</p>
                  <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl lg:text-[1.85rem] lg:leading-snug">
                    AI Capabilities &amp; Accelerator Platform
                  </h1>
                  <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-600">
                    Discover, deploy, and demonstrate InfoVision&apos;s AI assets — from prompt libraries and
                    agent patterns to production-ready accelerators.
                  </p>
                </div>
              </div>
            </header>

            <section
              className="rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-[0_8px_40px_-20px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-6 lg:p-7"
              aria-labelledby="platform-snapshot-heading"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2
                    id="platform-snapshot-heading"
                    className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500"
                  >
                    Platform snapshot
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">Live counts from your environment</p>
                </div>
                <button
                  type="button"
                  onClick={() => void fetchCounts(undefined, { silent: false })}
                  disabled={countsLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${countsLoading ? 'animate-spin' : ''}`}
                    strokeWidth={2}
                    aria-hidden
                  />
                  Refresh
                </button>
              </div>

              {countsError && (
                <div
                  role="alert"
                  className="mt-4 flex gap-3 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" strokeWidth={2} />
                  <div className="min-w-0">
                    <p className="font-semibold text-amber-950">Metrics unavailable</p>
                    <p className="mt-0.5 text-amber-900/90">{countsError}</p>
                    <button
                      type="button"
                      onClick={() => void fetchCounts(undefined, { silent: false })}
                      className="mt-2 text-xs font-bold text-amber-800 underline underline-offset-2 hover:text-amber-950"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}

              <div
                className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3"
                aria-busy={showSkeletonGrid}
                aria-live="polite"
              >
                {showSkeletonGrid ? (
                  Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} index={i} />)
                ) : showEmptyCounts ? (
                  <div className="col-span-2 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-12 text-center md:col-span-3">
                    <Database className="h-10 w-10 text-slate-300" strokeWidth={1.5} aria-hidden />
                    <p className="mt-3 text-sm font-semibold text-slate-600">No metrics in this response</p>
                    <p className="mt-1 max-w-sm px-4 text-xs text-slate-500">
                      The server returned no numeric fields. Check <code className="rounded bg-slate-200/60 px-1">/v1/platform/counts</code> payload.
                    </p>
                  </div>
                ) : (
                  displayRows.map((row, i) => <StatCard key={row.id} row={row} index={i} />)
                )}
              </div>
            </section>
          </div>

          {/* —— Login card —— */}
          <div className="lg:pt-4">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-7 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.16)] ring-1 ring-slate-900/[0.03] sm:p-9">
              <div className="mb-8 text-center">
                <p className="text-lg font-bold tracking-tight text-slate-900">Infovision</p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Enterprise sign in
                </p>
              </div>

              <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
              <p className="mt-1 text-[13px] text-slate-500">Use your InfoVision credentials</p>

              {error && (
                <div
                  className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" strokeWidth={2} />
                  <span className="text-[13px] leading-snug text-red-900/90">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.55px] text-slate-600"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-[15px] text-slate-900 outline-none ring-slate-200/50 transition-[box-shadow,border-color] placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-500/15"
                  />
                </div>
                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.55px] text-slate-600"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400"
                      strokeWidth={1.75}
                    />
                    <input
                      id="login-password"
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-11 text-[15px] text-slate-900 outline-none transition-[box-shadow,border-color] placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-500/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      tabIndex={-1}
                      aria-label={showPwd ? 'Hide password' : 'Show password'}
                    >
                      {showPwd ? (
                        <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                      ) : (
                        <Eye className="h-4 w-4" strokeWidth={1.75} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-brand-600/25 transition-[transform,box-shadow,filter] hover:from-brand-700 hover:to-brand-800 hover:shadow-xl active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {authLoading ? (
                    <>
                      <Spinner size="sm" color="white" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                disabled
                title="Not available in this deployment"
                className="w-full cursor-not-allowed rounded-xl border border-dashed border-slate-200 bg-slate-50 py-3.5 text-[14px] font-semibold text-slate-400 opacity-80"
              >
                Continue with Microsoft Entra ID (SSO)
              </button>

              <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500">
                Access issues?{' '}
                <a
                  href="mailto:it@infovision.com"
                  className="font-semibold text-sky-700 underline-offset-2 hover:underline"
                >
                  Contact IT
                </a>
              </p>
            </div>

            <p className="mt-6 text-center text-[12px] text-slate-500">
              Infovision IT Help ·{' '}
              <a href="#" className="text-slate-600 underline-offset-2 hover:text-sky-800 hover:underline">
                Privacy
              </a>{' '}
              ·{' '}
              <a href="#" className="text-slate-600 underline-offset-2 hover:text-sky-800 hover:underline">
                Terms
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
