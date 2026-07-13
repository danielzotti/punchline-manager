import React from 'react';
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactElement;
  className?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, icon, className, action }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200", className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="bg-gradient-to-tr from-violet-600 to-indigo-500 p-2 rounded-xl text-white shadow-lg shadow-violet-500/20 flex items-center justify-center shrink-0">
            {React.cloneElement(icon as React.ReactElement<any>, { className: cn("w-5 h-5", (icon.props as any)?.className) })}
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold text-text-primary leading-tight">{title}</h2>
          {description && (
            <p className="text-xs text-text-muted mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
