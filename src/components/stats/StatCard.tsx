import React, { ReactNode } from "react";

interface StatCardProps {
  label: ReactNode;
  value: string | number;
  icon: ReactNode;
  iconClassName?: string;
  suffix?: ReactNode;
}

export function StatCard({
  label,
  value,
  icon,
  iconClassName = "bg-accent-primary/10 text-accent-primary",
  suffix,
}: StatCardProps) {
  return (
    <div className="bg-bg-card border border-border-ui rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
      <div className={`p-3.5 rounded-xl ${iconClassName}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-text-muted-light font-semibold uppercase tracking-wider">
          {label}
        </p>
        <h4 className="text-2xl font-bold text-text-primary mt-0.5">
          {value}
          {suffix && <span className="text-xs font-normal text-text-muted"> {suffix}</span>}
        </h4>
      </div>
    </div>
  );
}
