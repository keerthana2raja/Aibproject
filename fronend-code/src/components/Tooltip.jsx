import React from 'react';

/**
 * Hover tooltip.
 * @param {'top'|'bottom'|'left'|'right'} [placement='top']
 * For `bottom`, use inside `.card`; `align` steers horizontal anchor.
 * For `right`|`left`, bubble sits beside trigger (fits KPI strips under sticky headers).
 */
export function Tooltip({
  title,
  subtitle,
  children,
  className = '',
  placement = 'top',
  align = 'center',
}) {
  let pos;
  let motionReduceCls;

  switch (placement) {
    case 'right':
      pos = 'left-full top-1/2 ml-0 -translate-y-1/2 -translate-x-1';
      motionReduceCls =
        'motion-reduce:transition-none motion-reduce:-translate-y-1/2 motion-reduce:-translate-x-1';
      break;
    case 'left':
      pos = 'right-full top-1/2 mr-0 -translate-y-1/2 translate-x-1';
      motionReduceCls =
        'motion-reduce:transition-none motion-reduce:-translate-y-1/2 motion-reduce:translate-x-1';
      break;
    case 'bottom': {
      const h =
        align === 'end'
          ? 'left-auto right-0'
          : align === 'start'
            ? 'left-0 right-auto'
            : 'left-1/2 right-auto -translate-x-1/2';
      pos = `${h} top-full mt-1.5 translate-y-[-3px] group-hover/tt:translate-y-0`;
      motionReduceCls = 'motion-reduce:transition-none motion-reduce:translate-y-0';
      break;
    }
    case 'top':
    default: {
      const h =
        align === 'end'
          ? 'left-auto right-0'
          : align === 'start'
            ? 'left-0 right-auto'
            : 'left-1/2 right-auto -translate-x-1/2';
      pos = `${h} bottom-full mb-2 translate-y-1 group-hover/tt:translate-y-0`;
      motionReduceCls = 'motion-reduce:transition-none motion-reduce:translate-y-0';
      break;
    }
  }

  return (
    <span
      className={`group/tt relative z-0 inline-flex hover:z-[1] focus-within:z-[1] ${className}`}
    >
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-[9999] ${pos}
          inline-block w-max min-w-0 max-w-[min(22rem,calc(100vw-1.25rem))] rounded-enterprise-md border border-slate-600/65 bg-[#101828]
          px-2.5 py-2 shadow-[0_12px_32px_rgba(15,23,42,0.45)] text-[11px]
          opacity-0 invisible transition-[opacity,transform,visibility] duration-150 ease-out text-left
          ${motionReduceCls}
          group-hover/tt:visible group-hover/tt:opacity-100`}
      >
        <span className="relative z-[51] block font-semibold text-white text-[11px] leading-snug break-words">
          {title}
        </span>
        {subtitle ? (
          <span className="relative z-[51] mt-1 block text-slate-300 leading-snug break-words">
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}
