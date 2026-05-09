import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
    {Icon && (
      <div className="w-10 h-10 border border-border bg-surface-3 rounded-enterprise flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-text-muted" strokeWidth={1.5} />
      </div>
    )}
    <div className="text-[13px] font-semibold text-text-primary mb-1">{title}</div>
    {description && (
      <p className="text-[12px] text-text-muted max-w-[320px] leading-relaxed mb-4">
        {description}
      </p>
    )}
    {action && action}
  </div>
);

export default EmptyState;
