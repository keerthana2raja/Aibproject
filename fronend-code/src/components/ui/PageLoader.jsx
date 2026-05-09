import React from 'react';
import Spinner from './Spinner';

const PageLoader = ({ message = 'Loading…' }) => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[280px] gap-3 py-12">
    <div className="w-10 h-10 border border-border bg-surface flex items-center justify-center">
      <Spinner size="md" color="muted" />
    </div>
    <div className="text-[12px] text-text-muted font-medium">{message}</div>
  </div>
);

export default PageLoader;
