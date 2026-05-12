import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Clock,
  Activity,
  PlayCircle,
  ExternalLink,
  ChevronRight,
  Tag,
  CheckCircle2,
  Check,
  Link as LinkIcon,
  User,
  Calendar,
  FileText,
  Package,
  Gauge,
  Rocket,
  Cloud,
  Briefcase,
} from 'lucide-react';
import { getSubmissionById, updateSubmissionStatus } from '../api/submissions';
import { getAssetById } from '../api/assets';
import { getCatalogMasters } from '../api/catalog';
import { getFamilyByKey } from '../api/families';
import { postActivityLog } from '../api/activity';
import PageLoader from '../components/ui/PageLoader';
import ErrorState from '../components/ui/ErrorState';
import Spinner from '../components/ui/Spinner';
import DemoVideoModal from '../components/DemoVideoModal';
import QuickStartPanel from '../components/QuickStartPanel';
import AttachedDocumentsPanel from '../components/AttachedDocumentsPanel';
import ArchitectureOverviewBlock from '../components/ArchitectureOverviewBlock';
import { useToast } from '../context/ToastContext';
import { PIPELINE_STATUS_META } from '../theme/enterpriseMeta';
import { resolveMediaSrc, resolveAttachmentHref } from '../utils/mediaSrc';
import { pickDemoVideoRelPath, demoVideoTooltipText } from '../utils/demoVideoUrl';
import { Tooltip } from '../components/Tooltip';
import { normalizeSubmissionDetail } from '../utils/submissionApiNormalize';
import { enrichCatalogAssetFromSubmission } from '../utils/enrichCatalogAssetFromSubmission';

/** Governance actions not wired server-side yet; flip each to false when `updateSubmissionStatus` supports it. */
const APPROVE_ACTION_UNAVAILABLE = true;
const REMEDIATION_ACTION_UNAVAILABLE = true;

const governanceBtnDisabledClass =
  'border-border bg-surface-muted text-text-muted cursor-not-allowed shadow-none opacity-90';

const StatusBadge = ({ status }) => {
  const cfg = PIPELINE_STATUS_META[status] || { label: status };
  return (
    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 border border-border bg-surface-3 text-text-secondary rounded-md">
      {cfg.label}
    </span>
  );
};

function formatSubmissionDate(raw) {
  if (raw == null || raw === '') return '—';
  const d = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const SubmissionMetaCell = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2.5 min-w-0">
    <Icon className="w-3.5 h-3.5 text-text-muted mt-0.5 shrink-0" strokeWidth={1.5} />
    <div className="min-w-0">
      <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">{label}</div>
      <div className="text-[12px] font-semibold text-text-primary mt-0.5 truncate">{value}</div>
    </div>
  </div>
);

const CloudMetaCell = ({ cloudLabels }) => (
  <div className="flex items-start gap-2.5 min-w-0">
    <Cloud className="w-3.5 h-3.5 text-text-muted mt-0.5 shrink-0" strokeWidth={1.5} />
    <div className="min-w-0">
      <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Cloud</div>
      <div className="flex gap-1 flex-wrap mt-0.5">
        {cloudLabels.length > 0 ? (
          cloudLabels.map((label) => (
            <span
              key={label}
              className="text-[10px] font-semibold px-1.5 py-px border border-border bg-surface-3 text-text-secondary rounded-md"
            >
              {label}
            </span>
          ))
        ) : (
          <span className="text-[12px] font-semibold text-text-muted">—</span>
        )}
      </div>
    </div>
  </div>
);

