import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Zap,
  Shield,
  GitBranch,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import { getPlatformCounts } from '../api/platform';
import infovisionLogo from '../assets/Infovision_Logo.png';

/* ─── session cache ───────────────────────────────────────── */
const COUNTS_CACHE_KEY = 'aimplify_login_platform_counts_v1';

function readPlatformCountsCache() {
  try {
    const raw = sessionStorage.getItem(COUNTS_CACHE_KEY);
    if (!raw) return null;
    const { rows, v } = JSON.parse(raw);
    if (v !== 2 || !Array.isArray(rows)) return null;
    return rows;
  } catch { return null; }
}

function writePlatformCountsCache(rows) {
  try {
    sessionStorage.setItem(COUNTS_CACHE_KEY, JSON.stringify({ v: 2, rows }));
  } catch { /* ignore */ }
}

/* ─── family accent colours ──────────────────────────────── */
const FAMILY_STYLE = {
  family_atlas:    { num: 'text-teal-400'   },
  family_forge:    { num: 'text-amber-400'  },
  family_nexus:    { num: 'text-slate-400'  },
  family_relay:    { num: 'text-violet-400' },
  family_sentinel: { num: 'text-pink-400'   },
};

/* ─── helpers ────────────────────────────────────────────── */
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

function unwrapCountsResponse(res) {
  const body = res?.data;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  if (body.data != null && typeof body.data === 'object' && !Array.isArray(body.data)) return body.data;
  return body;
}

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
      const label = typeof item.name === 'string' && item.name.trim() ? item.name.trim() : humanizeLabel(key || id);
      const tagline = typeof item.tagline === 'string' && item.tagline.trim() ? item.tagline.trim() : '';
      push(id, label, item.assetCount, tagline);
    }
  }
  const extra = flattenCountsPayload(rest);
  for (const r of extra) { if (!seen.has(r.id)) { rows.push(r); seen.add(r.id); } }
  return rows;
}

/* ─── sub-components ─────────────────────────────────────── */
function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-white/[0.08] px-2 py-3 flex flex-col items-center gap-2" aria-hidden>
      <div className="h-6 w-8 rounded bg-white/10" />
      <div className="h-2 w-10 rounded bg-white/10" />
    </div>
  );
}

function StatCard({ row }) {
  const style = FAMILY_STYLE[row.id] ?? { num: 'text-blue-300' };
  const formatted =
    row.value >= 1_000_000 ? `${(row.value / 1_000_000).toFixed(1)}M`
    : row.value >= 10_000  ? `${(row.value / 1_000).toFixed(1)}K`
    : String(row.value);

  return (
    <article
      className="flex flex-col items-center justify-center rounded-xl bg-white/[0.08] px-2 py-3 hover:bg-white/[0.13] transition-all duration-200 cursor-default"
      aria-label={`${row.label}: ${formatted}`}
    >
      <p className={`text-2xl lg:text-3xl font-bold tabular-nums ${style.num} leading-none`}>{formatted}</p>
      <p className="mt-1.5 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-white/50 text-center">
        {row.label.replace(/^Family\s+/i, '')}
      </p>
    </article>
  );
}

/* ─── feature pills (unused but kept) ─────────────────────── */
const FEATURES = [
  { icon: Zap,       label: 'Prompt Libraries'       },
  { icon: GitBranch, label: 'Agent Patterns'          },
  { icon: Shield,    label: 'Production Accelerators' },
];

