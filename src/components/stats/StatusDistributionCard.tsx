import React, { useMemo } from "react";
import { useIntl } from "react-intl";
import { PieChart } from "lucide-react";

interface StatusDistribution {
  name: string;
  count: number;
  color: string;
  localId: string;
}

interface StatusDistributionCardProps {
  statusesDistribution: StatusDistribution[];
  totalPunchlines: number;
}

export function StatusDistributionCard({
  statusesDistribution,
  totalPunchlines,
}: StatusDistributionCardProps) {
  const intl = useIntl();

  // SVG calculations for Status Donut Chart
  const donutChartSegments = useMemo(() => {
    const total = statusesDistribution.reduce((sum, s) => sum + s.count, 0);
    if (total === 0) return [];

    let currentAngle = 0;
    const radius = 36;
    const circumference = 2 * Math.PI * radius;

    return statusesDistribution.map((segment) => {
      const percentage = segment.count / total;
      const strokeDashoffset = circumference - percentage * circumference;
      const rotation = currentAngle;
      currentAngle += percentage * 360;

      return {
        ...segment,
        percentage,
        strokeDashoffset,
        circumference,
        rotation,
        radius,
      };
    });
  }, [statusesDistribution]);

  return (
    <div className="bg-bg-card border border-border-ui rounded-2xl p-2 md:p-6 shadow-sm flex flex-col">
      <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2">
        <PieChart className="w-5 h-5 text-accent-primary" />
        {intl.formatMessage({ id: "stats.statuses_distribution", defaultMessage: "Distribution by Status" })}
      </h3>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4 flex-1">
        {/* SVG Donut */}
        {donutChartSegments.length > 0 ? (
          <div className="relative w-40 h-40 shrink-0">
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
              {donutChartSegments.map((seg) => (
                <circle
                  key={seg.name}
                  cx="50"
                  cy="50"
                  r={seg.radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth="12"
                  strokeDasharray={seg.circumference}
                  strokeDashoffset={seg.strokeDashoffset}
                  transform={`rotate(${seg.rotation} 50 50)`}
                  className="transition-all duration-300 hover:stroke-[14px] cursor-pointer"
                >
                  <title>{`${seg.name}: ${seg.count}`}</title>
                </circle>
              ))}
            </svg>
            {/* Center display text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-card rounded-full m-4 border border-border-ui shadow-inner">
              <span className="text-2xl font-bold text-text-primary">{totalPunchlines}</span>
              <span className="text-[10px] text-text-muted-light font-semibold uppercase tracking-wider">
                {intl.formatMessage({ id: "tab.punchlines", defaultMessage: "Punchlines" })}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-40 h-40 shrink-0 bg-bg-input rounded-full border border-dashed border-border-ui flex items-center justify-center text-text-muted-light text-xs">
            No Data
          </div>
        )}

        {/* Donut Legend */}
        <div className="flex-1 space-y-2.5 w-full">
          {statusesDistribution.map((status) => {
            const percentage = totalPunchlines > 0 ? Math.round((status.count / totalPunchlines) * 100) : 0;
            const displayName = status.name === "unassigned"
              ? intl.formatMessage({ id: "status.unassigned", defaultMessage: "Unassigned" })
              : status.name;
            return (
              <div key={status.name} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-text-primary capitalize text-xs">{displayName}</span>
                </div>
                <span className="text-text-muted">
                  {status.count} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
