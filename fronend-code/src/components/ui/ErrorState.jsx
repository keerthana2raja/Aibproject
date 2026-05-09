import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorState = ({ message = 'Something went wrong.', onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center max-w-md mx-auto">
    <div className="w-10 h-10 border border-border bg-surface-3 flex items-center justify-center mb-3">
      <AlertCircle className="w-5 h-5 text-text-muted" strokeWidth={1.5} />
    </div>
    <div className="text-[13px] font-semibold text-text-primary mb-1">
      Unable to load
    </div>
    <p className="text-[12px] text-text-muted leading-relaxed mb-4">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface border border-border text-[12px] font-semibold text-text-secondary hover:bg-surface-3 focus-ring"
      >
        <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
        Retry
      </button>
    )}
  </div>
);

export default ErrorState;
