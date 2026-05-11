import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowUpRight,
  GitPullRequest,
  Layers,
  Award,
  MonitorPlay,
  TrendingUp,
  LayoutGrid,
  BarChart3,
  Activity,
  Inbox,
  ClipboardList,
} from 'lucide-react';
import { useSearch } from '../context/SearchContext';
import { getDashboardStats, getPopularAssets, getDashboardActivity } from '../api/dashboard';
import ErrorState from '../components/ui/ErrorState';
import CountUp from '../components/ui/CountUp';
import { Tooltip } from '../components/Tooltip';
import { FAMILY_TILE_THEME } from '../theme/enterpriseMeta';

const FALLBACK_FAMILY_TILE_THEME = FAMILY_TILE_THEME.nexus;

const KPI = ({ icon: Icon, value, label, hint, countDelay = 0, loading }) => (
  <div className="flex-1 min-w-[140px] flex gap-4 p-4 sm:p-5">
    <span className="icon-wrap !w-11 !h-11 !rounded-xl border-brand-100 bg-brand-50 text-brand-600 shadow-inner">
      <Icon className="w-5 h-5" strokeWidth={1.75} />
    </span>
    <div>
      {loading ? (
        <div className="h-8 w-16 bg-surface-muted border border-border rounded animate-pulse" />
      ) : (
        <div className="text-2xl sm:text-[26px] font-bold text-text-primary tracking-tight tabular-nums leading-none">
          <CountUp end={value} duration={1000} delay={countDelay} />
        </div>
      )}
      <div className="text-[11px] font-medium text-text-muted mt-2 uppercase tracking-wide">{label}</div>
      {hint && !loading ? (
        <div className="text-[11px] text-brand-600/90 mt-1 font-medium">{hint}</div>
      ) : null}
    </div>
  </div>
);

const NoticeRow = ({ children }) => (
  <div className="flex gap-2 rounded-md border border-border bg-surface-muted/40 pl-2 pr-2 py-1.5 border-l-2 border-l-border-strong">
    <p className="text-[11px] text-text-secondary leading-snug flex-1">{children}</p>
  </div>
);

