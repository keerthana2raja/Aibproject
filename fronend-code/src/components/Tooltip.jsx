import React from 'react';

/**
 * Hover tooltip — positioned above trigger to escape table overflow clipping;
 * stacked above dense table rows via very high z-index + row hover stacking.
 */
export function Tooltip({ title, subtitle, children, className = '' }) {
  return (
    <span className={`group/tt relative z-[50] inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-[9999] mb-2 w-max max-w-[min(260px,calc(100vw-24px))]
          -translate-x-1/2 rounded-enterprise-md border border-slate-600/65 bg-[#101828]
          px-2.5 py-2 shadow-[0_12px_32px_rgba(15,23,42,0.45)] text-[11px]
          opacity-0 invisible translate-y-1 transition-[opacity,transform,visibility] duration-150 ease-out
          motion-reduce:transition-none motion-reduce:translate-y-0
          group-hover/tt:visible group-hover/tt:opacity-100 group-hover/tt:translate-y-0"
      >
        <span className="relative z-[51] block font-semibold text-white text-[11px] leading-tight">{title}</span>
        {subtitle ? (
          <span className="relative z-[51] mt-1 block text-slate-300 leading-snug">{subtitle}</span>
        ) : null}
      </span>
    </span>
  );
}
