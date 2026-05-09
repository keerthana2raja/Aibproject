import React from 'react';
import { Check, X, RotateCcw } from 'lucide-react';
import { Tooltip } from './Tooltip';

const STEPS = [
  { id: 'submit', label: 'Submit', hint: 'Intake & registration' },
  { id: 'review', label: 'Review', hint: 'AI + governance checks' },
  { id: 'outcome', label: 'Outcome', hint: 'Approve, reject, or send back' },
];

function canonicalStatus(raw) {
  const s = String(raw || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (s === 'pending') return 'pending';
  if (s === 'in review') return 'in_review';
  if (s === 'approved') return 'approved';
  if (s === 'rejected') return 'rejected';
  if (raw === 'ai-review' || s === 'ai-review') return 'in_review';
  if (s === 'governance') return 'in_review';
  if (raw === 'remediation' || s === 'remediation') return 'remediation';
  return 'unknown';
}

/** Connector between step i and i+1 (i = 0 → submit–review, i = 1 → review–outcome) */
function segmentClassBetween(canonical, i) {
  if (canonical === 'pending') {
    if (i === 0) return 'bg-sky-400/80';
    return 'bg-slate-200';
  }
  if (canonical === 'in_review') {
    if (i === 0) return 'bg-emerald-400/85';
    return 'bg-sky-400/85';
  }
  if (canonical === 'approved') return 'bg-emerald-400/85';
  if (canonical === 'rejected') {
    if (i === 0) return 'bg-emerald-400/85';
    return 'bg-red-400/80';
  }
  if (canonical === 'remediation') {
    if (i === 0) return 'bg-emerald-400/85';
    return 'bg-amber-400/75';
  }
  return 'bg-slate-200';
}

/** @typedef {'todo'|'active'|'done'|'success'|'reject'|'remediate'} NodeKind */

function nodeTriple(canonical) {
  switch (canonical) {
    case 'pending':
      return ['active', 'todo', 'todo'];
    case 'in_review':
      return ['done', 'active', 'todo'];
    case 'approved':
      return ['done', 'done', 'success'];
    case 'rejected':
      return ['done', 'done', 'reject'];
    case 'remediation':
      return ['done', 'done', 'remediate'];
    default:
      return ['todo', 'todo', 'todo'];
  }
}

function tooltipFor(kind, index) {
  const step = STEPS[index];
  const sub = {
    todo: 'Not started yet.',
    active:
      index === 0
        ? 'In intake queue.'
        : index === 1
          ? 'Review in progress.'
          : 'Awaiting decision.',
    done: 'Complete.',
    success: 'Approved and cleared.',
    reject: 'Rejected or blocked.',
    remediate: 'Returned for remediation — resubmit when ready.',
  };
  return { title: `${step.label}`, subtitle: `${step.hint} · ${sub[kind]}` };
}

const NODE = {
  todo: 'border-slate-200 bg-white text-slate-400 shadow-sm',
  active:
    'border-sky-400 bg-sky-50 text-sky-800 shadow-md shadow-sky-200/50 ring-2 ring-sky-100',
  done: 'border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-100',
  success:
    'border-emerald-500 bg-emerald-100 text-emerald-900 shadow-md ring-1 ring-emerald-200',
  reject: 'border-red-400 bg-red-50 text-red-800 shadow-md ring-2 ring-red-100',
  remediate:
    'border-amber-400 bg-amber-50 text-amber-900 shadow-md ring-2 ring-amber-100',
};

function StepIcon({ kind, index }) {
  if (kind === 'todo') {
    return <span className="text-[11px] font-bold tabular-nums leading-none">{index + 1}</span>;
  }
  if (kind === 'active') {
    return <span className="text-[11px] font-extrabold tabular-nums leading-none">{index + 1}</span>;
  }
  if (kind === 'done') {
    return <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden />;
  }
  if (kind === 'success') {
    return <Check className="h-4 w-4 stroke-[3]" aria-hidden />;
  }
  if (kind === 'reject') {
    return <X className="h-4 w-4 stroke-[3]" aria-hidden />;
  }
  if (kind === 'remediate') {
    return <RotateCcw className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />;
  }
  return null;
}

/**
 * Compact 3-step rail: Submit → Review → Outcome.
 * Labels are not repeated per row — use tooltips + table column header.
 */
export function PipelineProgress({ status }) {
  const canon = canonicalStatus(status);
  const nodes = nodeTriple(canon);

  const labelMap = {
    pending: 'Submit phase',
    in_review: 'In review',
    approved: 'Approved',
    rejected: 'Rejected',
    remediation: 'Remediation',
    unknown: 'Unknown status',
  };
  const ariaStatus = labelMap[canon] ?? String(status || 'Unknown');

  return (
    <div
      className="inline-flex max-w-full"
      role="group"
      aria-label={`Pipeline progress: ${ariaStatus}. Three steps: submit, review, outcome.`}
    >
      <div
        className="flex items-center gap-0 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/95 px-2.5 py-2 shadow-sm shadow-slate-900/[0.06] ring-1 ring-slate-900/[0.04]"
      >
        {STEPS.map((step, i) => (
          <React.Fragment key={step.id}>
            {i > 0 && (
              <div
                aria-hidden
                className={`mx-0.5 h-1 min-w-[14px] flex-1 max-w-[40px] self-center shrink rounded-full ${segmentClassBetween(
                  canon,
                  i - 1,
                )}`}
              />
            )}
            <Tooltip {...tooltipFor(nodes[i], i)} className="shrink-0">
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform ${NODE[nodes[i]]}`}
              >
                <StepIcon kind={nodes[i]} index={i} />
              </div>
            </Tooltip>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
