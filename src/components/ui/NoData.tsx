import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NoDataProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function NoData({ icon: Icon, title, description }: NoDataProps) {
  return (
    <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-bg-card">
      <div className="bg-bg-input p-3 rounded-full text-text-muted">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-sm font-bold text-text-primary">{title}</h3>
      {description && (
        <p className="text-xs text-text-muted max-w-xs">{description}</p>
      )}
    </div>
  );
}
