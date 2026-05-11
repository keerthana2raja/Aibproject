import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, PieChart, Users, TrendingUp } from 'lucide-react';
import { getAnalyticsSummary } from '../api/analytics';
import { getFamilies } from '../api/families';
import ErrorState from '../components/ui/ErrorState';

const BAR = 'bg-brand/70';

function contributorInitials(name) {
  if (!name || typeof name !== 'string') return '—';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const Analytics = () => {
  const [data, setData] = useState(null);
  const [familiesRows, setFamiliesRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, famRes] = await Promise.all([
        getAnalyticsSummary(),
        getFamilies().catch(() => ({ data: { data: [] } })),
      ]);
      setData(summaryRes.data.data);
      setFamiliesRows(famRes.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const familyNameByKey = useMemo(() => {
    const m = {};
    familiesRows.forEach((f) => {
      if (f.key) m[f.key] = f.name || f.key;
    });
    return m;
  }, [familiesRows]);

  const familyPie = useMemo(() => {
    const rows = data?.familyBreakdown || [];
    const total = rows.reduce((s, r) => s + (Number(r.deploys) || Number(r.count) || 0), 0) || 1;
    return rows.map((r) => {
      const key = r._id || r.family || '';
      const label = familyNameByKey[key] || key || 'Other';
      const v = Number(r.deploys) || Number(r.count) || 0;
      return { label, pct: Math.round((v / total) * 100), raw: v };
    });
  }, [data?.familyBreakdown, familyNameByKey]);

  const trendMax = useMemo(() => {
    const t = data?.monthlyTrend || [];
    return Math.max(...t.map((x) => x.count || 0), 1);
  }, [data?.monthlyTrend]);

  if (error) {
    return (
      <div className="p-3 lg:p-4 flex-1 flex items-center justify-center max-w-[1600px] w-full mx-auto">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  const td = data || {};
  const battleRatio =
    td.totalAssets > 0 ? Math.round((100 * (td.battleTested || 0)) / td.totalAssets) : 0;

  return (
    <div className="p-3 lg:p-4 flex flex-col gap-3 flex-1 max-w-[1600px] w-full mx-auto">
      <p className="text-[11px] text-text-muted">
        Live metrics from the registry API (deployments, assets, submissions).
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border px-3 py-2.5 animate-pulse">
              <div className="h-3 w-16 bg-surface-3 border border-border mb-2" />
              <div className="h-6 w-12 bg-surface-3 border border-border" />
            </div>
          ))
        ) : (
          [
            { k: 'Total deploys', v: String(td.totalDeploys ?? 0), d: 'Recorded across catalog assets' },
            { k: 'Catalog assets', v: String(td.totalAssets ?? 0), d: 'Registered accelerators' },
            { k: 'Submissions', v: String(td.registeredCount ?? 0), d: 'All-time pipeline records' },
            {
              k: 'Battle-tested share',
              v: `${battleRatio}%`,
              d: `${td.battleTested ?? 0} of ${td.totalAssets ?? 0} assets`,
            },
          ].map((row) => (
            <div key={row.k} className="bg-surface border border-border px-3 py-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                {row.k}
              </div>
              <div className="text-[20px] font-semibold text-text-primary tabular-nums leading-none mt-1">
                {row.v}
              </div>
              <div className="text-[10px] text-text-muted mt-1.5">{row.d}</div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3">
        <div className="bg-surface border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[12px] font-semibold text-text-primary flex items-center gap-1.5">
              <LineChart className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
              Submissions by month
            </div>
          </div>
          {loading ? (
            <div className="h-24 bg-surface-3 border border-border animate-pulse mt-4" />
          ) : (
            <div className="flex items-end gap-1.5 mt-4 pt-1 border-t border-border">
              {(td.monthlyTrend || []).map((x) => {
                const h = Math.max(8, Math.round(((x.count || 0) / trendMax) * 64));
                return (
                  <div key={x.month} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-[10px] font-medium text-text-secondary tabular-nums">
                      {x.count ?? 0}
                    </span>
                    <div
                      className={`w-full ${BAR} opacity-90`}
                      style={{ height: `${h}px` }}
                      title={`${x.month}: ${x.count ?? 0}`}
                    />
                    <span className="text-[10px] text-text-muted font-medium">{x.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-surface border border-border p-4">
          <div className="text-[12px] font-semibold text-text-primary flex items-center gap-1.5 mb-3">
            <PieChart className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
            Assets by family
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 bg-surface-3 border border-border animate-pulse" />
              ))}
            </div>
          ) : familyPie.length === 0 ? (
            <p className="text-[11px] text-text-muted">No family breakdown yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {familyPie.map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-medium text-text-primary">{row.label}</span>
                    <span className="text-text-muted tabular-nums">{row.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-3 border border-border overflow-hidden">
                    <div
                      className={`h-full ${BAR} opacity-85`}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-surface border border-border p-4">
          <div className="text-[12px] font-semibold text-text-primary flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
            Top accelerators (by deploys)
          </div>
          <div className="border border-border overflow-hidden text-[11px]">
            <div className="grid grid-cols-[28px_1fr_56px] gap-2 px-2 py-1.5 bg-surface-3 border-b border-border font-semibold text-text-muted uppercase tracking-wide">
              <span>#</span>
              <span>Name</span>
              <span className="text-right">Deploys</span>
            </div>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 border-b border-border animate-pulse bg-surface-3/50" />
              ))
            ) : (td.topAssets || []).length === 0 ? (
              <div className="px-2 py-3 text-[11px] text-text-muted">No assets.</div>
            ) : (
              (td.topAssets || []).map((a, i) => (
                <div
                  key={a.id || i}
                  className="grid grid-cols-[28px_1fr_56px] gap-2 px-2 py-2 border-b border-border last:border-b-0 items-center"
                >
                  <span className="text-text-muted tabular-nums">{i + 1}</span>
                  <span className="font-medium text-text-primary truncate">{a.name}</span>
                  <span className="text-right tabular-nums text-text-secondary">
                    {a.stats?.deploys ?? a.stats_deploys ?? 0}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-surface border border-border p-4">
          <div className="text-[12px] font-semibold text-text-primary flex items-center gap-1.5 mb-3">
            <Users className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
            Top contributors (submissions)
          </div>
          <ul className="divide-y divide-border border border-border overflow-hidden">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="h-14 bg-surface-3/50 animate-pulse" />
              ))
            ) : (td.topContributors || []).length === 0 ? (
              <li className="px-3 py-3 text-[11px] text-text-muted">No submission authors yet.</li>
            ) : (
              (td.topContributors || []).map((c) => {
                const name = c._id || c.name || 'Unknown';
                return (
                  <li key={name} className="flex items-center gap-3 px-3 py-2">
                    <div className="w-7 h-7 border border-border bg-surface-3 flex items-center justify-center text-[10px] font-semibold text-text-secondary flex-shrink-0">
                      {contributorInitials(name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-semibold text-text-primary truncate">
                        {name}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {c.count} submission{c.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
