import React, { useMemo } from "react";
import { useIntl } from "react-intl";
import { TrendingUp } from "lucide-react";

interface TrendData {
  label: string;
  count: number;
  sortKey: string;
}

interface CreationTrendCardProps {
  trendDistribution: TrendData[];
}

export function CreationTrendCard({ trendDistribution }: CreationTrendCardProps) {
  const intl = useIntl();

  // SVG calculations for Timeline Trend Area Chart
  const trendChartPaths = useMemo(() => {
    const data = trendDistribution;
    if (data.length === 0) {
      return {
        linePath: "",
        areaPath: "",
        points: [] as Array<{ x: number; y: number; label: string; count: number }>,
        maxCount: 0,
        height: 150,
        width: 500,
        paddingX: 40,
        paddingY: 20,
      };
    }

    const maxCount = Math.max(...data.map((d) => d.count), 5);
    const width = 500;
    const height = 150;
    const paddingX = 40;
    const paddingY = 20;

    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingY * 2;

    const points = data.map((d, index) => {
      const x = paddingX + (index / (data.length - 1 || 1)) * chartWidth;
      const y = paddingY + chartHeight - (d.count / maxCount) * chartHeight;
      return { x, y, label: d.label, count: d.count };
    });

    // Generate line path (smooth bezier or straight lines)
    let linePath = "";
    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        linePath += ` L ${points[i].x} ${points[i].y}`;
      }
    }

    // Generate area path closing at the bottom
    let areaPath = "";
    if (points.length > 0) {
      areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
    }

    return { linePath, areaPath, points, maxCount, height, width, paddingX, paddingY };
  }, [trendDistribution]);

  return (
    <div className="bg-bg-card border border-border-ui rounded-2xl p-6 shadow-sm flex flex-col">
      <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-accent-primary" />
        {intl.formatMessage({ id: "stats.creation_trend", defaultMessage: "Creation Trend Over Time" })}
      </h3>

      {trendDistribution.length === 0 ? (
        <div className="py-20 text-center text-text-muted-light text-sm italic">
          {intl.formatMessage({ id: "stats.no_data", defaultMessage: "No data matches the selected filters" })}
        </div>
      ) : (
        <div className="w-full overflow-x-auto pb-2">
          <div className="min-w-[500px] h-[180px] relative">
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${trendChartPaths.width} ${trendChartPaths.height}`}
              className="overflow-visible"
            >
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                const y =
                  trendChartPaths.paddingY +
                  (trendChartPaths.height - trendChartPaths.paddingY * 2) * r;
                const labelValue = Math.round(trendChartPaths.maxCount * (1 - r));
                return (
                  <g key={idx} className="opacity-20 dark:opacity-10">
                    <line
                      x1={trendChartPaths.paddingX}
                      y1={y}
                      x2={trendChartPaths.width - trendChartPaths.paddingX}
                      y2={y}
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      className="text-text-primary"
                    />
                    <text
                      x={trendChartPaths.paddingX - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[9px] font-bold fill-current text-text-primary"
                    >
                      {labelValue}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill Gradient Definition */}
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Path */}
              <path d={trendChartPaths.areaPath} fill="url(#trendGradient)" />

              {/* Line Path */}
              <path
                d={trendChartPaths.linePath}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_2px_8px_rgba(139,92,246,0.3)]"
              />

              {/* Data Points */}
              {trendChartPaths.points.map((pt, idx) => (
                <g key={idx} className="group">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    className="fill-bg-card stroke-accent-primary stroke-[3px] transition-all hover:r-[7px] cursor-pointer"
                  />
                  {/* Tooltip labels at bottom */}
                  <text
                    x={pt.x}
                    y={trendChartPaths.height - 4}
                    textAnchor="middle"
                    className="text-[9px] font-semibold fill-current text-text-muted opacity-80"
                  >
                    {pt.label}
                  </text>
                  {/* Tooltip value */}
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-current text-text-primary hidden group-hover:block bg-bg-card px-1 py-0.5 rounded shadow"
                  >
                    {pt.count}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
