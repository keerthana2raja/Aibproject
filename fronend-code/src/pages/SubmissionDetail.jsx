import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Activity,
  User,
  Calendar,
  Tag,
  FileText,
  PlayCircle,
  ExternalLink,
} from 'lucide-react';
import { getSubmissionById, updateSubmissionStatus } from '../api/submissions';
import PageLoader from '../components/ui/PageLoader';
import ErrorState from '../components/ui/ErrorState';
import Spinner from '../components/ui/Spinner';
import DemoVideoModal from '../components/DemoVideoModal';
import QuickStartPanel from '../components/QuickStartPanel';
import AttachedDocumentsPanel from '../components/AttachedDocumentsPanel';
import { useToast } from '../context/ToastContext';
import { PIPELINE_STATUS_META } from '../theme/enterpriseMeta';
import { resolveMediaSrc } from '../utils/mediaSrc';
import { pickDemoVideoRelPathOrTestFallback } from '../utils/demoVideoUrl';
import { normalizeSubmissionDetail } from '../utils/submissionApiNormalize';

const StatusBadge = ({ status }) => {
  const cfg = PIPELINE_STATUS_META[status] || { label: status };
  return (
    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 border border-border bg-surface-3 text-text-secondary">
      {cfg.label}
    </span>
  );
};

const MetaItem = ({ icon: Icon, label, value }) => (
  <div className="flex flex-col gap-0.5">
    <div className="flex items-center gap-1 text-[10px] font-semibold text-text-muted uppercase tracking-wide">
      <Icon className="w-3 h-3" strokeWidth={1.5} />
      {label}
    </div>
    <div className="text-[12px] font-semibold text-text-primary">{value || '—'}</div>
  </div>
);

const SubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [govNote, setGovNote] = useState('');
  const [demoOpen, setDemoOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSubmissionById(id);
      setSubmission(normalizeSubmissionDetail(res.data.data));
    } catch (e) {
      setError(e.response?.data?.message || 'Submission not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleAction = async (status) => {
    setActionLoading(status);
    try {
      await updateSubmissionStatus(id, { status, govNotes: govNote });
      toast.success(
        status === 'approved' ? 'Submission approved.' : 'Sent for remediation.',
      );
      load();
      setGovNote('');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <PageLoader message="Loading submission…" />;
  if (error || !submission)
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <ErrorState message={error} onRetry={load} />
      </div>
    );

  const canAct = submission.status === 'governance';
  const demoSrc = (() => {
    const raw = pickDemoVideoRelPathOrTestFallback(submission);
    return raw ? resolveMediaSrc(raw) : '';
  })();
  const attachments = submission.submissionAttachments || [];
  const quickStartText = String(submission.quickStart || '').trim();

  return (
    <div className="p-3 lg:p-4 flex flex-col gap-3 flex-1 max-w-[900px] w-full mx-auto">
      <div className="flex items-center gap-2 text-[11px]">
        <button
          type="button"
          onClick={() => navigate('/pipeline')}
          className="text-text-secondary font-medium hover:underline inline-flex items-center gap-1 focus-ring"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          Pipeline
        </button>
        <span className="text-border">/</span>
        <span className="font-mono font-medium text-text-secondary">
          {submission.registrationId}
        </span>
      </div>

      <div className="bg-surface border border-border overflow-hidden">
        <div className="p-4">
          <h1 className="text-[15px] font-semibold text-text-primary leading-snug">{submission.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={submission.status} />
            <span className="text-[10px] font-semibold px-1.5 py-px border border-border bg-surface-3 text-text-secondary capitalize">
              {submission.family}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
            <MetaItem icon={Tag} label="ID" value={submission.registrationId} />
            <MetaItem icon={User} label="Submitted by" value={submission.submitedBy} />
            <MetaItem
              icon={Calendar}
              label="Date"
              value={
                submission.date
                  ? new Date(submission.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—'
              }
            />
            <MetaItem icon={FileText} label="Family" value={submission.family} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
        <div className="flex flex-col gap-3">
          {submission.description && (
            <section className="bg-surface border border-border p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-2">
                Description
              </h2>
              <p className="text-[12px] text-text-secondary leading-relaxed">{submission.description}</p>
            </section>
          )}

          {submission.promotedAssetId ? (
            <section className="rounded-xl border border-border bg-brand-50/50 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-brand-900">Listed in catalog</span>
              <button
                type="button"
                onClick={() => navigate(`/detail/${submission.promotedAssetId}`)}
                className="text-[12px] font-semibold text-brand hover:underline inline-flex items-center gap-1 focus-ring"
              >
                Open accelerator
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </section>
          ) : null}

          <QuickStartPanel text={quickStartText} />

          {demoSrc ? (
            <section className="bg-surface border border-border p-4 rounded-xl shadow-card">
              <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wide mb-2">Demo video</div>
              <button
                type="button"
                onClick={() => setDemoOpen(true)}
                className="py-2 px-3 border border-brand bg-brand/10 text-brand text-[12px] font-semibold hover:bg-brand/15 rounded-lg inline-flex items-center gap-2 transition-colors duration-180 focus-ring"
              >
                <PlayCircle className="w-4 h-4 text-brand shrink-0" strokeWidth={1.75} />
                Launch demo
              </button>
            </section>
          ) : null}

          <AttachedDocumentsPanel
            attachments={attachments}
            resolveHref={(relpath) =>
              resolveMediaSrc(`/v1/uploads/${String(relpath || '').replace(/^\/+/, '')}`)
            }
          />

          {(submission.cloud || submission.maturity || submission.version || submission.gitUrl || submission.owner || submission.team) && (
            <section className="bg-surface border border-border p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-3">
                Technical details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                {submission.owner && (
                  <div>
                    <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wide mb-0.5">Owner</div>
                    <div className="text-[12px] text-text-primary font-medium">{submission.owner}</div>
                  </div>
                )}
                {submission.team && (
                  <div>
                    <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wide mb-0.5">Team</div>
                    <div className="text-[12px] text-text-primary font-medium">{submission.team}</div>
                  </div>
                )}
                {submission.version && (
                  <div>
                    <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wide mb-0.5">Version</div>
                    <div className="text-[12px] text-text-primary font-mono">{submission.version}</div>
                  </div>
                )}
                {submission.cloud && (
                  <div>
                    <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wide mb-0.5">Cloud</div>
                    <div className="text-[10px] font-semibold px-1.5 py-px border border-border bg-surface-3 text-text-secondary inline-block uppercase">{submission.cloud}</div>
                  </div>
                )}
                {submission.maturity && (
                  <div>
                    <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wide mb-0.5">Maturity</div>
                    <div className="text-[10px] font-semibold px-1.5 py-px border border-border bg-surface-3 text-text-secondary inline-block capitalize">{submission.maturity}</div>
                  </div>
                )}
                {submission.coContributors && (
                  <div>
                    <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wide mb-0.5">Co-contributors</div>
                    <div className="text-[12px] text-text-secondary">{submission.coContributors}</div>
                  </div>
                )}
              </div>
              {submission.gitUrl && (
                <div className="mb-2">
                  <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wide mb-0.5">Git repository</div>
                  <a href={submission.gitUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-mono text-brand hover:underline truncate block">{submission.gitUrl}</a>
                </div>
              )}
              {submission.architecture && (
                <div className="mb-2">
                  <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wide mb-0.5">Architecture overview</div>
                  <p className="text-[12px] text-text-secondary leading-relaxed">{submission.architecture}</p>
                </div>
              )}
              {submission.prerequisites && (
                <div className="mb-2">
                  <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wide mb-0.5">Prerequisites</div>
                  <p className="text-[12px] text-text-secondary leading-relaxed">{submission.prerequisites}</p>
                </div>
              )}
              {submission.tags && (
                <div>
                  <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wide mb-1">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {submission.tags.split(',').filter(Boolean).map((t, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-px bg-surface-3 text-text-secondary border border-border">{t.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="bg-surface border border-border p-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-2 flex items-center gap-1.5">
              <Activity className="w-3 h-3" strokeWidth={1.5} />
              AI review
            </h2>
            {submission.aiScore == null ? (
              <div className="flex items-center gap-2 p-3 bg-surface-3 border border-border text-[12px] text-text-secondary">
                <Clock className="w-4 h-4 text-text-muted flex-shrink-0" strokeWidth={1.5} />
                Review in progress. This may take a short time.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="border border-border bg-surface-3 px-4 py-3 text-center min-w-[100px]">
                  <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1">
                    Score
                  </div>
                  <div className="text-[22px] font-semibold text-text-primary tabular-nums">
                    {submission.aiScore}
                    <span className="text-[12px] text-text-muted font-normal">/100</span>
                  </div>
                </div>
                {submission.aiFindings?.length > 0 && (
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">
                      Findings
                    </div>
                    <ul className="space-y-2">
                      {submission.aiFindings.map((f, i) => (
                        <li
                          key={i}
                          className="text-[11px] text-text-secondary border-l-2 border-border pl-2 leading-relaxed"
                        >
                          {typeof f === 'string'
                            ? f
                            : [f.category, f.detail].filter(Boolean).join(' — ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          {canAct && (
            <section className="bg-surface border border-border p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-2">
                Governance decision
              </h2>
              <textarea
                value={govNote}
                onChange={(e) => setGovNote(e.target.value)}
                placeholder="Notes for the record (optional)"
                className="w-full p-2 border border-border bg-surface text-[12px] text-text-primary outline-none focus:border-border-mid min-h-[72px] resize-y mb-3"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleAction('approved')}
                  disabled={!!actionLoading}
                  className="py-1.5 px-3 border border-brand bg-brand text-white text-[12px] font-semibold hover:bg-brand-hover active:bg-brand-active disabled:opacity-50 inline-flex items-center gap-2 rounded-enterprise-md shadow-enterprise transition-colors duration-180 focus-ring"
                >
                  {actionLoading === 'approved' ? <Spinner size="sm" color="white" /> : null}
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('remediation')}
                  disabled={!!actionLoading}
                  className="py-1.5 px-3 border border-border-mid bg-surface text-text-primary text-[12px] font-semibold hover:bg-brand-muted hover:border-brand-muted-border disabled:opacity-50 inline-flex items-center gap-2 rounded-enterprise-md transition-colors duration-180 focus-ring"
                >
                  {actionLoading === 'remediation' ? <Spinner size="sm" color="muted" /> : null}
                  Request remediation
                </button>
              </div>
            </section>
          )}
        </div>

        <aside className="bg-surface border border-border p-4 h-fit">
          <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-2 flex items-center gap-1.5">
            <Activity className="w-3 h-3" strokeWidth={1.5} />
            Status history
          </h2>
          {submission.statusHistory?.length > 0 ? (
            <ol className="relative border-l border-border ml-1.5 space-y-3 pl-4">
              {[...submission.statusHistory].reverse().map((h, i) => {
                const cfg = PIPELINE_STATUS_META[h.status] || { label: h.status };
                return (
                  <li key={i} className="text-[11px]">
                    <div className="font-semibold text-text-primary">{cfg.label || h.status}</div>
                    {h.changedBy && (
                      <div className="text-text-muted text-[10px] mt-0.5">{h.changedBy}</div>
                    )}
                    {h.note && (
                      <div className="text-text-secondary mt-1 leading-relaxed">{h.note}</div>
                    )}
                    {h.timestamp && (
                      <div className="text-[10px] text-text-muted mt-1 tabular-nums">
                        {new Date(h.timestamp).toLocaleString()}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-[11px] text-text-muted">No history.</p>
          )}
        </aside>
      </div>

      <DemoVideoModal open={demoOpen} title={submission.name} src={demoSrc} onClose={() => setDemoOpen(false)} />
    </div>
  );
};

export default SubmissionDetail;
