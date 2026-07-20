import React, { useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { TrendingUp, ZoomIn, ZoomOut } from "lucide-react";

interface Punchline {
  created_at?: string;
}

interface CreationTrendCardProps {
  punchlines: Punchline[];
}

const ZOOM_CONFIGS = {
  day: { default: 15, min: 5, max: 60, step: 5 },
  week: { default: 10, min: 4, max: 26, step: 2 },
  month: { default: 12, min: 4, max: 36, step: 2 },
  year: { default: 5, min: 3, max: 15, step: 1 },
};

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function CreationTrendCard({ punchlines }: CreationTrendCardProps) {
  const intl = useIntl();
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [visiblePointsCount, setVisiblePointsCount] = useState<number>(ZOOM_CONFIGS.month.default);

  const currentConfig = ZOOM_CONFIGS[groupBy];

  const handleGroupByChange = (mode: 'day' | 'week' | 'month' | 'year') => {
    setGroupBy(mode);
    setVisiblePointsCount(ZOOM_CONFIGS[mode].default);
  };

  const handleZoomIn = () => {
    setVisiblePointsCount((prev) => Math.max(currentConfig.min, prev - currentConfig.step));
  };

  const handleZoomOut = () => {
    setVisiblePointsCount((prev) => Math.min(currentConfig.max, prev + currentConfig.step));
  };

  // Find the latest date among creations to anchor our timeline, default to today
  const anchorDate = useMemo(() => {
    if (punchlines.length === 0) return new Date();
    let latest = new Date(0);
    punchlines.forEach((p) => {
      if (p.created_at) {
        const d = new Date(p.created_at);
        if (d > latest) latest = d;
      }
    });
    return latest.getTime() > 0 ? latest : new Date();
  }, [punchlines]);

  // Aggregate punchlines and slice the timeline based on zoom
  const trendDistribution = useMemo(() => {
    // 1. Group raw punchlines count by appropriate keys
    const punchlineCounts: Record<string, number> = {};
    punchlines.forEach((p) => {
      if (!p.created_at) return;
      const date = new Date(p.created_at);
      let key = "";

      if (groupBy === "day") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      } else if (groupBy === "week") {
        key = `${date.getFullYear()}-W${getWeekNumber(date)}`;
      } else if (groupBy === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else if (groupBy === "year") {
        key = `${date.getFullYear()}`;
      }

      punchlineCounts[key] = (punchlineCounts[key] || 0) + 1;
    });

    // 2. Generate list of consecutive intervals backwards from the anchor date
    const data: Array<{ label: string; count: number; sortKey: string }> = [];

    for (let i = visiblePointsCount - 1; i >= 0; i--) {
      const date = new Date(anchorDate);
      let key = "";
      let label = "";

      if (groupBy === "day") {
        date.setDate(date.getDate() - i);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        label = date.toLocaleDateString(intl.locale, { day: "numeric", month: "short" });
      } else if (groupBy === "week") {
        date.setDate(date.getDate() - i * 7);
        const weekNum = getWeekNumber(date);
        key = `${date.getFullYear()}-W${weekNum}`;
        label = intl.formatMessage(
          { id: "stats.week_label", defaultMessage: "W{week}, {year}" },
          { week: weekNum, year: date.getFullYear() }
        );
      } else if (groupBy === "month") {
        date.setMonth(date.getMonth() - i);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        label = date.toLocaleDateString(intl.locale, { month: "short", year: "numeric" });
      } else if (groupBy === "year") {
        date.setFullYear(date.getFullYear() - i);
        key = `${date.getFullYear()}`;
        label = date.getFullYear().toString();
      }

      const count = punchlineCounts[key] || 0;
      data.push({ label, count, sortKey: key });
    }

    return data;
  }, [punchlines, groupBy, visiblePointsCount, anchorDate, intl]);

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

  // Calculate modulo to skip intermediate X-axis labels when there are too many data points
  const labelModulo = useMemo(() => {
    const totalPoints = trendChartPaths.points.length;
    if (totalPoints <= 6) return 1;
    if (totalPoints <= 12) return 2;
    if (totalPoints <= 20) return 3;
    if (totalPoints <= 35) return 5;
    return 8;
  }, [trendChartPaths.points.length]);

  return (
    <div className="bg-bg-card border border-border-ui rounded-2xl p-6 shadow-sm flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent-primary" />
          {intl.formatMessage({ id: "stats.creation_trend", defaultMessage: "Creation Trend Over Time" })}
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          {/* Group By Selector */}
          <div className="flex items-center bg-bg-input border border-border-ui rounded-lg p-0.5">
            {(['day', 'week', 'month', 'year'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleGroupByChange(mode)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${groupBy === mode
                  ? "bg-accent-primary text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
                  }`}
              >
                {intl.formatMessage({ id: `stats.${mode}`, defaultMessage: mode.toUpperCase() })}
              </button>
            ))}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1.5 bg-bg-input border border-border-ui rounded-lg p-0.5">
            <button
              onClick={handleZoomOut}
              disabled={visiblePointsCount >= currentConfig.max}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-card disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
              title={intl.formatMessage({ id: "stats.zoom_out", defaultMessage: "Zoom Out" })}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-bold text-text-muted select-none px-1 min-w-[20px] text-center">
              {visiblePointsCount}
            </span>
            <button
              onClick={handleZoomIn}
              disabled={visiblePointsCount <= currentConfig.min}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-card disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
              title={intl.formatMessage({ id: "stats.zoom_in", defaultMessage: "Zoom In" })}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {punchlines.length === 0 ? (
        <div className="py-20 text-center text-text-muted-light text-sm italic">
          {intl.formatMessage({ id: "stats.no_data", defaultMessage: "No data matches the selected filters" })}
        </div>
      ) : (
        <div className="w-full overflow-x-auto pb-2">
          <div className="h-[180px] relative">
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
                  {/* Label below the point (showing only some to avoid overlap) */}
                  {(idx % labelModulo === 0 || idx === trendChartPaths.points.length - 1) && (
                    <text
                      x={pt.x}
                      y={trendChartPaths.height - 4}
                      textAnchor="middle"
                      className="text-[9px] font-semibold fill-current text-text-muted opacity-80"
                    >
                      {pt.label}
                    </text>
                  )}
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
