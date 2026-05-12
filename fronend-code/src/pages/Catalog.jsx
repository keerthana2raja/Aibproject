import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FolderSearch, Sparkles, Search, X, SlidersHorizontal } from 'lucide-react';
import { getAssets } from '../api/assets';
import { getFamilies } from '../api/families';
import { getCatalogMasters } from '../api/catalog';
import PageLoader from '../components/ui/PageLoader';
import { SkeletonCard } from '../components/ui/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Spinner from '../components/ui/Spinner';
import DemoVideoModal from '../components/DemoVideoModal';
import {
  CatalogTile,
  CatalogListRow,
  resolveFamilyThemeName,
  effortToTier,
} from '../components/CatalogTileCard';
import { resolveMediaSrc } from '../utils/mediaSrc';
import { pickDemoVideoRelPath } from '../utils/demoVideoUrl';

const Segmented = ({ value, onChange, options }) => (
  <div
    className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-surface-muted border border-border shadow-inner"
    role="tablist"
    aria-label="Layout"
  >
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        role="tab"
        aria-selected={value === opt.value}
        onClick={() => onChange(opt.value)}
        className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
          ${
            value === opt.value
              ? 'bg-surface text-brand-700 shadow-card border border-border'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface/80'
          }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const FilterToggle = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
      active
        ? 'border-brand-300 bg-brand-50 text-brand-800 shadow-sm'
        : 'border-border bg-surface text-text-secondary hover:bg-surface-muted hover:text-text-primary'
    }`}
  >
    {label}
  </button>
);

const Catalog = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [taxonomy, setTaxonomy] = useState({
    loaded: false,
    error: null,
    families: [],
    maturities: [],
    clouds: [],
  });

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('grid');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ family: '', maturity: '', cloud: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [demoModal, setDemoModal] = useState(null);

  const openDemo = (asset) => {
    const raw = pickDemoVideoRelPath(asset);
    const src = raw ? resolveMediaSrc(raw) : '';
    if (!src) return;
    setDemoModal({ title: asset.name, src });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (query.trim()) params.q = query.trim();
      if (filters.family) params.family = filters.family;
      if (filters.maturity) params.maturity = filters.maturity;
      if (filters.cloud) params.cloud = filters.cloud;
      const res = await getAssets(params);
      setAssets(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load assets.');
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [fRes, mRes] = await Promise.all([getFamilies(), getCatalogMasters()]);
        if (cancel) return;
        const fams = fRes.data?.data || [];
        const vals = mRes.data?.data?.values || [];
        setTaxonomy({
          loaded: true,
          error: null,
          families: fams.map((f) => ({
            key: f.key,
            label: f.name || f.key,
          })),
          maturities: vals
            .filter((v) => v.typeCode === 'MATURITY')
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
          clouds: vals.filter((v) => v.typeCode === 'CLOUD').sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
        });
      } catch (e) {
        if (!cancel) {
          setTaxonomy({
            loaded: true,
            error: e.response?.data?.message || 'Failed to load catalog reference data.',
            families: [],
            maturities: [],
            clouds: [],
          });
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(load, query ? 320 : 0);
    return () => clearTimeout(t);
  }, [load]);

  const toggleFilter = (key, val) =>
    setFilters((f) => ({ ...f, [key]: f[key] === val ? '' : val }));

  const setFamilyPill = (key) => {
    if (key === '' || key === 'all') {
      setFilters((f) => ({ ...f, family: '' }));
    } else {
      setFilters((f) => ({ ...f, family: f.family === key ? '' : key }));
    }
  };

  const clearAll = () => {
    setQuery('');
    setFilters({ family: '', maturity: '', cloud: '' });
  };

  const hasFilters = query || filters.family || filters.maturity || filters.cloud;

  const canEdit = ['admin', 'editor'].includes((user?.role || '').toLowerCase());

  const familyByKey = useMemo(() => {
    const o = {};
    taxonomy.families.forEach((f) => {
      o[f.key] = f.label || f.key;
    });
    return o;
  }, [taxonomy.families]);

  const maturityByCode = useMemo(() => {
    const o = {};
    taxonomy.maturities.forEach((m) => {
      o[String(m.code || '').toLowerCase()] = m.label || m.code;
    });
    return o;
  }, [taxonomy.maturities]);

  const cloudByCode = useMemo(() => {
    const o = {};
    taxonomy.clouds.forEach((c) => {
      const k = String(c.code || '').toLowerCase();
      o[k] = c.label || c.code;
      if (c.code) o[c.code] = c.label || c.code;
    });
    return o;
  }, [taxonomy.clouds]);

  const totalCount = assets.length;

  if (!taxonomy.loaded) return <PageLoader message="Loading catalog…" />;
  if (taxonomy.error) {
    return (
      <div className="p-6 flex flex-1 items-center justify-center">
        <ErrorState message={taxonomy.error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary tracking-tight flex items-center gap-2">
            <span className="icon-wrap !w-9 !h-9 !rounded-xl border-brand-100 bg-brand-50 text-brand-600">
              <FolderSearch className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </span>
            Asset catalog
          </h2>
          <p className="text-[13px] text-text-muted mt-1 ml-11">
            Browse approved accelerators, agents, and platform patterns.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          {canEdit && (
            <Link
              to="/catalog/new"
              className="btn-ghost shadow-sm"
            >
              Add to catalog
            </Link>
          )}
          <button type="button" className="btn-primary shadow-md" onClick={() => navigate('/submit')}>
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
            Submit asset
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 xl:items-center">
        <div className="relative flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface shadow-inner px-4 py-2.5 transition-colors focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/15 max-w-xl">
          <Search className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, ID, description…"
            className="flex-1 text-[13px] bg-transparent outline-none text-text-primary placeholder:text-text-muted/75"
            aria-label="Search catalog"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div
          className="flex flex-wrap items-center gap-2 p-1 rounded-xl bg-surface-muted border border-border shadow-inner"
          role="group"
          aria-label="Filter by family"
        >
          <button
            type="button"
            onClick={() => setFamilyPill('all')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
              ${
                !filters.family
                  ? 'bg-surface text-brand-700 shadow-card border border-border'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface/80'
              }`}
          >
            All
          </button>
          {taxonomy.families.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFamilyPill(key)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
                ${
                  filters.family === key
                    ? 'bg-surface text-brand-700 shadow-card border border-border'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/80'
                }`}
            >
              {label || key}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 ${
              showFilters
                ? 'border-brand-300 bg-brand-50 text-brand-800'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-muted'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
            More filters
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-semibold text-text-muted hover:text-text-primary px-2 py-1"
            >
              Reset all
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'grid', label: 'Grid' },
              { value: 'list', label: 'List' },
            ]}
          />
        </div>
      </div>

      {showFilters && (
        <div className="rounded-xl border border-border bg-surface-muted/60 shadow-inner overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">Maturity</div>
              <div className="flex flex-wrap gap-1.5">
                {taxonomy.maturities.map((m) => (
                  <FilterToggle
                    key={m.code}
                    label={m.label || m.code}
                    active={filters.maturity === m.code}
                    onClick={() => toggleFilter('maturity', m.code)}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">Cloud</div>
              <div className="flex flex-wrap gap-1.5">
                {taxonomy.clouds.map((c) => (
                  <FilterToggle
                    key={c.code}
                    label={c.label || c.code}
                    active={filters.cloud === c.code}
                    onClick={() => toggleFilter('cloud', c.code)}
                  />
                ))}
              </div>
            </div>
            <div className="text-[12px] text-text-muted flex items-end pb-1">
              Filters apply server-side with debounced search.
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-[13px] text-text-muted">
        {loading && <Spinner size="sm" />}
        <span>
          {loading ? (
            'Loading…'
          ) : (
            <>
              Showing <strong className="font-semibold text-text-primary">{totalCount}</strong> asset
              {totalCount !== 1 ? 's' : ''}
              {filters.family && (
                <span className="text-brand-700 font-medium">
                  {' '}
                  · {familyByKey[filters.family] || filters.family}
                </span>
              )}
              {query && <span> matching your search</span>}
            </>
          )}
        </span>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div
          className={
            view === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'
              : 'flex flex-col gap-3'
          }
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No assets match your filters"
          description="Try another family, clear search, or adjust maturity / cloud filters."
          action={
            <button type="button" onClick={clearAll} className="btn-primary">
              Clear filters
            </button>
          }
        />
      ) : view === 'grid' ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 list-none p-0 m-0">
          {assets.map((a) => {
            const famLabel = familyByKey[a.family] || a.family;
            const familyThemeName = resolveFamilyThemeName(a.family, famLabel);
            const matLc = String(a.maturity || '').toLowerCase();
            const maturityLabel = maturityByCode[matLc] || a.maturity || '';
            const cloudLabels = (a.clouds || [])
              .map((c) => cloudByCode[String(c || '').toLowerCase()] || cloudByCode[c] || (typeof c === 'string' ? c : ''))
              .filter(Boolean);
            const complexityTier = effortToTier(a.effort);
            return (
              <li key={a.id || a._id} className="min-w-0">
                <CatalogTile
                  asset={a}
                  onOpen={(id) => navigate(`/detail/${id}`)}
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
      ) : (
        <div className="flex flex-col gap-3">
          {assets.map((a) => {
            const famLabel = familyByKey[a.family] || a.family;
            const matLc = String(a.maturity || '').toLowerCase();
            const maturityLabel = maturityByCode[matLc] || a.maturity || '';
            const cloudLabels = (a.clouds || [])
              .map((c) => cloudByCode[String(c || '').toLowerCase()] || cloudByCode[c] || (typeof c === 'string' ? c : ''))
              .filter(Boolean);
            return (
              <CatalogListRow
                key={a.id || a._id}
                asset={a}
                onOpen={(id) => navigate(`/detail/${id}`)}
                onPlayDemo={openDemo}
                familyThemeName={resolveFamilyThemeName(a.family, famLabel)}
                famLabel={famLabel}
                maturityLabel={maturityLabel}
                cloudLabels={cloudLabels}
              />
            );
          })}
        </div>
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

export default Catalog;
