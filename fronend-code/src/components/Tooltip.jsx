import React from 'react';

/**
 * Hover tooltip — default `placement="top"` (e.g. dashboard tiles, dense rows).
 * Use `placement="bottom"` inside `.card` so copy clears the trigger.
 * Use `align="end"` for right-aligned controls so long titles grow leftward and avoid clipping inside `overflow-hidden` cards.
 */
export function Tooltip({
  title,
  subtitle,
  children,
  className = '',
  placement = 'top',
  align = 'center',
}) {
  const bottom = placement === 'bottom';

  const vertical = bottom
    ? 'top-full mt-2 translate-y-[-4px] group-hover/tt:translate-y-0'
    : 'bottom-full mb-2 translate-y-1 group-hover/tt:translate-y-0';

  const horizontal =
    align === 'end'
      ? 'left-auto right-0'
      : align === 'start'
        ? 'left-0 right-auto'
        : 'left-1/2 right-auto -translate-x-1/2';

  return (
    <span className={`group/tt relative z-[50] inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-[9999] ${horizontal} ${vertical}
          inline-block w-max min-w-0 max-w-[min(22rem,calc(100vw-1.25rem))] rounded-enterprise-md border border-slate-600/65 bg-[#101828]
          px-2.5 py-2 shadow-[0_12px_32px_rgba(15,23,42,0.45)] text-[11px]
          opacity-0 invisible transition-[opacity,transform,visibility] duration-150 ease-out text-left
          motion-reduce:transition-none motion-reduce:translate-y-0
          group-hover/tt:visible group-hover/tt:opacity-100`}
      >
        <span className="relative z-[51] block font-semibold text-white text-[11px] leading-snug break-words">
          {title}
        </span>
        {subtitle ? (
          <span className="relative z-[51] mt-1 block text-slate-300 leading-snug break-words">{subtitle}</span>
        ) : null}
      </span>
    </span>
  );
}