const PlatformFamilyTiles = ({ families = [], onOpen, skeleton }) => {
  const maxDeploysTile = useMemo(
    () => Math.max(...families.map((x) => x.stats?.deploys ?? 0), 1),
    [families],
  );

  if (skeleton) {
    return (
      <div className="grid w-full grid-cols-2 gap-3 px-4 py-4 pb-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4">
        {[1, 2, 3, 4, 5].map((k) => (
          <div
            key={k}
            className="h-[102px] min-h-[102px] min-w-0 w-full animate-pulse rounded-xl bg-surface-muted ring-1 ring-inset ring-border"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-2 gap-3 overflow-x-visible px-4 py-4 pb-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4">
      {families.map((f, i) => {
        const th = FAMILY_TILE_THEME[f.key] || FALLBACK_FAMILY_TILE_THEME;
        const assetCount = f.stats?.assets ?? 0;
        const deploys = f.stats?.deploys ?? 0;
        const subtitle = f.tagline || f.key;
        const deployPct = (deploys / maxDeploysTile) * 100;
        return (
          <button
            key={f.key}
            type="button"
            className={`group relative z-0 flex min-h-[102px] min-w-0 w-full flex-col rounded-xl border border-border bg-surface px-3 py-3 text-left shadow-card transition-[box-shadow,border-color,transform] duration-150 hover:z-[120] hover:-translate-y-px hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/35 focus-visible:ring-offset-2 hover:ring-2 hover:ring-offset-2 hover:ring-offset-white sm:px-4 ${th.hoverRing}`}
            onClick={() => onOpen(f.key)}
          >
            <Tooltip
              title={f.name}
              subtitle={`${assetCount} assets · ${deploys} deploys`}
              className="flex size-full min-w-0 flex-1 flex-col"
            >
              <div className="flex gap-2 sm:gap-3">
                <div className={`min-w-0 flex-1 truncate text-[14px] font-bold leading-snug tracking-tight ${th.title}`}>
                  {f.name}
                </div>
                <span
                  className={`relative z-[122] shrink-0 self-start rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums leading-none shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] sm:px-2.5 sm:text-[12px] ${th.badge}`}
                  aria-label={`${assetCount} assets`}
                >
                  {assetCount}
                </span>
              </div>
              <p className="mt-3 flex-1 text-[11px] leading-snug text-text-secondary line-clamp-2">{subtitle}</p>
              <div className="mt-3 space-y-1.5 border-t border-border pt-2.5">
                <div className="flex items-center justify-between gap-2 text-[10px] font-semibold tabular-nums uppercase tracking-wide text-text-muted">
                  <span className="font-mono lowercase">{f.key}</span>
                  <span className="normal-case tracking-normal">{deploys} deploys</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full border border-border bg-surface-muted shadow-inner">
                  <div
                    className="deploy-bar-fill-x h-full min-w-0 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 motion-reduce:scale-x-100"
                    style={{
                      width: `${deployPct}%`,
                      animationDelay: `${48 + i * 52}ms`,
                    }}
                    aria-hidden
                  />
                </div>
              </div>
            </Tooltip>
          </button>
        );
      })}
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchQuery } = useSearch();
  const [stats, setStats] = useState(null);
  const [popular, setPopular] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, popularRes, activityRes] = await Promise.all([
        getDashboardStats(),
        getPopularAssets(6),
        getDashboardActivity(12),
      ]);
      setStats(statsRes.data.data);
      setPopular(popularRes.data.data);
      setActivity(activityRes.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location.pathname !== '/dashboard') return;
    load();
  }, [location.pathname, location.key, load]);

  useEffect(() => {
    const onRefresh = () => load();
    window.addEventListener('aimplify:dashboard-refresh', onRefresh);
    return () => window.removeEventListener('aimplify:dashboard-refresh', onRefresh);
  }, [load]);

  const chartMax = useMemo(() => {
    const vals = (stats?.families || []).map((f) => f.stats?.deploys ?? 0);
    return Math.max(...vals, 1);
  }, [stats?.families]);

  const familyNameByKey = useMemo(() => {
    const m = {};
    (stats?.families || []).forEach((f) => {
      m[f.key] = f.name || f.key;
    });
    return m;
  }, [stats?.families]);

  const filteredFamilies = useMemo(() => {
    if (!searchQuery.trim()) {
      return stats?.families || [];
    }
    const query = searchQuery.toLowerCase();
    return (stats?.families || []).filter((f) =>
      f.name.toLowerCase().includes(query) || f.key.toLowerCase().includes(query)
    );
  }, [stats?.families, searchQuery]);

  const filteredStats = useMemo(() => {
    if (!searchQuery.trim()) {
      return stats;
    }
    // Calculate aggregated stats for filtered families
    const filtered = filteredFamilies.reduce(
      (acc, f) => {
        acc.totalAssets += f.stats?.assets ?? 0;
        acc.battleTested += f.stats?.battleTested ?? 0;
        acc.demoReady += f.stats?.demoReady ?? 0;
        acc.totalDeploys += f.stats?.deploys ?? 0;
        return acc;
      },
      {
        totalAssets: 0,
        battleTested: 0,
        demoReady: 0,
        totalDeploys: 0,
      }
    );
    return { ...stats, ...filtered };
  }, [stats, filteredFamilies, searchQuery]);

  const filteredPopularAssets = useMemo(() => {
    if (!searchQuery.trim()) {
      return popular;
    }
    const filteredFamilyKeys = new Set(filteredFamilies.map((f) => f.key));
    return popular.filter((a) => filteredFamilyKeys.has(a.family));
  }, [popular, filteredFamilies, searchQuery]);

  const familyHint =
    stats?.familyCountDistinct != null
      ? `Across ${stats.familyCountDistinct} famil${stats.familyCountDistinct !== 1 ? 'ies' : 'y'}`
      : null;

  const deployHint =
    stats?.deployMomPercent != null ? `+${stats.deployMomPercent}% vs last month` : null;

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="page-wrap max-w-none">
      <div className="card divide-y md:divide-y-0 md:divide-x divide-border flex flex-col md:flex-row card-hover">
        <KPI
          icon={Layers}
          value={filteredStats?.totalAssets ?? 0}
          label="Total assets"
          hint={familyHint}
          countDelay={0}
          loading={loading}
        />
        <KPI
          icon={Award}
          value={filteredStats?.battleTested ?? 0}
          label="Battle-tested"
          countDelay={70}
          loading={loading}
        />
        <KPI
          icon={MonitorPlay}
          value={filteredStats?.demoReady ?? 0}
          label="Demo-ready"
          countDelay={140}
          loading={loading}
        />
        <KPI
          icon={TrendingUp}
          value={filteredStats?.totalDeploys ?? 0}
          label="Total deploys"
          hint={deployHint}
          countDelay={210}
          loading={loading}
        />
      </div>

      <div className="card card-hover w-full !overflow-visible">
        <div className="card-header justify-between gap-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-brand-600" strokeWidth={1.75} />
            <span className="card-header-title !normal-case tracking-normal text-[13px] font-semibold text-text-primary">
              Platform families
            </span>
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-0.5"
            onClick={() => navigate('/catalog')}
          >
            Catalog <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {loading ? (
          <PlatformFamilyTiles skeleton />
        ) : filteredFamilies?.length > 0 ? (
          <PlatformFamilyTiles families={filteredFamilies} onOpen={(key) => navigate(`/family/${key}`)} />
        ) : stats?.families?.length > 0 && searchQuery.trim() ? (
          <div className="px-4 py-6 text-[11px] text-text-muted">No families match "{searchQuery}"</div>
        ) : (
          <div className="px-4 py-6 text-[11px] text-text-muted">No platform family telemetry yet.</div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        <div className="flex flex-col gap-5 min-w-0">
          {!loading && filteredFamilies?.length > 0 && (
            <div className="card card-hover min-w-0">
              <div className="card-header justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand-600" strokeWidth={1.75} />
                  <span className="card-header-title !normal-case tracking-normal text-[13px] font-semibold text-text-primary">
                    Deployments by platform family
                  </span>
                </div>
                <button
                  type="button"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                  onClick={() => navigate('/analytics')}
                >
                  Analytics →
                </button>
              </div>
              <div className="p-5">
                <div className="text-[10px] text-text-muted border-b border-dashed border-border pb-2 mb-3 uppercase tracking-wide font-semibold">
                  Relative deploy volume (telemetry)
                </div>
                <div className="space-y-2.5">
                  {filteredFamilies.map((f, i) => {
                    const v = f.stats?.deploys ?? 0;
                    const pct = (v / chartMax) * 100;
                    return (
                      <div key={f.key} className="flex items-center gap-3">
                        <span className="w-[100px] shrink-0 truncate text-[12px] text-text-secondary" title={f.name}>
                          {f.name}
                        </span>
                        <div className="flex-1 min-w-0 h-2.5 bg-surface-muted border border-border overflow-hidden rounded-full">
                          <div
                            className="deploy-bar-fill-x h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 motion-reduce:scale-x-100 min-w-0"
                            style={{ width: `${pct}%`, animationDelay: `${40 + i * 50}ms` }}
                          />
                        </div>
                        <span className="w-8 shrink-0 text-right tabular-nums text-[11px] text-text-muted">{v}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="card card-hover w-full">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-600" strokeWidth={1.75} />
                <span className="card-header-title !normal-case tracking-normal text-[13px] font-semibold text-text-primary">
                  Popular assets
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/catalog')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-0.5"
              >
                Catalog <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-surface-muted border border-border rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredPopularAssets.length === 0 ? (
              <div className="px-4 py-6 text-[11px] text-text-muted">
                {searchQuery.trim() ? 'No assets in matching families.' : 'No assets indexed.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-surface-muted/60 border-b border-border text-[11px] uppercase tracking-wide text-text-muted font-semibold">
                      <th className="text-left px-4 py-3 font-semibold">ID</th>
                      <th className="text-left px-4 py-3 font-semibold">Asset</th>
                      <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Family</th>
                      <th className="text-right px-4 py-3 font-semibold w-[100px] tabular-nums">Deploys</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPopularAssets.map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-surface-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/detail/${a.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') navigate(`/detail/${a.id}`);
                        }}
                        tabIndex={0}
                        role="button"
                      >
                        <td className="px-4 py-3.5 font-mono text-[11px] text-text-secondary whitespace-nowrap">{a.id}</td>
                        <td className="px-4 py-3.5 font-semibold text-text-primary max-w-[220px]">
                          <span className="line-clamp-2">{a.name}</span>
                        </td>
                        <td className="px-4 py-3.5 text-text-secondary hidden sm:table-cell">
                          {familyNameByKey[a.family] || a.family}
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-text-secondary">{a.stats?.deploys ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-5 min-w-0">
          <div className="card card-hover flex flex-col">
            <div className="card-header !py-2 !min-h-0">
              <Inbox className="w-3.5 h-3.5 text-brand-600" strokeWidth={1.75} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Operational notices</span>
            </div>
            <div className="px-3 py-3 flex flex-col gap-2">
              {loading ? (
                <div className="h-12 bg-surface-muted border border-border rounded-lg animate-pulse" />
              ) : (
                <>
                  {(stats?.notices || []).map((n) => (
                    <NoticeRow key={n.headline}>
                      <span className="font-semibold text-text-primary">{n.headline}:</span> {n.detail}
                    </NoticeRow>
                  ))}
                  {stats?.pendingSubmissions > 0 ? (
                    <NoticeRow>
                      <span className="font-semibold text-text-primary">{stats.pendingSubmissions}</span> submission
                      {stats.pendingSubmissions !== 1 ? 's' : ''} awaiting governance or remediation in the pipeline.
                    </NoticeRow>
                  ) : (
                    <NoticeRow>No submissions are blocked in the approval pipeline.</NoticeRow>
                  )}
                  <NoticeRow>
                    {filteredPopularAssets[0] ? (
                      <>
                        Highest recorded deploy volume:{' '}
                        <span className="font-semibold text-text-primary">{filteredPopularAssets[0].name}</span>{' '}
                        <span className="tabular-nums text-text-muted">({filteredPopularAssets[0].stats?.deploys ?? 0})</span>.
                      </>
                    ) : (
                      <>Deploy telemetry will appear here once assets record usage.</>
                    )}
                  </NoticeRow>
                  {stats && (
                    <NoticeRow>
                      <span className="tabular-nums font-semibold text-text-primary">
                        {Math.max(0, (filteredStats.totalAssets ?? 0) - (filteredStats.battleTested ?? 0))}
                      </span>{' '}
                      registered assets are not marked battle-tested — confirm maturity before production reliance.
                    </NoticeRow>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="card card-hover w-full flex flex-col">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-brand-600" strokeWidth={1.75} />
                <span className="card-header-title !normal-case tracking-normal text-[13px] font-semibold text-text-primary">
                  Recent activity
                </span>
              </div>
            </div>
            {loading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-surface-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <div className="px-4 py-5 text-[11px] text-text-muted">No audit events in window.</div>
            ) : (
              <ul className="divide-y divide-border max-h-[300px] overflow-y-auto">
                {activity.map((a, i) => (
                  <li key={i} className="px-4 py-3 hover:bg-surface-muted/40 transition-colors">
                    <div className="text-[13px] font-semibold text-text-primary leading-snug">
                      <span>{a.name}</span> <span className="text-text-muted font-normal">{a.action}</span>
                    </div>
                    {a.description && (
                      <div className="text-[12px] text-text-muted truncate mt-0.5">{a.description}</div>
                    )}
                    <div className="text-[11px] text-text-muted mt-1 tabular-nums">
                      {a.createdAt
                        ? new Date(a.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!loading && stats?.pendingSubmissions > 0 && (
            <button
              type="button"
              onClick={() => navigate('/pipeline')}
              className="flex items-center justify-between w-full text-left rounded-xl border border-border bg-surface px-4 py-3 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-center gap-3 min-w-0">
                <GitPullRequest className="w-4 h-4 text-brand-600 flex-shrink-0" strokeWidth={1.75} />
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-text-primary">Pipeline</div>
                  <div className="text-[11px] text-text-muted">Open approval queue</div>
                </div>
              </div>
              <span className="text-[11px] font-bold tabular-nums text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full shrink-0">
                {stats.pendingSubmissions}
              </span>
            </button>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