function parseTagsField(tags) {
  if (Array.isArray(tags)) return tags.map((t) => (typeof t === 'string' ? t : String(t ?? ''))).filter(Boolean);
  if (typeof tags === 'string' && tags.trim()) {
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function parsePrerequisitesList(prereq) {
  if (Array.isArray(prereq)) return prereq.map((p) => (typeof p === 'string' ? p : p?.name || String(p))).filter(Boolean);
  if (typeof prereq === 'string' && prereq.trim()) {
    return prereq
      .split(/\r?\n/)
      .map((s) => s.replace(/^\s*[-*•]\s*/, '').trim())
      .filter(Boolean);
  }
  return [];
}

function formatChangelogEntry(entry) {
  if (typeof entry === 'string') return entry;
  if (!entry || typeof entry !== 'object') return String(entry ?? '');
  const v = entry.version || entry.v;
  const text = entry.text || entry.message || entry.description;
  if (v && text) return `${v} — ${text}`;
  if (text) return text;
  return entry?.text ?? entry?.message ?? entry?.description ?? JSON.stringify(entry);
}

function buildMastersMaps(values) {
  const maturity = {};
  const cloud = {};
  (values || []).forEach((v) => {
    const code = String(v.code || '').toLowerCase();
    if (v.typeCode === 'MATURITY') maturity[code] = v.label || v.code;
    if (v.typeCode === 'CLOUD') {
      cloud[code] = v.label || v.code;
      if (v.code) cloud[v.code] = v.label || v.code;
    }
  });
  return { maturity, cloud };
}

/** When opening by catalog asset id, the first submission payload may omit statusHistory; hydrate via registration id. */
async function fetchStatusHistoryByRegistration(current, routeId) {
  if (!current) return current;
  if (Array.isArray(current.statusHistory) && current.statusHistory.length > 0) return current;
  const rid =
    current.registrationId != null && String(current.registrationId).trim()
      ? String(current.registrationId).trim()
      : '';
  if (!rid) return current;
  const sameRoute = rid === String(routeId ?? '').trim();
  if (sameRoute && !current.catalogOnlyFallback) return current;
  try {
    const res = await getSubmissionById(rid);
    const alt = normalizeSubmissionDetail(res.data.data);
    if (Array.isArray(alt.statusHistory) && alt.statusHistory.length > 0) {
      return { ...current, statusHistory: alt.statusHistory };
    }
  } catch {
    /* ignore */
  }
  return current;
}

function normalizePipelineStatus(status) {
  return String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
}

const SubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const listRoot = location.pathname.startsWith('/pipeline/')
    ? { label: 'Pipeline', to: '/pipeline' }
    : { label: 'Catalog', to: '/catalog' };
  const toast = useToast();
  const [submission, setSubmission] = useState(null);
  const [asset, setAsset] = useState(null);
  const [familyRow, setFamilyRow] = useState(null);
  const [mastersByCode, setMastersByCode] = useState({ maturity: {}, cloud: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [govNote, setGovNote] = useState('');
  const [demoOpen, setDemoOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, mastersRes] = await Promise.all([
        getSubmissionById(id),
        getCatalogMasters().catch(() => ({ data: { data: { values: [] } } })),
      ]);
      let sub = normalizeSubmissionDetail(subRes.data.data);
      sub = await fetchStatusHistoryByRegistration(sub, id);
      setSubmission(sub);

      const vals = mastersRes.data?.data?.values || [];
      setMastersByCode(buildMastersMaps(vals));

      setAsset(null);

      if (sub.promotedAssetId) {
        try {
          const assetRes = await getAssetById(sub.promotedAssetId);
          const raw = assetRes.data.data;
          const enriched = await enrichCatalogAssetFromSubmission(raw);
          setAsset(enriched);
          if (enriched?.family) {
            try {
              const fr = await getFamilyByKey(enriched.family);
              setFamilyRow(fr.data?.data ?? null);
            } catch {
              setFamilyRow(null);
            }
          } else {
            setFamilyRow(null);
          }
        } catch {
          setAsset(null);
          if (sub.family) {
            try {
              const fr = await getFamilyByKey(sub.family);
              setFamilyRow(fr.data?.data ?? null);
            } catch {
              setFamilyRow(null);
            }
          } else {
            setFamilyRow(null);
          }
        }
      } else if (sub.family) {
        try {
          const fr = await getFamilyByKey(sub.family);
          setFamilyRow(fr.data?.data ?? null);
        } catch {
          setFamilyRow(null);
        }
      } else {
        setFamilyRow(null);
      }
    } catch (e) {
      const httpStatus = e.response?.status;
      if (httpStatus !== 404 && httpStatus !== 400) {
        setError(e.response?.data?.message || 'Could not load this record.');
        return;
      }
      try {
        const [assetRes, mastersRes] = await Promise.all([
          getAssetById(id),
          getCatalogMasters().catch(() => ({ data: { data: { values: [] } } })),
        ]);
        const raw = assetRes.data.data;
        const enriched = await enrichCatalogAssetFromSubmission(raw);
        setAsset(enriched);
        setMastersByCode(buildMastersMaps(mastersRes.data?.data?.values || []));
        const base = normalizeSubmissionDetail({
          registrationId: enriched.registrationId || enriched.id,
          name: enriched.name,
          family: enriched.family,
          owner: enriched.owner,
          submitedBy: enriched.owner,
          description: enriched.desc,
          date: enriched.updatedAt || enriched.createdAt || enriched.date,
          maturity: enriched.maturity,
          status: 'approved',
          quickStart: enriched.quickStart,
          submissionAttachments: enriched.attachments || [],
        });
        base.catalogOnlyFallback = true;
        const mergedBase = await fetchStatusHistoryByRegistration(base, id);
        setSubmission(mergedBase);
        if (enriched?.family) {
          try {
            const fr = await getFamilyByKey(enriched.family);
            setFamilyRow(fr.data?.data ?? null);
          } catch {
            setFamilyRow(null);
          }
        } else {
          setFamilyRow(null);
        }
      } catch (e2) {
        setError(e2.response?.data?.message || 'Asset not found.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const logDemoOpened = () => {
    if (!asset?.id) return;
    void (async () => {
      try {
        await postActivityLog({
          action: 'demo_opened',
          resourceType: 'asset',
          description: `${asset.id} · ${asset.name}`,
        });
        toast.success('Demo launch recorded.');
      } catch {
        toast.error('Could not record this action. Try again.');
      }
    })();
  };

  const handleAction = async (status) => {
    setActionLoading(status);
    try {
      await updateSubmissionStatus(submission.registrationId || id, {
        status,
        govNotes: govNote,
      });
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

  const display = useMemo(() => {
    if (!submission) return null;
    const familyKey = submission.family;
    const familyLabel = familyRow?.name || familyKey || '—';
    const maturityCode = String(asset?.maturity || submission.maturity || '').toLowerCase();
    const maturityLabel =
      mastersByCode.maturity[maturityCode] || asset?.maturity || submission.maturity || '—';
    const name = asset?.name || submission.name;
    const owner = asset?.owner || submission.owner || '';
    const tags = asset?.tags?.length ? asset.tags : parseTagsField(submission.tags);
    const changelog = asset?.changelog?.length ? asset.changelog : [];
    const prereqList = asset?.prerequisites?.length
      ? asset.prerequisites
      : parsePrerequisitesList(submission.prerequisites);
    const relatedAssets = asset?.relatedAssets?.length ? asset.relatedAssets : [];
    const stats = asset?.stats || {
      deploys: 0,
      stars: 0,
      demos: 0,
      projects: 0,
      rating: null,
    };
    const displayId = asset?.id || submission.registrationId;
    const registrationId = submission.registrationId || '—';
    const submittedBy =
      submission.submitedBy ||
      submission.submittedBy ||
      submission.owner ||
      '—';
    const submittedDate = formatSubmissionDate(submission.date);
    const submissionFamilyDisplay =
      submission.family != null && submission.family !== ''
        ? String(submission.family)
        : familyLabel;
    const headerBadge = asset?.id?.slice(0, 3)?.toUpperCase() || String(submission.registrationId || '—').slice(0, 3);

    return {
      name,
      familyLabel,
      familyKey,
      maturityLabel,
      owner,
      registrationId,
      submittedBy,
      submittedDate,
      submissionFamilyDisplay,
      tags,
      changelog,
      prereqList,
      relatedAssets,
      stats,
      displayId,
      headerBadge,
      summaryText: (asset?.desc || submission.description || '').trim() || '',
      clouds: Array.isArray(asset?.clouds) ? asset.clouds : submission.cloud ? [submission.cloud] : [],
      solution: typeof asset?.solution === 'string' ? asset.solution : '',
      effort: asset?.effort || '—',
    };
  }, [submission, asset, familyRow, mastersByCode]);

  if (loading) return <PageLoader message="Loading asset…" />;
  if (error || !submission || !display)
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <ErrorState message={error} onRetry={load} />
      </div>
    );

  const isPipelineReviewRoute = location.pathname.startsWith('/pipeline/');
  const pipelineStatusNorm = normalizePipelineStatus(submission.status);
  /** Show governance UI on Pipeline submission review for any non-terminal workflow state */
  const showGovernancePanel =
    isPipelineReviewRoute &&
    !submission.catalogOnlyFallback &&
    !['approved', 'rejected'].includes(pipelineStatusNorm);
  /** Server only accepts approve/remediation from true governance stage */
  const canExecuteGovernance = pipelineStatusNorm === 'governance';

  const demoRaw = pickDemoVideoRelPath(asset || submission);
  const hasDemoVideo = !!demoRaw;
  const demoSrc = hasDemoVideo ? resolveMediaSrc(demoRaw) : '';
  const attachments = (asset?.attachments?.length ? asset.attachments : null) || submission.submissionAttachments || [];
  const quickStartText = String(submission.quickStart || asset?.quickStart || '').trim();

  const diagramHrefForUi =
    submission.architectureDiagramHref ||
    asset?.architectureDiagramHref ||
    (/^https?:\/\//i.test(String((asset || submission).architecture ?? '').trim())
      ? String((asset || submission).architecture).trim()
      : '');
  const architectureProse =
    typeof (asset || submission).architecture === 'string' &&
    (asset || submission).architecture.trim() &&
    !/^https?:\/\//i.test((asset || submission).architecture.trim())
      ? (asset || submission).architecture.trim()
      : '';

  const cloudLabels = display.clouds
    .map((c) => mastersByCode.cloud[String(c || '').toLowerCase()] || mastersByCode.cloud[c] || (typeof c === 'string' ? c : ''))
    .filter(Boolean);

  return (
    <div className="p-3 lg:p-4 flex flex-col gap-3 flex-1 max-w-[1600px] w-full mx-auto">
      <nav className="flex items-center gap-1 text-[11px] text-text-muted flex-wrap" aria-label="Breadcrumb">
        <button
          type="button"
          onClick={() => navigate(listRoot.to)}
          className="text-text-secondary font-medium hover:underline focus-ring px-0.5"
        >
          {listRoot.label}
        </button>
        <ChevronRight className="w-3 h-3 opacity-60 flex-shrink-0" strokeWidth={1.5} />
        {display.familyKey ? (
          <button
            type="button"
            onClick={() => navigate(`/family/${display.familyKey}`)}
            className="text-text-secondary font-medium hover:underline capitalize focus-ring px-0.5"
          >
            {display.familyLabel}
          </button>
        ) : (
          <span className="text-text-muted">—</span>
        )}
        <ChevronRight className="w-3 h-3 opacity-60 flex-shrink-0" strokeWidth={1.5} />
        <span className="text-text-primary font-medium truncate">{display.name}</span>
      </nav>

      <div className="card card-hover overflow-visible">
        <div className="p-4 lg:p-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex gap-3 min-w-0">
              <div className="w-11 h-11 border border-border bg-surface-3 rounded-lg flex items-center justify-center flex-shrink-0 font-mono text-[11px] font-semibold text-text-secondary">
                {display.headerBadge}
              </div>
              <div className="min-w-0">
                <h1 className="text-[15px] font-semibold text-text-primary tracking-tight leading-snug">
                  {display.name}
                </h1>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {!submission.catalogOnlyFallback && (
                    <StatusBadge status={submission.status} />
                  )}
                  <span className="text-[10px] font-semibold px-1.5 py-px border border-border bg-surface-3 text-text-secondary rounded-md">
                    {display.maturityLabel}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-px border border-border bg-surface-3 text-text-secondary capitalize rounded-md">
                    {display.familyLabel}
                  </span>
                  {display.owner ? (
                    <span className="text-[11px] text-text-muted">
                      Owner: <span className="text-text-secondary">{display.owner}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:flex-shrink-0">
              <Tooltip placement="bottom" align="end" title={demoVideoTooltipText(display.name, hasDemoVideo)}>
                <button
                  type="button"
                  aria-disabled={!hasDemoVideo}
                  tabIndex={hasDemoVideo ? 0 : -1}
                  onClick={() => {
                    if (!hasDemoVideo) return;
                    setDemoOpen(true);
                    logDemoOpened();
                  }}
                  onKeyDown={(e) => {
                    if (!hasDemoVideo) return;
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    setDemoOpen(true);
                    logDemoOpened();
                  }}
                  className={`py-1.5 px-3 rounded-lg border text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 focus-ring shadow-sm ${
                    hasDemoVideo
                      ? 'border-border bg-surface text-text-secondary hover:bg-surface-3'
                      : 'border-border bg-surface-muted text-text-muted cursor-not-allowed opacity-60'
                  }`}
                >
                  <PlayCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  Launch demo
                </button>
              </Tooltip>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div
              className="rounded-xl border border-border bg-surface-muted/30 p-4 sm:p-5"
              aria-label="Asset metadata"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-5">
                <SubmissionMetaCell icon={Tag} label="ID" value={display.registrationId} />
                <SubmissionMetaCell icon={User} label="Submitted by" value={display.submittedBy} />
                <SubmissionMetaCell icon={Calendar} label="Date" value={display.submittedDate} />
                <SubmissionMetaCell icon={FileText} label="Family" value={display.submissionFamilyDisplay} />
                <SubmissionMetaCell
                  icon={Package}
                  label={asset ? 'Asset ID' : 'Registration ID'}
                  value={display.displayId}
                />
                <SubmissionMetaCell icon={Gauge} label="Effort" value={display.effort} />
                <SubmissionMetaCell
                  icon={Rocket}
                  label="Deploys"
                  value={String(display.stats.deploys ?? 0)}
                />
                <CloudMetaCell cloudLabels={cloudLabels} />
                {display.solution ? (
                  <SubmissionMetaCell icon={Briefcase} label="Solution" value={display.solution} />
                ) : null}
              </div>
            </div>
          </div>

          {display.summaryText ? (
            <div className="mt-4 pt-4 border-t border-border">
              <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-2">
                Description
              </h2>
              <p className="text-[12px] text-text-secondary leading-relaxed max-w-3xl">{display.summaryText}</p>
            </div>
          ) : null}
        </div>
      </div>

      {submission.promotedAssetId ? (
        <section className="rounded-xl border border-border bg-brand-50/50 px-4 py-3 flex flex-wrap items-center justify-between gap-2 shadow-card card-hover">
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

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-3">
        <div className="flex flex-col gap-3">
          <QuickStartPanel text={quickStartText} />

          <AttachedDocumentsPanel
            attachments={attachments}
            resolveHref={resolveAttachmentHref}
            showGetButton={location.pathname.startsWith('/detail/')}
          />

          {(submission.cloud ||
            submission.maturity ||
            submission.version ||
            submission.gitUrl ||
            submission.owner ||
            submission.team ||
            submission.prerequisites ||
            submission.tags ||
            submission.coContributors ||
            architectureProse ||
            diagramHrefForUi) && (
            <section className="card card-hover p-4">
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
                    <div className="text-[10px] font-semibold px-1.5 py-px border border-border bg-surface-3 text-text-secondary inline-block uppercase rounded-md">{submission.cloud}</div>
                  </div>
                )}
                {submission.maturity && (
                  <div>
                    <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wide mb-0.5">Maturity</div>
                    <div className="text-[10px] font-semibold px-1.5 py-px border border-border bg-surface-3 text-text-secondary inline-block capitalize rounded-md">{submission.maturity}</div>
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
              <ArchitectureOverviewBlock prose={architectureProse} diagramHref={diagramHrefForUi} />
            </section>
          )}

          {display.tags.length > 0 && (
            <section className="card card-hover p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-2 flex items-center gap-1.5">
                <Tag className="w-3 h-3" strokeWidth={1.5} />
                Tags
              </h2>
              <div className="flex gap-1 flex-wrap">
                {display.tags.map((t, i) => (
                  <span
                    key={`${t}-${i}`}
                    className="text-[10px] px-1.5 py-px bg-surface-3 text-text-secondary border border-border font-medium rounded-md"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {display.changelog.length > 0 && (
            <section className="card card-hover p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-2">
                Changelog
              </h2>
              <ul className="space-y-2">
                {display.changelog.map((entry, i) => (
                  <li
                    key={i}
                    className="text-[11px] text-text-secondary flex gap-2 leading-relaxed border-l-2 border-border pl-2"
                  >
                    {formatChangelogEntry(entry)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!submission.catalogOnlyFallback && (
          <section className="card card-hover p-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-2 flex items-center gap-1.5">
              <Activity className="w-3 h-3" strokeWidth={1.5} />
              AI review
            </h2>
            {submission.aiScore == null ? (
              <div className="flex items-center gap-2 p-3 bg-surface-3 border border-border text-[12px] text-text-secondary rounded-lg">
                <Clock className="w-4 h-4 text-text-muted flex-shrink-0" strokeWidth={1.5} />
                Review in progress. This may take a short time.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="border border-border bg-surface-3 px-4 py-3 text-center min-w-[100px] rounded-lg">
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
          )}

          {showGovernancePanel && (
            <section className="card card-hover p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-2">
                Governance decision
              </h2>
              {!canExecuteGovernance && (
                <p className="text-[11px] text-text-muted mb-3 leading-relaxed">
                  Approve and remediation actions are available when this submission is in{' '}
                  <span className="font-semibold text-text-secondary">Governance</span> status.
                  Current stage:{' '}
                  <span className="font-semibold text-text-secondary capitalize">
                    {PIPELINE_STATUS_META[pipelineStatusNorm]?.label || submission.status || '—'}
                  </span>
                  .
                </p>
              )}
              <textarea
                value={govNote}
                onChange={(e) => setGovNote(e.target.value)}
                placeholder="Notes for the record (optional)"
                disabled={!canExecuteGovernance}
                className="w-full p-2 rounded-lg border border-border bg-surface text-[12px] text-text-primary outline-none focus:border-border-mid min-h-[72px] resize-y mb-3 shadow-inner disabled:opacity-60 disabled:bg-surface-muted disabled:cursor-not-allowed"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  {...(!(canExecuteGovernance && !APPROVE_ACTION_UNAVAILABLE)
                    ? { disabled: true }
                    : { onClick: () => handleAction('approved'), disabled: !!actionLoading })}
                  title={
                    !canExecuteGovernance
                      ? 'Switch to Governance status to enable approval.'
                      : APPROVE_ACTION_UNAVAILABLE
                        ? 'Approve will be enabled when governance approval is integrated.'
                        : undefined
                  }
                  className={`py-1.5 px-3 rounded-lg border text-[12px] font-semibold inline-flex items-center gap-2 transition-colors duration-180 focus-ring ${
                    canExecuteGovernance && !APPROVE_ACTION_UNAVAILABLE
                      ? 'border-brand bg-brand text-white hover:bg-brand-hover active:bg-brand-active disabled:opacity-50 shadow-enterprise'
                      : governanceBtnDisabledClass
                  }`}
                >
                  {!APPROVE_ACTION_UNAVAILABLE && actionLoading === 'approved' ? (
                    <Spinner size="sm" color="white" />
                  ) : null}
                  {APPROVE_ACTION_UNAVAILABLE ? 'Approve (coming soon)' : 'Approve'}
                </button>
                <button
                  type="button"
                  {...(!(canExecuteGovernance && !REMEDIATION_ACTION_UNAVAILABLE)
                    ? { disabled: true }
                    : { onClick: () => handleAction('remediation'), disabled: !!actionLoading })}
                  title={
                    !canExecuteGovernance
                      ? 'Switch to Governance status to enable remediation.'
                      : REMEDIATION_ACTION_UNAVAILABLE
                        ? 'Request remediation will be enabled when governance actions are integrated.'
                        : undefined
                  }
                  className={`py-1.5 px-3 rounded-lg border text-[12px] font-semibold inline-flex items-center gap-2 transition-colors duration-180 focus-ring ${
                    canExecuteGovernance && !REMEDIATION_ACTION_UNAVAILABLE
                      ? 'border-border-mid bg-surface text-text-primary hover:bg-brand-muted hover:border-brand-muted-border disabled:opacity-50'
                      : governanceBtnDisabledClass
                  }`}
                >
                  {!REMEDIATION_ACTION_UNAVAILABLE && actionLoading === 'remediation' ? (
                    <Spinner size="sm" color="muted" />
                  ) : null}
                  {REMEDIATION_ACTION_UNAVAILABLE
                    ? 'Request remediation (coming soon)'
                    : 'Request remediation'}
                </button>
              </div>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-3">
          {display.prereqList.length > 0 && (
            <section className="card card-hover p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />
                Prerequisites
              </h2>
              <ul className="space-y-1.5">
                {display.prereqList.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[11px] text-text-secondary leading-snug"
                  >
                    <Check
                      className="w-3 h-3 text-text-muted flex-shrink-0 mt-0.5"
                      strokeWidth={1.5}
                    />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {display.relatedAssets.length > 0 && (
            <section className="card card-hover p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-2 flex items-center gap-1.5">
                <LinkIcon className="w-3 h-3" strokeWidth={1.5} />
                Related assets
              </h2>
              <ul className="space-y-1">
                {display.relatedAssets.map((rel) => (
                  <li key={rel.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/detail/${rel.id}`)}
                      className="text-[11px] font-semibold text-text-secondary hover:text-text-primary hover:underline focus-ring truncate max-w-full text-left"
                    >
                      {rel.name}
                      <span className="text-[10px] font-mono text-text-muted ml-1">({rel.id})</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card card-hover p-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-3">
              Usage
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: display.stats?.deploys ?? 0, label: 'Deploys' },
                { val: display.stats?.demos ?? 0, label: 'Demos' },
                { val: display.stats?.projects ?? 0, label: 'Projects' },
                {
                  val:
                    display.stats?.rating != null && Number.isFinite(display.stats.rating)
                      ? `${display.stats.rating}%`
                      : '—',
                  label: 'Rating',
                },
              ].map(({ val, label }) => (
                <div
                  key={label}
                  className="border border-border bg-surface-3 px-2 py-2 text-center rounded-lg"
                >
                  <div className="text-[16px] font-semibold text-text-primary tabular-nums leading-none">
                    {val}
                  </div>
                  <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wide mt-1">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card card-hover p-4 h-fit">
            <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-2 flex items-center gap-1.5">
              <Activity className="w-3 h-3" strokeWidth={1.5} />
              Status history
            </h2>
            {submission.statusHistory?.length > 0 ? (
              <ol className="relative border-l border-border ml-1.5 space-y-3 pl-4">
                {[...submission.statusHistory].reverse().map((h, i) => {
                  const cfg = PIPELINE_STATUS_META[h.status] || { label: h.status };
                  const ai = h.aiScore ?? h.ai_score;
                  return (
                    <li key={i} className="text-[11px]">
                      <div className="font-semibold text-text-primary">{cfg.label || h.status}</div>
                      {h.changedBy && (
                        <div className="text-text-muted text-[10px] mt-0.5">{h.changedBy}</div>
                      )}
                      {ai != null && Number.isFinite(Number(ai)) && (
                        <div className="text-text-secondary mt-1 leading-relaxed">
                          AI score: {ai}/100
                        </div>
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
          </section>
        </aside>
      </div>

      <DemoVideoModal open={demoOpen} title={display.name} src={demoSrc} onClose={() => setDemoOpen(false)} />
    </div>
  );
};

export default SubmissionDetail;
