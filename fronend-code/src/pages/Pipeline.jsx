import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, GitPullRequest } from 'lucide-react';
import { getSubmissions } from '../api/submissions';
import { SkeletonRow } from '../components/ui/SkeletonCard';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { PIPELINE_STATUS_META } from '../theme/enterpriseMeta';
import { PipelineProgress } from '../components/PipelineProgress';

const STATUS_PILL = {
  'ai-review': 'border-sky-200 bg-sky-50 text-sky-900',
  governance: 'border-violet-200 bg-violet-50 text-violet-900',
  remediation: 'border-amber-200 bg-amber-50 text-amber-950',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  pending: 'border-slate-200 bg-slate-100 text-slate-800',
  rejected: 'border-red-200 bg-red-50 text-red-900',
};

const StatusBadge = ({ status }) => {
  const cfg = PIPELINE_STATUS_META[status] || { label: status };
  const pill = STATUS_PILL[status] || 'border-border bg-surface-muted text-text-secondary';
  return (
    <span
      className={`inline-flex items-center rounded-lg text-[10px] font-semibold px-2 py-0.5 border capitalize ${pill}`}
    >
      {cfg.label}
    </span>
  );
};

const ScoreCell = ({ score }) => {
  if (score == null) return <span className="text-[11px] text-text-muted">—</span>;
  const tone =
    score >= 85 ? 'text-text-primary' : score >= 70 ? 'text-text-secondary' : 'text-text-muted';
  return (
    <span className={`text-[12px] font-semibold tabular-nums ${tone}`}>
      {score}
      <span className="text-[10px] text-text-muted font-normal">/100</span>
    </span>
  );
};

/** Grid: last columns give Progress rail room; min-width for horizontal scroll */
const COLS =
  'grid grid-cols-[minmax(140px,2fr)_minmax(96px,1.1fr)_minmax(72px,0.75fr)_minmax(64px,0.72fr)_minmax(220px,1.65fr)_minmax(100px,1fr)]';

const Pipeline = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await getSubmissions(params);
      setSubmissions(res.data.data || []);
      const fromApi = res.data.meta?.statuses;
      if (Array.isArray(fromApi) && fromApi.length > 0) setStatusOptions(fromApi);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load pipeline.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const pending = submissions.filter((s) =>
    ['ai-review', 'governance', 'remediation'].includes(s.status),
  ).length;

  const filterTabs = [
    { val: '', label: 'All' },
    ...statusOptions.map((st) => ({
      val: st,
      label: PIPELINE_STATUS_META[st]?.label || st.replace(/-/g, ' '),
    })),
  ];

  return (
    <div className="page-wrap">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary tracking-tight inline-flex items-center gap-2">
            <span className="icon-wrap !w-9 !h-9 !rounded-xl border-brand-100 bg-brand-50 text-brand-600">
              <GitPullRequest className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </span>
            Approval pipeline
          </h2>
          <p className="text-[13px] text-text-muted mt-1 ml-11 tabular-nums">
            {loading
              ? 'Loading…'
              : `${submissions.length} submission${submissions.length !== 1 ? 's' : ''} · ${pending} open`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={load}
            className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-border bg-surface text-text-muted hover:bg-surface-muted shadow-sm focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/submit')}
            className="btn-primary shadow-md h-9 px-4 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            New submission
          </button>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-surface-muted border border-border shadow-inner w-fit max-w-full"
        role="tablist"
        aria-label="Filter by status"
      >
        {filterTabs.map(({ val, label }) => (
          <button
            key={val || 'all'}
            type="button"
            role="tab"
            aria-selected={statusFilter === val}
            onClick={() => setStatusFilter(val)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 whitespace-nowrap ${
              statusFilter === val
                ? 'bg-surface text-brand-800 border border-brand-200 shadow-sm'
                : 'text-text-secondary border border-transparent hover:bg-surface/80 hover:text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <div className="card card-hover overflow-hidden shadow-card">
          <div className="min-w-[860px] overflow-x-auto overflow-y-visible">
            <div
              className={`${COLS} px-4 py-3 bg-surface-muted/90 border-b border-border text-[10px] font-bold text-text-muted uppercase tracking-wider items-center gap-2`}
            >
              <div>Accelerator</div>
              <div>Submitted by</div>
              <div>Family</div>
              <div>AI score</div>
              <div className="text-center">
                Progress
                <span className="sr-only">
                  . Three steps — submit, review, outcome. Hover each step for detail.
                </span>
              </div>
              <div className="text-center">Status</div>
            </div>

            {loading ? (
              <div className="divide-y divide-border bg-surface">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No submissions"
                  description="No records match the current filter."
                />
              </div>
            ) : (
              <div className="divide-y divide-border bg-surface">
                {submissions.map((s) => (
                  <div
                    key={s.registrationId}
                    className={`relative z-0 hover:z-[55] ${COLS} px-4 py-3 items-center min-w-[860px] gap-2 transition-colors hover:bg-surface-muted/50`}
                  >
                    <div className="min-w-0 pr-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/pipeline/${s.registrationId}`)}
                        className="text-left w-full rounded-lg -m-1 p-1 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                      >
                        <div className="text-[13px] font-semibold text-text-primary truncate hover:underline">
                          {s.name}
                        </div>
                        <div className="text-[10px] text-text-muted font-mono mt-0.5">
                          {s.registrationId} ·{' '}
                          {new Date(s.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </button>
                    </div>
                    <div className="text-[12px] text-text-secondary truncate pr-2">
                      {s.submitedBy || '—'}
                    </div>
                    <div>
                      <span className="pill text-[10px] font-semibold capitalize">{s.family}</span>
                    </div>
                    <div>
                      <ScoreCell score={s.aiScore} />
                    </div>
                    <div className="flex justify-center py-1 overflow-visible">
                      <PipelineProgress status={s.status} />
                    </div>
                    <div className="flex justify-center">
                      <StatusBadge status={s.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;
