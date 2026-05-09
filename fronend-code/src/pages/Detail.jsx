import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  PlayCircle,
  GitPullRequest,
  Tag,
  CheckCircle2,
  Check,
  Link as LinkIcon,
} from 'lucide-react';
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
import { resolveMediaSrc } from '../utils/mediaSrc';
import { useToast } from '../context/ToastContext';

const MetaItem = ({ label, value }) => (
  <div className="flex flex-col gap-0.5 min-w-[4.5rem]">
    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
      {label}
    </span>
    <span className="text-[12px] font-semibold text-text-primary tabular-nums">{value}</span>
  </div>
);

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [asset, setAsset] = useState(null);
  const [familyRow, setFamilyRow] = useState(null);
  const [mastersByCode, setMastersByCode] = useState({
    maturity: {},
    cloud: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ctaBusy, setCtaBusy] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assetRes, mastersRes] = await Promise.all([
        getAssetById(id),
        getCatalogMasters().catch(() => ({ data: { data: { values: [] } } })),
      ]);
      const a = assetRes.data.data;
      setAsset(a);

      const vals = mastersRes.data?.data?.values || [];
      const maturity = {};
      const cloud = {};
      vals.forEach((v) => {
        const code = String(v.code || '').toLowerCase();
        if (v.typeCode === 'MATURITY')
          maturity[code] = v.label || v.code;
        if (v.typeCode === 'CLOUD') {
          cloud[code] = v.label || v.code;
          if (v.code) cloud[v.code] = v.label || v.code;
        }
      });
      setMastersByCode({ maturity, cloud });

      if (a?.family) {
        try {
          const fr = await getFamilyByKey(a.family);
          setFamilyRow(fr.data?.data ?? null);
        } catch {
          setFamilyRow(null);
        }
      } else {
        setFamilyRow(null);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Asset not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const logCta = async (action) => {
    if (!asset?.id) return;
    setCtaBusy(true);
    try {
      await postActivityLog({
        action,
        resourceType: 'asset',
        description: `${asset.id} · ${asset.name}`,
      });
      toast.success(action === 'demo_opened' ? 'Demo launch recorded.' : 'Access request recorded.');
    } catch {
      toast.error('Could not record this action. Try again.');
    } finally {
      setCtaBusy(false);
    }
  };

  if (loading) return <PageLoader message="Loading asset…" />;
  if (error)
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  if (!asset) return null;

  const demoVideoSrc = asset.demoVideoUrl ? resolveMediaSrc(asset.demoVideoUrl) : '';

  const familyDisplay = familyRow?.name || asset.family;
  const maturityLabel =
    mastersByCode.maturity[String(asset.maturity || '').toLowerCase()] || asset.maturity;
  return (
    <div className="p-3 lg:p-4 flex flex-col gap-3 flex-1 max-w-[1600px] w-full mx-auto">
      <nav className="flex items-center gap-1 text-[11px] text-text-muted flex-wrap" aria-label="Breadcrumb">
        <button
          type="button"
          onClick={() => navigate('/catalogue')}
          className="text-text-secondary font-medium hover:underline focus-ring px-0.5"
        >
          Catalogue
        </button>
        <ChevronRight className="w-3 h-3 opacity-60 flex-shrink-0" strokeWidth={1.5} />
        <button
          type="button"
          onClick={() => navigate(`/family/${asset.family}`)}
          className="text-text-secondary font-medium hover:underline capitalize focus-ring px-0.5"
        >
          {familyDisplay}
        </button>
        <ChevronRight className="w-3 h-3 opacity-60 flex-shrink-0" strokeWidth={1.5} />
        <span className="text-text-primary font-medium truncate">{asset.name}</span>
      </nav>

      <div className="bg-surface border border-border overflow-hidden rounded-enterprise-md shadow-enterprise">
        <div className="p-4 lg:p-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex gap-3 min-w-0">
              <div className="w-11 h-11 border border-border bg-surface-3 flex items-center justify-center flex-shrink-0 font-mono text-[11px] font-semibold text-text-secondary">
                {asset.id?.slice(0, 3) || '—'}
              </div>
              <div className="min-w-0">
                <h1 className="text-[15px] font-semibold text-text-primary tracking-tight leading-snug">
                  {asset.name}
                </h1>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-semibold px-1.5 py-px border border-border bg-surface-3 text-text-secondary">
                    {maturityLabel}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-px border border-border bg-surface-3 text-text-secondary capitalize">
                    {familyDisplay}
                  </span>
                  {asset.owner && (
                    <span className="text-[11px] text-text-muted">
                      Owner: <span className="text-text-secondary">{asset.owner}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:flex-shrink-0">
              <button
                type="button"
                disabled={ctaBusy}
                onClick={async () => {
                  if (demoVideoSrc) {
                    setDemoModalOpen(true);
                    return;
                  }
                  await logCta('demo_opened');
                }}
                className="py-1.5 px-3 border border-border bg-surface text-[12px] font-semibold text-text-secondary inline-flex items-center justify-center gap-1.5 hover:bg-surface-3 focus-ring disabled:opacity-50"
              >
                {ctaBusy ? <Spinner size="sm" /> : <PlayCircle className="w-3.5 h-3.5" strokeWidth={1.5} />}
                {demoVideoSrc ? 'Preview demo video' : 'Launch demo'}
              </button>
              <button
                type="button"
                disabled={ctaBusy}
                onClick={() => logCta('access_requested')}
                className="py-1.5 px-3 btn-primary text-[12px] inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {ctaBusy ? <Spinner size="sm" color="white" /> : <GitPullRequest className="w-3.5 h-3.5" strokeWidth={1.5} />}
                Request access
              </button>
            </div>
          </div>

          {asset.desc && (
            <p className="text-[12px] text-text-secondary leading-relaxed mt-4 max-w-3xl border-t border-border pt-4">
              {asset.desc}
            </p>
          )}

          <div className="flex flex-wrap gap-x-6 gap-y-3 mt-4 pt-4 border-t border-border">
            <MetaItem label="Asset ID" value={asset.id} />
            <MetaItem label="Effort" value={asset.effort || '—'} />
            <MetaItem label="Deploys" value={asset.stats?.deploys ?? 0} />
            <MetaItem label="Stars" value={asset.stats?.stars ?? 0} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
                Cloud
              </span>
              <div className="flex gap-1 flex-wrap">
                {(asset.clouds || []).map((c) => (
                    <span
                      key={c}
                      className="text-[10px] font-semibold px-1.5 py-px border border-border bg-surface-3 text-text-secondary"
                    >
                      {mastersByCode.cloud[String(c).toLowerCase()] ||
                        mastersByCode.cloud[c] ||
                        c}
                    </span>
                  ))}
              </div>
            </div>
            {asset.solution && (
              <div className="flex flex-col gap-0.5 min-w-[8rem] max-w-md">
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
                  Solution
                </span>
                <span className="text-[12px] font-medium text-text-primary leading-snug">
                  {asset.solution}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-3">
        <div className="flex flex-col gap-3">
          <QuickStartPanel text={asset.quickStart} />

          <AttachedDocumentsPanel
            attachments={asset.attachments}
            resolveHref={(relpath) =>
              resolveMediaSrc(`/v1/uploads/${String(relpath || '').replace(/^\/+/, '')}`)
            }
          />

          {asset.tags?.length > 0 && (
            <section className="bg-surface border border-border p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-2 flex items-center gap-1.5">
                <Tag className="w-3 h-3" strokeWidth={1.5} />
                Tags
              </h2>
              <div className="flex gap-1 flex-wrap">
                {asset.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-1.5 py-px bg-surface-3 text-text-secondary border border-border font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {asset.changelog?.length > 0 && (
            <section className="bg-surface border border-border p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-2">
                Changelog
              </h2>
              <ul className="space-y-2">
                {asset.changelog.map((entry, i) => (
                  <li
                    key={i}
                    className="text-[11px] text-text-secondary flex gap-2 leading-relaxed border-l-2 border-border pl-2"
                  >
                    {entry}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-3">
          {asset.prerequisites?.length > 0 && (
            <section className="bg-surface border border-border p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />
                Prerequisites
              </h2>
              <ul className="space-y-1.5">
                {asset.prerequisites.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[11px] text-text-secondary leading-snug"
                  >
                    <Check
                      className="w-3 h-3 text-text-muted flex-shrink-0 mt-0.5"
                      strokeWidth={1.5}
                    />
                    {typeof p === 'string' ? p : p?.name || String(p)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {asset.relatedAssets?.length > 0 && (
            <section className="bg-surface border border-border p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-2 flex items-center gap-1.5">
                <LinkIcon className="w-3 h-3" strokeWidth={1.5} />
                Related assets
              </h2>
              <ul className="space-y-1">
                {asset.relatedAssets.map((rel) => (
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

          <section className="bg-surface border border-border p-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-3">
              Usage
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: asset.stats?.deploys ?? 0, label: 'Deploys' },
                { val: asset.stats?.demos ?? 0, label: 'Demos' },
                { val: asset.stats?.projects ?? 0, label: 'Projects' },
                {
                  val:
                    asset.stats?.rating != null && Number.isFinite(asset.stats.rating)
                      ? `${asset.stats.rating}%`
                      : '—',
                  label: 'Rating',
                },
              ].map(({ val, label }) => (
                <div
                  key={label}
                  className="border border-border bg-surface-3 px-2 py-2 text-center"
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
        </aside>
      </div>

      <DemoVideoModal
        open={demoModalOpen && !!demoVideoSrc}
        title={asset.name}
        src={demoVideoSrc}
        onClose={() => setDemoModalOpen(false)}
      />
    </div>
  );
};

export default Detail;
