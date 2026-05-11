import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LayoutGrid, Layers } from 'lucide-react';
import { getFamilyByKey } from '../api/families';
import { getAssetsByFamily } from '../api/assets';
import { getCatalogMasters } from '../api/catalog';
import PageLoader from '../components/ui/PageLoader';
import ErrorState from '../components/ui/ErrorState';
import DemoVideoModal from '../components/DemoVideoModal';
import {
  CatalogueTile,
  resolveFamilyThemeName,
  effortToTier,
  topAccentBorderClass,
} from '../components/CatalogueTileCard';
import { resolveMediaSrc } from '../utils/mediaSrc';

const FamilyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [family, setFamily] = useState(null);
  const [assets, setAssets] = useState([]);
  const [maturityByCode, setMaturityByCode] = useState({});
  const [cloudByCode, setCloudByCode] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [demoModal, setDemoModal] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fRes, aRes, mastersRes] = await Promise.all([
        getFamilyByKey(id),
        getAssetsByFamily(id).catch(() => ({ data: { data: [] } })),
        getCatalogMasters().catch(() => ({ data: { data: { values: [] } } })),
      ]);
      setFamily(fRes.data.data);
      setAssets(aRes.data.data || []);
      const vals = mastersRes.data?.data?.values || [];
      const m = {};
      vals
        .filter((v) => v.typeCode === 'MATURITY')
        .forEach((v) => {
          m[String(v.code || '').toLowerCase()] = v.label || v.code;
        });
      setMaturityByCode(m);
      const clouds = {};
      vals
        .filter((v) => v.typeCode === 'CLOUD')
        .forEach((v) => {
          const k = String(v.code || '').toLowerCase();
          clouds[k] = v.label || v.code;
          if (v.code) clouds[v.code] = v.label || v.code;
        });
      setCloudByCode(clouds);
    } catch (e) {
      setError(e.response?.data?.message || 'Family not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const familyThemeName = useMemo(
    () => (family ? resolveFamilyThemeName(id, family.name) : 'Atlas'),
    [id, family],
  );
  const famLabel = family?.name || id;

  const openDemo = (asset) => {
    const src = asset?.demoVideoUrl ? resolveMediaSrc(asset.demoVideoUrl) : '';
    if (!src) return;
    setDemoModal({ title: asset.name, src });
  };

  if (loading) return <PageLoader message="Loading family…" />;
  if (error || !family)
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <ErrorState message={error} onRetry={load} />
      </div>
    );

  const statsRow = [
    { num: family.stats?.assets ?? 0, label: 'Assets' },
    { num: family.stats?.battleTested ?? 0, label: 'Battle-tested' },
    { num: assets.filter((a) => a.demoReady).length, label: 'Demo-ready' },
    { num: family.stats?.deploys ?? 0, label: 'Deploys' },
  ];

  return (
    <div className="page-wrap">
      <div className="flex items-center gap-2 text-[11px]">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="text-text-secondary font-medium hover:underline inline-flex items-center gap-1 focus-ring"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          Dashboard
        </button>
        <span className="text-border">/</span>
        <span className="font-semibold text-text-primary">{family.name}</span>
      </div>

      <div
        className={`card shadow-card overflow-hidden border-t-2 ${topAccentBorderClass(familyThemeName)}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x divide-border">
          <div className="p-5 lg:p-6 bg-gradient-to-b from-surface to-surface-muted/30">
            <div className="inline-flex items-center gap-1.5 mb-2">
              <span className="icon-wrap !w-8 !h-8 !rounded-lg border-sky-200/80 bg-sky-50 text-sky-700">
                <Layers className="w-4 h-4" strokeWidth={1.75} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                {family.tagline}
              </span>
            </div>
            <h1 className="text-lg font-semibold text-text-primary leading-tight tracking-tight">
              {family.name}
            </h1>
            {family.longDesc && typeof family.longDesc === 'string' && (
              <p className="text-[13px] text-text-secondary leading-relaxed mt-3">{family.longDesc}</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              {statsRow.map((s, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-surface px-3 py-3 text-center shadow-sm"
                >
                  <div className="text-[18px] font-semibold text-text-primary tabular-nums leading-none">
                    {s.num}
                  </div>
                  <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wide mt-1.5">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 lg:p-6 bg-surface-muted/25 grid grid-cols-1 md:grid-cols-2 gap-6">
            {family.useCases?.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-2.5">
                  When to use
                </div>
                <ul className="space-y-2">
                  {family.useCases.map((u, i) => (
                    <li key={i} className="text-[12px] text-text-secondary leading-snug flex gap-2">
                      <span className="text-brand-600/80 flex-shrink-0 font-bold">·</span>
                      {typeof u === 'string' ? u : u?.name || u?.label || String(u ?? '')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="space-y-5">
              {family.dependsOn?.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-2">
                    Depends on
                  </div>
                  <ul className="space-y-1.5 text-[12px] text-text-secondary">
                    {family.dependsOn.map((d, i) => (
                      <li key={i} className="border-l-2 border-border pl-2.5 leading-snug">
                        {typeof d === 'string' ? d : d?.name || d?.label || String(d ?? '')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {family.enables?.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-2">
                    Enables
                  </div>
                  <ul className="space-y-1.5 text-[12px] text-text-secondary">
                    {family.enables.map((e, i) => (
                      <li key={i} className="border-l-2 border-border pl-2.5 leading-snug">
                        {typeof e === 'string' ? e : e?.name || e?.label || String(e ?? '')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {family.solutions?.length > 0 && (
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-3">
            Signature solutions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {family.solutions.map((sol, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-surface shadow-card px-4 py-3 border-l-[3px] border-l-brand-400/70"
              >
                <div className="text-[13px] font-semibold text-text-primary leading-snug">{typeof sol === 'string' ? sol : sol?.name || sol?.title || sol?.label || JSON.stringify(sol)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {assets.length > 0 && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary tracking-tight flex items-center gap-2">
                <span className="icon-wrap !w-9 !h-9 !rounded-xl border-brand-100 bg-brand-50 text-brand-600">
                  <LayoutGrid className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </span>
                Assets
                <span className="text-[13px] font-semibold text-text-muted tabular-nums">
                  ({assets.length})
                </span>
              </h2>
              <p className="text-[13px] text-text-muted mt-1 ml-11">
                Same catalog cards as the main browse view — open an asset or preview its demo video.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/catalog')}
              className="btn-ghost shadow-sm self-start sm:self-auto text-[13px]"
            >
              Full catalog
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 list-none p-0 m-0">
            {assets.map((a) => {
              const matLc = String(a.maturity || '').toLowerCase();
              const maturityLabel = maturityByCode[matLc] || a.maturity || '';
              const cloudLabels = (a.clouds || [])
                .map((c) => cloudByCode[String(c || '').toLowerCase()] || cloudByCode[c] || (typeof c === 'string' ? c : ''))
                .filter(Boolean);
              const complexityTier = effortToTier(a.effort);
              return (
                <li key={a.id} className="min-w-0">
                  <CatalogueTile
                    asset={a}
                    onOpen={(assetId) => navigate(`/detail/${assetId}`)}
                    onPlayDemo={openDemo}
                    familyThemeName={familyThemeName}
                    famLabel={famLabel}
                    maturityLabel={maturityLabel}
                    cloudLabels={cloudLabels}
                    complexityTier={complexityTier}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <DemoVideoModal
        open={!!demoModal?.src}
        title={demoModal?.title}
        src={demoModal?.src || ''}
        onClose={() => setDemoModal(null)}
      />
    </div>
  );
};

export default FamilyDetail;
