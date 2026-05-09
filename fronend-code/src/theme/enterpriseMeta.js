/**
 * Operational labels — neutral slate only. Distinction is textual, not chromatic.
 */
const NEUTRAL = {
  fg: '#475569',
  bg: '#f8fafc',
  border: '#e2e8f0',
};

export const FAMILY_META = {
  atlas: { label: 'Atlas', ...NEUTRAL },
  forge: { label: 'Forge', ...NEUTRAL },
  relay: { label: 'Relay', ...NEUTRAL },
  sentinel: { label: 'Sentinel', ...NEUTRAL },
  nexus: { label: 'Nexus', ...NEUTRAL },
};

/** Light-enterprise tile accents — title + badge (Platform families carousel) */
export const FAMILY_TILE_THEME = {
  atlas: {
    title: 'text-sky-600',
    badge: 'border-sky-200/85 bg-sky-50 text-sky-700',
    hoverRing: 'hover:ring-sky-300/55 group-hover:border-sky-200',
  },
  forge: {
    title: 'text-amber-600',
    badge: 'border-amber-200/85 bg-amber-50 text-amber-900',
    hoverRing: 'hover:ring-amber-400/35 group-hover:border-amber-200',
  },
  relay: {
    title: 'text-violet-600',
    badge: 'border-violet-200/85 bg-violet-50 text-violet-900',
    hoverRing: 'hover:ring-violet-400/40 group-hover:border-violet-200',
  },
  sentinel: {
    title: 'text-rose-600',
    badge: 'border-rose-200/85 bg-rose-50 text-rose-900',
    hoverRing: 'hover:ring-rose-400/40 group-hover:border-rose-200',
  },
  nexus: {
    title: 'text-slate-600',
    badge: 'border-slate-200 bg-slate-100 text-slate-800',
    hoverRing: 'hover:ring-slate-400/35 group-hover:border-slate-300',
  },
};

export const MATURITY_META = {
  'battle-tested': { label: 'Battle-tested', ...NEUTRAL },
  validated: { label: 'Validated', ...NEUTRAL },
  experimental: { label: 'Experimental', ...NEUTRAL },
};

export const CLOUD_META = {
  aws: { label: 'AWS', ...NEUTRAL },
  gcp: { label: 'GCP', ...NEUTRAL },
  azure: { label: 'Azure', ...NEUTRAL },
};

export const PIPELINE_STATUS_META = {
  'ai-review': { label: 'AI review', ...NEUTRAL },
  governance: { label: 'Governance', ...NEUTRAL },
  remediation: { label: 'Remediation', ...NEUTRAL },
  approved: { label: 'Approved', ...NEUTRAL },
};
