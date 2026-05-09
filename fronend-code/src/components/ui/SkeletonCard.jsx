import React from 'react';

const Block = ({ className }) => (
  <div
    className={`bg-surface-3 border border-border animate-pulse ${className}`}
  />
);

export const SkeletonCard = () => (
  <div className="bg-surface border border-border border-t-2 border-t-border rounded-xl shadow-card p-3 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <Block className="h-2.5 w-16" />
      <div className="flex gap-1">
        <Block className="h-4 w-10" />
        <Block className="h-4 w-10" />
      </div>
    </div>
    <Block className="h-3 w-3/4" />
    <Block className="h-2.5 w-full" />
    <Block className="h-2.5 w-5/6" />
    <div className="flex items-center justify-between pt-2 border-t border-border mt-1">
      <Block className="h-2.5 w-20" />
      <Block className="h-6 w-16" />
    </div>
  </div>
);

export const SkeletonStat = () => (
  <div className="bg-surface border border-border px-3 py-2.5 flex flex-col gap-2">
    <Block className="h-6 w-14" />
    <Block className="h-2.5 w-24" />
  </div>
);

export const SkeletonRow = () => (
  <div className="flex items-center gap-4 px-3 py-2.5 border-b border-border">
    <Block className="h-3 w-1/3" />
    <Block className="h-3 w-1/5" />
    <Block className="h-3 w-1/6" />
    <Block className="h-5 w-16 ml-auto" />
  </div>
);

export default SkeletonCard;
