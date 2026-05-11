import React from 'react';
import {
  Cloud,
  Layers,
  BadgeCheck,
  Gauge,
  ArrowUpRight,
  PlayCircle,
} from 'lucide-react';
import { Tooltip } from './Tooltip';

/** Thin top-edge accent only — L/R/B stay neutral enterprise border */
export const FAMILY_TOP_ACCENT = {
  Atlas: 'border-t-sky-500/[0.58]',
  Forge: 'border-t-violet-500/[0.52]',
  Relay: 'border-t-teal-500/[0.52]',
  Sentinel: 'border-t-stone-500/[0.48]',
  Nexus: 'border-t-indigo-500/[0.52]',
};
const TOP_ACCENT_DEFAULT = 'border-t-slate-400/[0.55]';

export function topAccentBorderClass(familyThemeName) {
  return FAMILY_TOP_ACCENT[familyThemeName] || TOP_ACCENT_DEFAULT;
}

export const FAMILY_TAG = {
  Atlas: 'border-sky-800/32 bg-sky-950/[0.06] text-slate-800',
  Forge: 'border-violet-800/30 bg-violet-950/[0.05] text-slate-800',
  Relay: 'border-teal-800/30 bg-teal-950/[0.05] text-slate-800',
  Sentinel: 'border-stone-500/40 bg-stone-100/85 text-stone-800',
  Nexus: 'border-indigo-800/30 bg-indigo-950/[0.05] text-slate-800',
};

const STAGE_TAG = {
  'Battle-Tested': 'border-slate-400/55 bg-slate-100 text-slate-800',
  Validated: 'border-blue-800/30 bg-blue-950/[0.05] text-slate-800',
  Experimental: 'border-amber-800/35 bg-amber-950/[0.045] text-slate-900',
};

const COMPLEXITY_TAG = {
  Low: 'border-emerald-800/28 bg-emerald-950/[0.045] text-slate-800',
  Med: 'border-slate-400/50 bg-slate-100 text-slate-800',
  High: 'border-orange-900/30 bg-orange-950/[0.04] text-slate-900',
};

const CLOUD_TAG = {
  AWS: 'border-orange-900/30 bg-orange-950/[0.04] text-slate-800',
  GCP: 'border-emerald-900/28 bg-emerald-950/[0.04] text-slate-800',
  Azure: 'border-blue-800/28 bg-blue-950/[0.045] text-slate-800',
};

export const tagBase =
  'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold border';

const KEY_TO_FAMILY_THEME = {
  atlas: 'Atlas',
  forge: 'Forge',
  relay: 'Relay',
  sentinel: 'Sentinel',
  nexus: 'Nexus',
};

export function resolveFamilyThemeName(familyKey, label) {
  const byKey = KEY_TO_FAMILY_THEME[String(familyKey || '').toLowerCase()];
  if (byKey) return byKey;
  const L = String(label || '').trim();
  if (['Atlas', 'Forge', 'Relay', 'Sentinel', 'Nexus'].includes(L)) return L;
  return L || 'Atlas';
}

export function effortToTier(effort) {
  const s = String(effort || '').toLowerCase();
  if (s.includes('low')) return 'Low';
  if (s.includes('high')) return 'High';
  if (s.includes('medium') || s.includes('med')) return 'Med';
  return null;
}

export function stagePillClass(maturityLabel) {
  const t = String(maturityLabel || '').toLowerCase();
  if (t.includes('battle')) return STAGE_TAG['Battle-Tested'];
  if (t.includes('validat')) return STAGE_TAG.Validated;
  if (t.includes('experiment')) return STAGE_TAG.Experimental;
  return 'border-border bg-surface-muted text-text-secondary';
}

export function cloudPillClass(displayLabel) {
  const u = String(displayLabel || '').toUpperCase();
  if (u.includes('AWS')) return CLOUD_TAG.AWS;
  if (u.includes('GCP') || u.includes('GOOGLE')) return CLOUD_TAG.GCP;
  if (u.includes('AZURE')) return CLOUD_TAG.Azure;
  return 'border-slate-400/40 bg-surface-muted text-text-secondary';
}