/* ─── main component ─────────────────────────────────────── */
const Login = () => {
  const navigate = useNavigate();
  const { login, loading: authLoading } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [mounted, setMounted]   = useState(false);

  const cachedRows = readPlatformCountsCache();
  const [countsLoading, setCountsLoading] = useState(cachedRows === null);
  const [countsError, setCountsError]     = useState(null);
  const [countsRows, setCountsRows]       = useState(cachedRows ?? []);
  const fetchSeq = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  const fetchCounts = useCallback(async (signal, opts = {}) => {
    const { silent = false } = opts;
    const seq = ++fetchSeq.current;
    let aborted = false;
    if (!silent) setCountsLoading(true);
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
      if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError') { aborted = true; return; }
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
    void fetchCounts(ac.signal, { silent: readPlatformCountsCache() !== null });
    return () => ac.abort();
  }, [fetchCounts]);

  const displayRows = useMemo(() => countsRows.filter((r) => r.id.startsWith('family_')), [countsRows]);
  const showSkeletonGrid = countsLoading && countsRows.length === 0;
  const showEmptyCounts  = !countsLoading && !countsError && displayRows.length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Email and password are required.'); return; }
    const result = await login(email, password);
    if (result.success) navigate('/dashboard', { replace: true });
    else setError(result.message);
  };

  return (
    /*
     * Mobile/tablet (< lg):  flex-col, scroll allowed, compact blue header + login card
     * Desktop (lg+):         flex-row, h-screen, overflow-hidden, full split layout
     */
    <div className="min-h-screen flex flex-col lg:h-screen lg:flex-row lg:overflow-hidden antialiased">

      {/* ══ LEFT — hero panel ════════════════════════════════ */}
      <div className="relative flex flex-col bg-brand-700 px-6 py-5 sm:px-8 sm:py-6 lg:w-[50%] lg:justify-between lg:px-10 lg:py-8 lg:overflow-hidden">

        <div>
          {/* Brand mark — always visible */}
          <div className="flex items-center gap-3 mb-5 lg:mb-7">
            <div className="flex h-10 w-10 lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-xl lg:rounded-2xl bg-white/20">
              <Layers className="h-5 w-5 lg:h-6 lg:w-6 text-white" strokeWidth={1.6} />
            </div>
            <div>
              <p className="text-[18px] lg:text-[22px] font-extrabold tracking-tight text-white leading-none">AIMPLIFY</p>
              <p className="text-[10px] lg:text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 mt-0.5">by InfoVision</p>
            </div>
          </div>

          {/* Headline — visible on all sizes, scales up */}
          <h1 className="text-[1.9rem] sm:text-[2.4rem] md:text-[2.6rem] lg:text-[2.8rem] xl:text-[3.2rem] font-extrabold leading-[1.1] tracking-tight text-white">
            AI Capabilities &amp;<br />Accelerator Platform
          </h1>

          {/* Description — visible on sm+ */}
          <p className="hidden sm:block mt-3 lg:mt-4 max-w-md text-[13px] md:text-[14px] lg:text-[15px] leading-relaxed text-white/80">
            Discover, deploy, and demonstrate InfoVision&apos;s AI assets — from prompt
            libraries and agent patterns to production-ready accelerators.
          </p>

          {/* Platform families — visible on md+ */}
          <section className="hidden md:block mt-6 lg:mt-8" aria-labelledby="snapshot-heading">
            <div className="flex items-center justify-between mb-3">
              <h2 id="snapshot-heading" className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
                Platform Families
              </h2>
              <button
                type="button"
                onClick={() => void fetchCounts(undefined, { silent: false })}
                disabled={countsLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/60 hover:bg-white/20 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <RefreshCw className={`h-3 w-3 ${countsLoading ? 'animate-spin' : ''}`} strokeWidth={2.5} aria-hidden />
                Refresh
              </button>
            </div>

            {countsError && (
              <div role="alert" className="mb-3 flex gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-white/90">
                <AlertCircle className="h-4 w-4 shrink-0 text-white mt-0.5" strokeWidth={2} />
                <span>{countsError}</span>
              </div>
            )}

            <div className="grid grid-cols-5 gap-2 xl:gap-3" aria-busy={showSkeletonGrid} aria-live="polite">
              {showSkeletonGrid
                ? Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
                : showEmptyCounts
                  ? <div className="col-span-5 py-4 text-center text-sm text-white/40">No platform data</div>
                  : displayRows.map((row) => <StatCard key={row.id} row={row} />)
              }
            </div>
          </section>
        </div>

        {/* Copyright — lg+ only */}
        <p className="hidden lg:block mt-6 text-[11px] text-white/40 font-medium">
          © 2026 InfoVision, Inc. All rights reserved.
        </p>
      </div>

      {/* ══ RIGHT — login panel ══════════════════════════════ */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f0f4f8] px-4 py-8 sm:px-6 sm:py-10 lg:flex-none lg:w-[50%] lg:px-12 lg:py-6">

        <div
          className={`w-full max-w-[420px] sm:max-w-[480px] transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {/* Card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12)] overflow-hidden">

            {/* Card header */}
            <div className="bg-white px-6 pt-6 pb-4 sm:px-8 sm:pt-7 sm:pb-5 text-center">
              <img
                src={infovisionLogo}
                alt="InfoVision"
                className="mx-auto h-9 sm:h-11 w-auto max-w-[160px] sm:max-w-[200px] object-contain"
                draggable={false}
              />
              <p className="mt-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                Enterprise Sign In
              </p>
              <div className="mt-3 sm:mt-4 border-t border-slate-100" />
            </div>

            {/* Form body */}
            <div className="px-6 pt-4 pb-6 sm:px-8 sm:pt-5 sm:pb-7">
              <h2 className="text-[20px] sm:text-[22px] font-bold text-slate-900 leading-none">Sign in</h2>
              <p className="mt-1 text-[12px] sm:text-[13px] text-slate-500">Use your InfoVision credentials</p>

              {error && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" strokeWidth={2} />
                  <span className="text-[12px] sm:text-[13px] text-red-800 leading-snug">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="mt-4 sm:mt-5 space-y-3 sm:space-y-3.5">
                {/* Email */}
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-[11px] sm:text-[12px] font-semibold text-slate-600">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@infovision.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-[13px] sm:text-[14px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all duration-150"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="login-password" className="mb-1.5 block text-[11px] sm:text-[12px] font-semibold text-slate-600">
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 pr-10 text-[13px] sm:text-[14px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all duration-150"
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

                {/* Submit */}
                <button
                  type="submit"
                  disabled={authLoading}
                  className="group w-full rounded-xl bg-brand-600 py-2.5 sm:py-3 text-[14px] sm:text-[15px] font-semibold text-white shadow-sm hover:bg-brand-700 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <>
                      <Spinner size="sm" color="white" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 transition-transform duration-150" strokeWidth={2} />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-4 text-center text-[12px] sm:text-[13px] text-slate-400">
                Access issues?{' '}
                <a href="mailto:it@infovision.com" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline underline-offset-2 transition-colors">
                  Contact IT
                </a>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
