"use client";

import { PageHeader } from "@/components/PageHeader";
import SelectAutocomplete from "@/components/SelectAutocomplete";
import { CategoryDistributionCard } from "@/components/stats/CategoryDistributionCard";
import { CreationTrendCard } from "@/components/stats/CreationTrendCard";
import { MostUsedPunchlinesCard } from "@/components/stats/MostUsedPunchlinesCard";
import { StatCard } from "@/components/stats/StatCard";
import { StatusDistributionCard } from "@/components/stats/StatusDistributionCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCategories } from "@/hooks/useCategories";
import { usePunchlines } from "@/hooks/usePunchlines";
import { useStatuses } from "@/hooks/useStatuses";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpen,
  Layers,
  RotateCcw,
  Search,
  Tag,
  TrendingUp,
  Minimize2,
  Maximize2,
  ArrowLeftRight,
  ZoomIn,
  ZoomOut,
  X
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useIntl } from "react-intl";

export default function StatsPage() {
  const intl = useIntl();

  // Search and Filter States
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Reading Mode States
  const [readingPunchline, setReadingPunchline] = useState<{ id: string; text: string } | null>(null);
  const [readingFontSize, setReadingFontSize] = useState(32);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReadingFullWidth, setIsReadingFullWidth] = useState(false);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error toggling fullscreen:", err);
    }
  };

  const openReading = (punchline: { id: string; text: string }) => {
    setReadingPunchline(punchline);
    window.location.hash = "read";
  };

  const closeReading = () => {
    if (window.location.hash === "#read") {
      window.history.back();
    } else {
      setReadingPunchline(null);
    }
  };

  // Sync modal states with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash !== "#read") {
        setReadingPunchline(null);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Close reading mode on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeReading();
      }
    };
    if (readingPunchline) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readingPunchline]);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (readingPunchline) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [readingPunchline]);

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
    setStartDate("");
    setEndDate("");
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

      // 4. Date Range Filter
      if (startDate || endDate) {
        if (!p.created_at) return false;
        const itemDate = new Date(p.created_at);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (itemDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (itemDate > end) return false;
        }
      }

      return true;
    });
  }, [punchlines, searchInput, selectedCategoryIds, selectedStatusId, startDate, endDate]);

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
    // Filter collections by the selected date range if active
    const filteredCollections = collections.filter((col: any) => {
      if (startDate || endDate) {
        if (!col.date) return false;
        const colDate = new Date(col.date);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (colDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (colDate > end) return false;
        }
      }
      return true;
    });

    // Calculate how many times each punchline is used across filtered collections
    const punchlineCollectionCounts: Record<string, number> = {};
    filteredCollections.forEach((col: any) => {
      col.collection_items?.forEach((item: any) => {
        if (item.punchline_id) {
          punchlineCollectionCounts[item.punchline_id] =
            (punchlineCollectionCounts[item.punchline_id] || 0) + 1;
        }
      });
    });

    // Count how many filtered collections contain at least one of the filtered punchlines
    const activeCollectionsCount = filteredCollections.filter((col: any) =>
      col.collection_items?.some((item: any) => filteredPunchlineIds.has(item.punchline_id))
    ).length;

    // Sort matching punchlines by collection usage count
    const mostUsedPunchlines = filteredPunchlines
      .map((p) => ({
        id: p.id,
        text: stripHtml(p.text),
        originalText: p.text,
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

    return {
      totalPunchlines,
      avgChars,
      avgWords,
      activeCollectionsCount,
      mostUsedPunchlines,
      categoriesDistribution,
      statusesDistribution,
    };
  }, [filteredPunchlines, collections, filteredPunchlineIds, statuses, startDate, endDate]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-text-muted font-medium">
            {intl.formatMessage({ id: "common.loading", defaultMessage: "Loading..." })}
          </p>
        </div>
      );
    }

    if (stats.totalPunchlines === 0) {
      return (
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
      );
    }

    return (
      <div className="space-y-8">
        {/* General metrics cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label={intl.formatMessage({ id: "stats.total_punchlines", defaultMessage: "Total Punchlines" })}
            value={stats.totalPunchlines}
            icon={<BookOpen className="w-5 h-5" />}
            iconClassName="bg-accent-primary/10 text-accent-primary"
          />

          <StatCard
            label={intl.formatMessage({ id: "stats.total_collections", defaultMessage: "Total Collections" })}
            value={stats.activeCollectionsCount}
            icon={<Layers className="w-5 h-5" />}
            iconClassName="bg-amber-500/10 text-amber-500"
          />

          <StatCard
            label={intl.formatMessage({ id: "stats.avg_length", defaultMessage: "Average Length" })}
            value={stats.avgWords}
            icon={<BarChart3 className="w-5 h-5" />}
            iconClassName="bg-emerald-500/10 text-emerald-500"
            suffix={intl.formatMessage({ id: "stats.words", defaultMessage: "words" })}
          />

          <StatCard
            label={intl.formatMessage({ id: "stats.total_categories", defaultMessage: "Total Categories" })}
            value={categories.length}
            icon={<Tag className="w-5 h-5" />}
            iconClassName="bg-blue-500/10 text-blue-500"
          />
        </div>

        {/* Layout grid for distributions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CategoryDistributionCard
            categoriesDistribution={stats.categoriesDistribution}
            totalPunchlines={stats.totalPunchlines}
          />

          <StatusDistributionCard
            statusesDistribution={stats.statusesDistribution}
            totalPunchlines={stats.totalPunchlines}
          />

        </div>

        <CreationTrendCard
          punchlines={filteredPunchlines}
          startDate={startDate}
          endDate={endDate}
        />

        <MostUsedPunchlinesCard
          mostUsedPunchlines={stats.mostUsedPunchlines}
          onPunchlineClick={openReading}
        />
      </div>
    );
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 transition-colors duration-200 font-sans">
      <div className="space-y-8 animate-fade-in">
        <PageHeader
          title={intl.formatMessage({ id: "stats.title", defaultMessage: "Statistics Dashboard" })}
          description={intl.formatMessage({ id: "stats.subtitle", defaultMessage: "Detailed analysis, categories, and usage of your punchlines." })}
          icon={<TrendingUp />}
        />

        {/* Filters and Search Bar */}
        <div className="bg-bg-card p-5 border border-border-ui rounded-2xl shadow-sm transition-all duration-200 space-y-4 md:sticky md:top-20 md:z-10">
          {/* Search Input */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:flex-1 relative h-11 md:self-end">
              <Search className="w-4 h-4 text-text-muted-light absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={intl.formatMessage({ id: "stats.search_placeholder", defaultMessage: "Search statistics..." })}
                className="pl-10 h-11"
              />
            </div>
            {/* Status single-selector */}
            <div className="w-full md:flex-1 min-w-[200px]">
              <SelectAutocomplete
                items={statuses.map((s) => ({ id: s.id, name: s.name }))}
                multiple={false}
                selectedId={selectedStatusId}
                onChange={setSelectedStatusId}
                placeholder={intl.formatMessage({ id: "filter.status", defaultMessage: "Filter by Status" })}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row flex-wrap gap-4">

            {/* Start Date */}
            <div className="w-full md:flex-1 min-w-[150px] relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted select-none pointer-events-none">
                {intl.formatMessage({ id: "filter.start_date", defaultMessage: "From" })}
              </div>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-12 h-11 text-xs text-text-primary"
              />
            </div>

            {/* End Date */}
            <div className="w-full md:flex-1 min-w-[150px] relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted select-none pointer-events-none">
                {intl.formatMessage({ id: "filter.end_date", defaultMessage: "To" })}
              </div>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10 h-11 text-xs text-text-primary"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row flex-wrap gap-4">
            {/* Category multi-selector */}
            <div className="w-full md:flex-1 min-w-[200px]">
              <SelectAutocomplete
                items={categories.map((c) => ({ id: c.id, name: c.name }))}
                multiple={true}
                selectedIds={selectedCategoryIds}
                onChange={setSelectedCategoryIds}
                placeholder={intl.formatMessage({ id: "filter.category", defaultMessage: "Filter by Category" })}
              />
            </div>

            {/* Reset button */}
            {(searchInput || selectedCategoryIds.length > 0 || selectedStatusId || startDate || endDate) && (
              <Button
                variant="ghost"
                onClick={handleResetFilters}
                className="h-11 px-4 gap-2 hover:bg-bg-input shrink-0 border border-border-ui text-text-muted hover:text-text-primary w-full md:w-auto self-stretch md:self-end"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{intl.formatMessage({ id: "filter.clear", defaultMessage: "Clear Filters" })}</span>
              </Button>
            )}
          </div>
        </div>

        {renderContent()}
      </div>

      {/* Reading Mode Fullscreen Modal */}
      {readingPunchline && (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg-primary/95 backdrop-blur-md animate-fade-in p-0 justify-between">
          {/* Top toolbar */}
          <div className="flex items-center gap-2 md:gap-3 absolute top-2 right-2 md:top-4 md:right-4">
            {/* Fullscreen Toggle */}
            <Button
              type="button"
              onClick={toggleFullscreen}
              variant="outline"
              className="p-2 bg-bg-card border border-border-ui hover:bg-bg-input text-text-muted hover:text-text-primary rounded-xl transition-all duration-150 cursor-pointer shadow-sm flex items-center justify-center h-auto w-auto"
              title={isFullscreen ? "Disattiva schermo intero" : "Schermo intero"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 md:w-5 h-5" />
              ) : (
                <Maximize2 className="w-4 h-4 md:w-5 h-5" />
              )}
            </Button>

            {/* Width Toggle */}
            <Button
              type="button"
              onClick={() => setIsReadingFullWidth((prev) => !prev)}
              variant="outline"
              className={`p-2 border transition-all duration-150 cursor-pointer shadow-sm flex items-center justify-center h-auto w-auto rounded-xl ${isReadingFullWidth
                ? "bg-accent-primary/10 border-accent-primary/30 text-accent-primary hover:bg-accent-primary/20"
                : "bg-bg-card border-border-ui text-text-muted hover:text-text-primary hover:bg-bg-input"
                }`}
              title={intl.formatMessage({ id: "reading.full_width", defaultMessage: "Larghezza massima" })}
            >
              <ArrowLeftRight className="w-4 h-4 md:w-5 h-5" />
            </Button>

            {/* Font controls */}
            <div className="flex items-center gap-1 bg-bg-card border border-border-ui rounded-xl p-1 shadow-sm">
              <Button
                type="button"
                onClick={() => setReadingFontSize((prev) => Math.max(16, prev - 4))}
                variant="ghost"
                className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-input rounded-lg transition-all duration-150 cursor-pointer h-auto w-auto"
                title={intl.formatMessage({ id: "reading.zoom_out", defaultMessage: "Rimpicciolisci testo" })}
              >
                <ZoomOut className="w-4 h-4 md:w-5 h-5" />
              </Button>
              <Button
                type="button"
                onClick={() => setReadingFontSize(24)}
                variant="ghost"
                className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-input rounded-lg transition-all duration-150 text-xs font-semibold px-2.5 cursor-pointer h-auto w-auto"
                title={intl.formatMessage({ id: "reading.reset", defaultMessage: "Ripristina" })}
              >
                <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </Button>
              <Button
                type="button"
                onClick={() => setReadingFontSize((prev) => Math.min(80, prev + 4))}
                variant="ghost"
                className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-input rounded-lg transition-all duration-150 cursor-pointer h-auto w-auto"
                title={intl.formatMessage({ id: "reading.zoom_in", defaultMessage: "Ingrandisci testo" })}
              >
                <ZoomIn className="w-4 h-4 md:w-5 h-5" />
              </Button>
            </div>

            {/* Close Button */}
            <Button
              type="button"
              onClick={closeReading}
              variant="outline"
              className="p-2 bg-bg-card border border-border-ui hover:bg-bg-input text-text-muted hover:text-text-primary rounded-xl transition-all duration-150 cursor-pointer shadow-sm h-auto w-auto"
              title={intl.formatMessage({ id: "button.cancel", defaultMessage: "Chiudi" })}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto w-full px-4">
            <div className={`flex flex-col min-h-full mx-auto justify-center items-center w-full transition-all duration-300 ${isReadingFullWidth ? "max-w-none px-4 md:px-8" : "max-w-5xl"
              }`}>
              <div
                className="text-text-primary leading-relaxed rich-text-content break-words w-full selection:bg-accent-primary/20 my-auto pt-12 text-center"
                style={{ fontSize: `${readingFontSize}px` }}
                dangerouslySetInnerHTML={{ __html: readingPunchline.text }}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
