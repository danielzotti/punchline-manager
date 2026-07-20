"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useIntl } from "react-intl";
import { supabase } from "@/lib/supabase";
import { usePunchlines } from "@/hooks/usePunchlines";
import { useCategories } from "@/hooks/useCategories";
import { useStatuses } from "@/hooks/useStatuses";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import SelectAutocomplete from "@/components/SelectAutocomplete";
import {
  TrendingUp,
  BarChart3,
  Award,
  Layers,
  Activity,
  Search,
  RotateCcw,
  BookOpen,
  PieChart
} from "lucide-react";

export default function StatsPage() {
  const intl = useIntl();

  // Search and Filter States
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState("");

  // Fetch standard data hooks
  const { punchlines, isLoading: loadingPunchlines } = usePunchlines({});
  const { categories } = useCategories();
  const { statuses } = useStatuses();

  // Fetch collections and their items for collection popularity stats
  const { data: collections = [], isLoading: loadingCollections } = useQuery({
    queryKey: ["collections-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("collections").select(`
        id,
        title,
        date,
        collection_items (
          id,
          punchline_id,
          item_type
        )
      `);
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = loadingPunchlines || loadingCollections;

  // Clear all filters
  const handleResetFilters = () => {
    setSearchInput("");
    setSelectedCategoryIds([]);
    setSelectedStatusId("");
  };

  // Helper to strip HTML tags for character/word calculations
  const stripHtml = (htmlString: string) => {
    if (!htmlString) return "";
    return htmlString.replace(/<[^>]*>/g, "");
  };

  // Filter punchlines based on user selections
  const filteredPunchlines = useMemo(() => {
    return punchlines.filter((p) => {
      // 1. Text Search
      if (searchInput.trim()) {
        const query = searchInput.toLowerCase();
        const textClean = stripHtml(p.text).toLowerCase();
        const notesClean = (p.notes || "").toLowerCase();
        if (!textClean.includes(query) && !notesClean.includes(query)) {
          return false;
        }
      }

      // 2. Category Filter (all selected categories must match)
      if (selectedCategoryIds.length > 0) {
        const pCatIds = p.punchline_categories.map((pc) => pc.category_id);
        const matchesAll = selectedCategoryIds.every((catId) => pCatIds.includes(catId));
        if (!matchesAll) return false;
      }

      // 3. Status Filter
      if (selectedStatusId) {
        if (p.status_id !== selectedStatusId) {
          return false;
        }
      }

      return true;
    });
  }, [punchlines, searchInput, selectedCategoryIds, selectedStatusId]);

  // Set of filtered punchline IDs for collection items filtering
  const filteredPunchlineIds = useMemo(() => {
    return new Set(filteredPunchlines.map((p) => p.id));
  }, [filteredPunchlines]);

  // Compute all metrics dynamically based on the filtered punchline set
  const stats = useMemo(() => {
    const totalPunchlines = filteredPunchlines.length;

    // 1. Length metrics
    let totalChars = 0;
    let totalWords = 0;
    filteredPunchlines.forEach((p) => {
      const clean = stripHtml(p.text);
      totalChars += clean.length;
      totalWords += clean.split(/\s+/).filter(Boolean).length;
    });
    const avgChars = totalPunchlines > 0 ? Math.round(totalChars / totalPunchlines) : 0;
    const avgWords = totalPunchlines > 0 ? Math.round(totalWords / totalPunchlines) : 0;

    // 2. Collection metrics
    // Calculate how many times each punchline is used across all collections
    const punchlineCollectionCounts: Record<string, number> = {};
    collections.forEach((col: any) => {
      col.collection_items?.forEach((item: any) => {
        if (item.punchline_id) {
          punchlineCollectionCounts[item.punchline_id] =
            (punchlineCollectionCounts[item.punchline_id] || 0) + 1;
        }
      });
    });

    // Count how many collections contain at least one of the filtered punchlines
    const activeCollectionsCount = collections.filter((col: any) =>
      col.collection_items?.some((item: any) => filteredPunchlineIds.has(item.punchline_id))
    ).length;

    // Sort matching punchlines by collection usage count
    const mostUsedPunchlines = filteredPunchlines
      .map((p) => ({
        id: p.id,
        text: stripHtml(p.text),
        count: punchlineCollectionCounts[p.id] || 0,
      }))
      .filter((p) => p.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 3. Category distribution (among the filtered set)
    const categoryCounts: Record<string, number> = {};
    filteredPunchlines.forEach((p) => {
      p.punchline_categories.forEach((pc) => {
        if (pc.category) {
          categoryCounts[pc.category.name] = (categoryCounts[pc.category.name] || 0) + 1;
        }
      });
    });
    const categoriesDistribution = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 4. Status distribution (among the filtered set)
    const statusCounts: Record<string, { count: number; color: string; localId: string }> = {};
    // Pre-initialize with all existing statuses so they appear in distribution
    statuses.forEach((s) => {
      statusCounts[s.name] = { count: 0, color: s.color, localId: `status.${s.name.toLowerCase()}` };
    });
    // Add "Unassigned" status just in case
    statusCounts["unassigned"] = { count: 0, color: "#6b7280", localId: "status.unassigned" };

    filteredPunchlines.forEach((p) => {
      const statusName = p.status?.name || "unassigned";
      if (!statusCounts[statusName]) {
        statusCounts[statusName] = {
          count: 0,
          color: p.status?.color || "#6b7280",
          localId: `status.${statusName.toLowerCase()}`,
        };
      }
      statusCounts[statusName].count += 1;
    });

    const statusesDistribution = Object.entries(statusCounts)
      .map(([name, data]) => ({ name, ...data }))
      .filter((s) => s.count > 0 || statuses.some((st) => st.name === s.name))
      .sort((a, b) => b.count - a.count);

    // 5. Timeline trend (Creations by Month)
    const timelineData: Record<string, { label: string; count: number; sortKey: string }> = {};
    filteredPunchlines.forEach((p) => {
      if (!p.created_at) return;
      const date = new Date(p.created_at);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11
      const key = `${year}-${String(month + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString(intl.locale, { month: "short", year: "numeric" });

      if (!timelineData[key]) {
        timelineData[key] = { label, count: 0, sortKey: key };
      }
      timelineData[key].count += 1;
    });

    const trendDistribution = Object.values(timelineData)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-12); // Last 12 months

    return {
      totalPunchlines,
      avgChars,
      avgWords,
      activeCollectionsCount,
      mostUsedPunchlines,
      categoriesDistribution,
      statusesDistribution,
      trendDistribution,
    };
  }, [filteredPunchlines, collections, filteredPunchlineIds, statuses, intl.locale]);

  // SVG calculations for Status Donut Chart
  const donutChartSegments = useMemo(() => {
    const total = stats.statusesDistribution.reduce((sum, s) => sum + s.count, 0);
    if (total === 0) return [];

    let currentAngle = 0;
    const radius = 36;
    const circumference = 2 * Math.PI * radius;

    return stats.statusesDistribution.map((segment) => {
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
  }, [stats.statusesDistribution]);

  // SVG calculations for Timeline Trend Area Chart
  const trendChartPaths = useMemo(() => {
    const data = stats.trendDistribution;
    if (data.length === 0) return { linePath: "", areaPath: "", points: [], maxCount: 0, height: 150, width: 500, paddingX: 40, paddingY: 20 };

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
  }, [stats.trendDistribution]);

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 transition-colors duration-200 font-sans">
      <div className="space-y-8 animate-fade-in">
        <PageHeader
          title={intl.formatMessage({ id: "stats.title", defaultMessage: "Statistics Dashboard" })}
          description={intl.formatMessage({ id: "stats.subtitle", defaultMessage: "Detailed analysis, categories, and usage of your punchlines." })}
          icon={<TrendingUp className="w-6 h-6 text-accent-primary" />}
        />

        {/* Filters and Search Bar */}
        <div className="bg-bg-card p-5 border border-border-ui rounded-2xl shadow-sm transition-all duration-200 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-text-muted-light absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={intl.formatMessage({ id: "stats.search_placeholder", defaultMessage: "Search statistics..." })}
                className="pl-10 h-11"
              />
            </div>

            {/* Category multi-selector */}
            <div className="w-full md:w-64">
              <SelectAutocomplete
                items={categories.map((c) => ({ id: c.id, name: c.name }))}
                multiple={true}
                selectedIds={selectedCategoryIds}
                onChange={setSelectedCategoryIds}
                placeholder={intl.formatMessage({ id: "filter.category", defaultMessage: "Filter by Category" })}
              />
            </div>

            {/* Status single-selector */}
            <div className="w-full md:w-60">
              <SelectAutocomplete
                items={statuses.map((s) => ({ id: s.id, name: intl.formatMessage({ id: `status.${s.name.toLowerCase()}`, defaultMessage: s.name }) }))}
                multiple={false}
                selectedId={selectedStatusId}
                onChange={setSelectedStatusId}
                placeholder={intl.formatMessage({ id: "filter.status", defaultMessage: "Filter by Status" })}
              />
            </div>

            {/* Reset button */}
            {(searchInput || selectedCategoryIds.length > 0 || selectedStatusId) && (
              <Button
                variant="ghost"
                onClick={handleResetFilters}
                className="h-11 px-4 gap-2 hover:bg-bg-input shrink-0 border border-border-ui text-text-muted hover:text-text-primary"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{intl.formatMessage({ id: "filter.clear", defaultMessage: "Clear Filters" })}</span>
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-text-muted font-medium">
              {intl.formatMessage({ id: "common.loading", defaultMessage: "Loading..." })}
            </p>
          </div>
        ) : stats.totalPunchlines === 0 ? (
          <div className="bg-bg-card border border-border-ui rounded-2xl p-12 text-center shadow-sm max-w-lg mx-auto">
            <BarChart3 className="w-12 h-12 text-text-muted-light mx-auto mb-4" />
            <h3 className="text-lg font-bold text-text-primary mb-1">
              {intl.formatMessage({ id: "stats.no_data", defaultMessage: "No data matches the selected filters" })}
            </h3>
            <p className="text-sm text-text-muted mb-6">
              {intl.formatMessage({ id: "punchline.no_results_description", defaultMessage: "Adjust the filters or add a new punchline." })}
            </p>
            {(searchInput || selectedCategoryIds.length > 0 || selectedStatusId) && (
              <Button onClick={handleResetFilters}>
                <RotateCcw className="w-4 h-4 mr-2" />
                {intl.formatMessage({ id: "filter.clear", defaultMessage: "Clear Filters" })}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* General metrics cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Total Punchlines */}
              <div className="bg-bg-card border border-border-ui rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                <div className="bg-accent-primary/10 p-3.5 rounded-xl text-accent-primary">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-text-muted-light font-semibold uppercase tracking-wider">
                    {intl.formatMessage({ id: "stats.total_punchlines", defaultMessage: "Total Punchlines" })}
                  </p>
                  <h4 className="text-2xl font-bold text-text-primary mt-0.5">{stats.totalPunchlines}</h4>
                </div>
              </div>

              {/* Card 2: Total Collections containing active punchlines */}
              <div className="bg-bg-card border border-border-ui rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                <div className="bg-amber-500/10 p-3.5 rounded-xl text-amber-500">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-text-muted-light font-semibold uppercase tracking-wider">
                    {intl.formatMessage({ id: "stats.total_collections", defaultMessage: "Total Collections" })}
                  </p>
                  <h4 className="text-2xl font-bold text-text-primary mt-0.5">{stats.activeCollectionsCount}</h4>
                </div>
              </div>

              {/* Card 3: Avg Length (Words) */}
              <div className="bg-bg-card border border-border-ui rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                <div className="bg-emerald-500/10 p-3.5 rounded-xl text-emerald-500">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-text-muted-light font-semibold uppercase tracking-wider">
                    {intl.formatMessage({ id: "stats.avg_length", defaultMessage: "Average Length" })}
                  </p>
                  <h4 className="text-2xl font-bold text-text-primary mt-0.5">
                    {stats.avgWords} <span className="text-xs font-normal text-text-muted"> {intl.formatMessage({ id: "stats.words", defaultMessage: "words" })}</span>
                  </h4>
                </div>
              </div>

              {/* Card 4: Unassigned vs Total Ratio */}
              <div className="bg-bg-card border border-border-ui rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                <div className="bg-blue-500/10 p-3.5 rounded-xl text-blue-500">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-text-muted-light font-semibold uppercase tracking-wider">
                    {intl.formatMessage({ id: "punchline.status", defaultMessage: "Status" })}
                  </p>
                  <h4 className="text-2xl font-bold text-text-primary mt-0.5">
                    {stats.statusesDistribution.find(s => s.name === "pronta")?.count || 0}
                    <span className="text-xs font-normal text-text-muted"> {intl.formatMessage({ id: "status.pronta", defaultMessage: "Ready" })}</span>
                  </h4>
                </div>
              </div>
            </div>

            {/* Layout grid for distributions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Category distribution */}
              <div className="bg-bg-card border border-border-ui rounded-2xl p-6 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent-primary" />
                  {intl.formatMessage({ id: "stats.categories_distribution", defaultMessage: "Distribution by Category" })}
                </h3>
                {stats.categoriesDistribution.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center py-10 text-text-muted-light text-sm italic">
                    {intl.formatMessage({ id: "category.no_categories", defaultMessage: "No categories created" })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.categoriesDistribution.map((cat) => {
                      const percentage = Math.round((cat.count / stats.totalPunchlines) * 100);
                      return (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-text-primary truncate max-w-[70%]">{cat.name}</span>
                            <span className="text-text-muted">
                              {cat.count} ({percentage})%
                            </span>
                          </div>
                          <div className="w-full bg-bg-input rounded-full h-2.5 overflow-hidden border border-border-ui/60">
                            <div
                              className="bg-accent-primary h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Status distribution with Donut chart */}
              <div className="bg-bg-card border border-border-ui rounded-2xl p-6 shadow-sm flex flex-col">
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
                        <span className="text-2xl font-bold text-text-primary">{stats.totalPunchlines}</span>
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
                    {stats.statusesDistribution.map((status) => {
                      const percentage = Math.round((status.count / stats.totalPunchlines) * 100);
                      const displayName = intl.formatMessage({
                        id: status.localId,
                        defaultMessage: status.name,
                      });
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
            </div>

            {/* Creation Trend chart */}
            <div className="bg-bg-card border border-border-ui rounded-2xl p-6 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent-primary" />
                {intl.formatMessage({ id: "stats.creation_trend", defaultMessage: "Creation Trend Over Time" })}
              </h3>

              {stats.trendDistribution.length === 0 ? (
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

            {/* Popularity Leaderboard */}
            <div className="bg-bg-card border border-border-ui rounded-2xl p-6 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2">
                <Award className="w-5 h-5 text-accent-primary" />
                {intl.formatMessage({ id: "stats.most_used_punchlines", defaultMessage: "Most Used Punchlines in Collections" })}
              </h3>

              {stats.mostUsedPunchlines.length === 0 ? (
                <div className="py-8 text-center text-text-muted-light text-sm italic">
                  {intl.formatMessage({ id: "stats.no_collections_use", defaultMessage: "No punchlines added to collections yet" })}
                </div>
              ) : (
                <div className="divide-y divide-border-ui/60">
                  {stats.mostUsedPunchlines.map((p, idx) => (
                    <div key={p.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Rank Badge */}
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-sm border ${idx === 0
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : idx === 1
                              ? "bg-slate-400/10 text-slate-600 border-slate-400/20"
                              : idx === 2
                                ? "bg-amber-700/10 text-amber-800 border-amber-700/20"
                                : "bg-bg-input text-text-muted border-border-ui"
                            }`}
                        >
                          {idx + 1}
                        </div>
                        {/* Punchline text snippet */}
                        <p className="text-sm font-semibold text-text-primary truncate" title={p.text}>
                          {p.text}
                        </p>
                      </div>

                      {/* Collections Badge */}
                      <span className="shrink-0 bg-accent-primary/10 text-accent-primary text-xs font-bold px-3 py-1.5 rounded-full border border-accent-primary/15">
                        {intl.formatMessage(
                          {
                            id: p.count === 1 ? "collections.item_count_singular" : "collections.item_count_plural",
                            defaultMessage: "{count} collections",
                          },
                          { count: p.count }
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