export const CatalogTile = ({
  asset,
  onOpen,
  onPlayDemo,
  familyThemeName,
  famLabel,
  maturityLabel,
  cloudLabels,
  complexityTier,
}) => {
  const topAccent = topAccentBorderClass(familyThemeName);
  const familyTag = FAMILY_TAG[familyThemeName] || 'border-slate-400/45 bg-surface-muted text-slate-800';
  const stageTag = stagePillClass(maturityLabel);
  const complexityTag =
    complexityTier && COMPLEXITY_TAG[complexityTier]
      ? COMPLEXITY_TAG[complexityTier]
      : 'border-border bg-surface-muted text-text-secondary';

  const hasDemoVideo = !!asset.demoVideoUrl;
  const showDemoBadge = hasDemoVideo || (asset.stats?.demos ?? 0) > 0;
  const dept = asset.owner || 'Platform catalog';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(asset.id);
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(asset.id)}
      onKeyDown={handleKeyDown}
      className={`
        group relative z-0 flex flex-col rounded-xl cursor-pointer bg-surface
        border border-border shadow-card
        border-t-2 ${topAccent}
        will-change-transform
        transition-[transform,box-shadow,border-top-width] duration-200 ease-out
        hover:z-10 hover:-translate-y-0.5
        hover:border-t-[3px] hover:shadow-md hover:shadow-slate-900/[0.07]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
        motion-reduce:transform-none motion-reduce:hover:shadow-card motion-reduce:hover:border-t-2
      `}
    >
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="font-mono text-[10px] font-medium text-text-muted tabular-nums px-1.5 py-0.5 rounded border border-border bg-surface-muted/80">
            {asset.id}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {showDemoBadge &&
              (hasDemoVideo ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayDemo?.(asset);
                  }}
                  className={`${tagBase} border-brand-800/32 bg-brand-900/[0.045] text-slate-800 hover:bg-brand-900/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors`}
                  title="Preview demo video"
                >
                  <PlayCircle className="w-3 h-3 text-brand-800/90" strokeWidth={2} />
                  Preview
                </button>
              ) : (
                <span className={`${tagBase} border-brand-800/32 bg-brand-900/[0.045] text-slate-800`}>
                  <PlayCircle className="w-3 h-3 text-brand-800/90" strokeWidth={2} />
                  Demo
                </span>
              ))}
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
              Open
              <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
            </span>
          </div>
        </div>

        <h3 className="text-[14px] font-semibold text-text-primary leading-snug tracking-tight group-hover:text-brand-800 transition-colors line-clamp-2">
          {asset.name}
        </h3>
        <p className="mt-1.5 text-[12px] text-text-secondary leading-relaxed line-clamp-2 flex-1">{asset.desc}</p>

        <Tooltip title="Owning area" subtitle={dept} className="mt-3 w-full min-w-0 flex-col">
          <p className="text-[10px] text-text-muted font-medium truncate cursor-default">{dept}</p>
        </Tooltip>

        <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-1.5">
          <span className={`${tagBase} ${familyTag}`}>
            <Layers className="w-3 h-3 opacity-[0.82]" strokeWidth={2} />
            {famLabel}
          </span>
          <span className={`${tagBase} ${stageTag}`}>
            <BadgeCheck className="w-3 h-3 opacity-[0.82]" strokeWidth={2} />
            {maturityLabel || '—'}
          </span>
          {complexityTier && (
            <span className={`${tagBase} ${complexityTag}`}>
              <Gauge className="w-3 h-3 opacity-[0.82]" strokeWidth={2} />
              {complexityTier}
            </span>
          )}
        </div>

        {(cloudLabels || []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {cloudLabels.map((c) => (
              <span key={c} className={`${tagBase} font-medium ${cloudPillClass(c)}`}>
                <Cloud className="w-3 h-3 opacity-[0.75]" strokeWidth={2} />
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};

export const CatalogListRow = ({
  asset,
  onOpen,
  onPlayDemo,
  familyThemeName,
  famLabel,
  maturityLabel,
  cloudLabels,
}) => (
  <div
    className={`
      w-full rounded-xl bg-surface flex items-stretch
      border border-border shadow-card
      border-t-2 ${topAccentBorderClass(familyThemeName)}
      transition-[transform,box-shadow,border-top-width] duration-200 ease-out
      hover:-translate-y-px hover:border-t-[3px] hover:shadow-md hover:shadow-slate-900/[0.07]
      motion-reduce:hover:translate-y-0 motion-reduce:hover:border-t-2 motion-reduce:hover:shadow-card
    `}
  >
    <button
      type="button"
      onClick={() => onOpen(asset.id)}
      className="flex-1 min-w-0 text-left px-4 py-3.5 flex items-start gap-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
    >
      <span className="font-mono text-[10px] text-text-muted tabular-nums px-1.5 py-0.5 rounded border border-border bg-surface-muted shrink-0 mt-0.5">
        {asset.id}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-text-primary leading-snug">{asset.name}</div>
        <p className="text-[12px] text-text-secondary line-clamp-2 mt-1">{asset.desc}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span
            className={`${tagBase} ${FAMILY_TAG[resolveFamilyThemeName(asset.family, famLabel)] || 'border-slate-400/45 bg-surface-muted text-slate-800'}`}
          >
            {famLabel}
          </span>
          <span className={`${tagBase} ${stagePillClass(maturityLabel)}`}>{maturityLabel || '—'}</span>
          {(cloudLabels || []).slice(0, 4).map((c) => (
            <span key={c} className={`${tagBase} font-medium ${cloudPillClass(c)}`}>
              {c}
            </span>
          ))}
        </div>
      </div>
      <ArrowUpRight className="w-4 h-4 text-text-muted shrink-0 mt-1 opacity-60" strokeWidth={2} />
    </button>
    {asset.demoVideoUrl ? (
      <button
        type="button"
        onClick={() => onPlayDemo?.(asset)}
        className="shrink-0 px-3 sm:px-4 border-l border-border flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-brand-800 bg-surface-muted/40 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 transition-colors"
        title="Preview demo video"
      >
        <PlayCircle className="w-5 h-5" strokeWidth={1.75} />
        <span className="hidden sm:inline">Video</span>
      </button>
    ) : null}
  </div>
);
