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
  TrendingUp
} from "lucide-react";
import { useMemo, useState } from "react";
import { useIntl } from "react-intl";

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

    return {
      totalPunchlines,
      avgChars,
      avgWords,
      activeCollectionsCount,
      mostUsedPunchlines,
      categoriesDistribution,
      statusesDistribution,
    };
  }, [filteredPunchlines, collections, filteredPunchlineIds, statuses]);

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

        <CreationTrendCard punchlines={filteredPunchlines} />

        <MostUsedPunchlinesCard mostUsedPunchlines={stats.mostUsedPunchlines} />
      </div>
    );
  };

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
          <div className="flex flex-col md:flex-row gap-4">

            {/* Category multi-selector */}
            <div className="w-full md:w-2/5">
              <SelectAutocomplete
                items={categories.map((c) => ({ id: c.id, name: c.name }))}
                multiple={true}
                selectedIds={selectedCategoryIds}
                onChange={setSelectedCategoryIds}
                placeholder={intl.formatMessage({ id: "filter.category", defaultMessage: "Filter by Category" })}
              />
            </div>

            {/* Status single-selector */}
            <div className="w-full md:w-2/5">
              <SelectAutocomplete
                items={statuses.map((s) => ({ id: s.id, name: s.name }))}
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
                className="h-11 px-4 gap-2 hover:bg-bg-input shrink-0 border border-border-ui text-text-muted hover:text-text-primary md:self-end md:w-1/5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{intl.formatMessage({ id: "filter.clear", defaultMessage: "Clear Filters" })}</span>
              </Button>
            )}
          </div>
        </div>

        {renderContent()}
      </div>
    </main>
  );
}
