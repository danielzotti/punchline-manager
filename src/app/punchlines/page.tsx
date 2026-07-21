"use client";

import AddToCollectionModal from "@/components/AddToCollectionModal";
import BatchEditModal from "@/components/BatchEditModal";
import SelectAutocomplete from "@/components/SelectAutocomplete";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { NoData } from "@/components/ui/NoData";
import { useCategories } from "@/hooks/useCategories";
import { Punchline, usePunchlines } from "@/hooks/usePunchlines";
import { useStatuses } from "@/hooks/useStatuses";
import {
  MessageSquare,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { FullscreenReaderModal } from "@/components/modals/FullscreenReaderModal";
import { PunchlineFormModal } from "@/components/modals/PunchlineFormModal";
import { PunchlineCard } from "@/components/punchlines/PunchlineCard";

export default function PunchlinesPage() {
  const intl = useIntl();

  // Filter States
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState<string>("");
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch Data using Hooks
  const {
    punchlines,
    isLoading: loadingPunchlines,
    createPunchline,
    updatePunchline,
    deletePunchline,
    batchUpdateStatus,
    batchUpdateNotes,
    batchDeletePunchlines,
    batchAddCategories,
    batchRemoveCategories,
    batchReplaceCategories,
  } = usePunchlines({
    searchText: debouncedSearch,
    categoryIds: selectedCategoryIds,
    statusId: selectedStatusId,
  });

  const { categories, createCategory } = useCategories();
  const { statuses } = useStatuses();

  // Modal States
  const [isPunchlineModalOpen, setIsPunchlineModalOpen] = useState(false);
  const [editingPunchline, setEditingPunchline] = useState<Punchline | null>(null);

  // Selection States
  const [selectedPunchlineIds, setSelectedPunchlineIds] = useState<string[]>([]);
  const [isAddToCollectionModalOpen, setIsAddToCollectionModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Reading Mode States
  const [readingPunchline, setReadingPunchline] = useState<Punchline | null>(null);

  // Sync modal states with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      setIsPunchlineModalOpen(hash === "#add-edit");
      setIsAddToCollectionModalOpen(hash === "#add-to-collection");
      setIsBatchModalOpen(hash === "#batch-edit");
      if (hash !== "#read") {
        setReadingPunchline(null);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    // Initial check
    handleHashChange();

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const openAddEditModal = (punchline?: Punchline) => {
    if (punchline) {
      setEditingPunchline(punchline);
    } else {
      setEditingPunchline(null);
    }
    window.location.hash = "add-edit";
  };

  const closeAddEditModal = () => {
    if (window.location.hash === "#add-edit") {
      window.history.back();
    } else {
      setIsPunchlineModalOpen(false);
    }
  };

  const openAddToCollection = () => {
    window.location.hash = "add-to-collection";
  };

  const closeAddToCollection = () => {
    if (window.location.hash === "#add-to-collection") {
      window.history.back();
    } else {
      setIsAddToCollectionModalOpen(false);
    }
  };

  const openBatchModal = () => {
    window.location.hash = "batch-edit";
  };

  const closeBatchModal = () => {
    if (window.location.hash === "#batch-edit") {
      window.history.back();
    } else {
      setIsBatchModalOpen(false);
    }
  };

  const openReading = (punchline: Punchline) => {
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

  const clearFilters = () => {
    setSearchInput("");
    setSelectedCategoryIds([]);
    setSelectedStatusId("");
  };

  const handleOpenPunchlineModal = (punchline?: Punchline) => {
    openAddEditModal(punchline);
  };

  const handleSavePunchline = async (data: {
    text: string;
    status_id: string;
    category_ids: string[];
    notes: string;
  }) => {
    try {
      if (editingPunchline) {
        await updatePunchline({
          id: editingPunchline.id,
          text: data.text,
          notes: data.notes,
          status_id: data.status_id || null,
          categoryIds: data.category_ids,
        });
      } else {
        await createPunchline({
          text: data.text,
          notes: data.notes,
          status_id: data.status_id || null,
          categoryIds: data.category_ids,
        });
      }
    } catch (err) {
      console.error("Error saving punchline:", err);
    }
  };

  const handleDeletePunchline = async (id: string) => {
    if (confirm(intl.formatMessage({ id: "confirm.delete" }))) {
      await deletePunchline(id);
    }
  };

  const togglePunchlineSelection = (id: string) => {
    setSelectedPunchlineIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const renderPunchlinesContent = () => {
    if (loadingPunchlines) {
      return (
        <div className="py-16 text-center text-text-muted">
          {intl.formatMessage({ id: "common.loading", defaultMessage: "Loading..." })}
        </div>
      );
    }

    if (punchlines.length === 0) {
      return (
        <div className="border border-border-ui rounded-2xl">
          <NoData
            icon={MessageSquare}
            title={intl.formatMessage({ id: "punchline.no_results" })}
            description={intl.formatMessage({ id: "punchline.no_results_description" })}
          />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {punchlines.map((item) => (
          <PunchlineCard
            key={item.id}
            item={item}
            isSelected={selectedPunchlineIds.includes(item.id)}
            onSelectToggle={togglePunchlineSelection}
            onEdit={handleOpenPunchlineModal}
            onDelete={handleDeletePunchline}
            onOpenReading={openReading}
          />
        ))}
      </div>
    );
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 pb-22 transition-colors duration-200">
      <div className="space-y-6">
        <PageHeader
          title={intl.formatMessage({ id: "nav.punchlines", defaultMessage: "Punchline" })}
          description={intl.formatMessage({ id: "punchlines.subtitle", defaultMessage: "Gestisci le tue punchline" })}
          icon={<MessageSquare />}
        />

        {/* Filters panel */}
        <div className="relative z-30 bg-bg-card/50 backdrop-blur-md border border-border-ui rounded-2xl p-4 md:p-6 space-y-4 shadow-sm md:sticky md:top-20 transition-all duration-200">
          <div className="flex flex-row gap-2.5 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={intl.formatMessage({ id: "filter.search" })}
                className="pl-10 w-full"
              />
            </div>

            {/* Mobile Filter Toggle & Add Button */}
            <div className="flex items-center gap-2">
              <Button
                variant={selectedStatusId || selectedCategoryIds.length > 0 ? "default" : "outline"}
                size="icon"
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className="md:hidden"
                title={intl.formatMessage({ id: "filter.title", defaultMessage: "Filters" })}
              >
                <SlidersHorizontal className="w-5 h-5" />
                {(selectedStatusId || selectedCategoryIds.length > 0) && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                )}
              </Button>

              {/* Desktop Create Button */}
              <div className="hidden md:flex">
                <Button onClick={() => handleOpenPunchlineModal()}>
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">{intl.formatMessage({ id: "button.add_punchline" })}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Collapsible / Advanced Filters */}
          <div
            className={`${
              isFiltersExpanded ? "flex" : "hidden md:flex"
            } flex-col md:flex-row gap-4 pt-3 border-t border-border-ui md:items-start justify-between transition-all animate-fade-in`}
          >
            {/* Status Dropdown */}
            <div className="flex-1 md:max-w-xs">
              <span className="text-xs font-bold text-text-muted uppercase block mb-1.5 tracking-wider">
                {intl.formatMessage({ id: "filter.status" })}:
              </span>
              <SelectAutocomplete
                items={statuses}
                multiple={false}
                selectedId={selectedStatusId}
                onChange={setSelectedStatusId}
                placeholder={intl.formatMessage({
                  id: "status.search_placeholder",
                  defaultMessage: "Search statuses...",
                })}
                noResultsMessage={intl.formatMessage({
                  id: "status.no_results",
                  defaultMessage: "No statuses found",
                })}
              />
            </div>

            {/* Category Filter */}
            <div className="flex-1 md:mx-4">
              <span className="text-xs font-bold text-text-muted uppercase block mb-1.5 tracking-wider">
                {intl.formatMessage({ id: "filter.category" })}:
              </span>
              <SelectAutocomplete
                items={categories}
                multiple={true}
                selectedIds={selectedCategoryIds}
                onChange={setSelectedCategoryIds}
                placeholder={intl.formatMessage({
                  id: "category.search_placeholder",
                  defaultMessage: "Search categories...",
                })}
                noResultsMessage={intl.formatMessage({
                  id: "category.no_results",
                  defaultMessage: "No categories found",
                })}
              />
            </div>

            {/* Clear Button */}
            <div className="flex items-end justify-end md:self-end pt-4 md:pt-0">
              <Button onClick={clearFilters} variant="outline" className="w-full md:w-auto h-auto py-2.5">
                {intl.formatMessage({ id: "filter.clear" })}
              </Button>
            </div>
          </div>
        </div>

        {/* List of punchlines */}
        {renderPunchlinesContent()}
      </div>

      {/* Action Bar for Batch Operations */}
      {selectedPunchlineIds.length > 0 && (
        <div className="fixed bottom-24 xl:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-bg-card border border-border-ui shadow-2xl rounded-2xl px-4 py-3 md:px-6 md:py-4 flex items-center gap-3 md:gap-4 animate-slide-up max-w-[calc(100vw-2rem)] w-max">
          <Button
            onClick={openBatchModal}
            className="bg-gradient-to-r from-violet-600 to-indigo-400 text-white font-semibold text-sm px-4 py-2 rounded-xl h-auto"
          >
            {intl.formatMessage({ id: "punchlines.manage_selected" }, { count: selectedPunchlineIds.length })}
          </Button>
          <Button
            onClick={() => setSelectedPunchlineIds([])}
            variant="ghost"
            className="text-text-muted hover:text-text-primary p-2 h-auto w-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Floating Action Button (Mobile Only) */}
      <Button
        onClick={() => handleOpenPunchlineModal()}
        className="md:hidden fixed bottom-24 right-6 z-45 bg-gradient-to-tr from-violet-600 to-indigo-400 text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all border border-accent-primary/20 cursor-pointer h-14 w-14"
        title={intl.formatMessage({ id: "button.add_punchline" })}
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Punchline Creation/Editing Modal */}
      <PunchlineFormModal
        isOpen={isPunchlineModalOpen}
        onClose={closeAddEditModal}
        editingPunchline={editingPunchline}
        statuses={statuses}
        categories={categories}
        onCreateCategory={createCategory}
        onSave={handleSavePunchline}
      />

      {/* Reading Mode Fullscreen Modal */}
      <FullscreenReaderModal
        isOpen={!!readingPunchline}
        onClose={closeReading}
        items={readingPunchline ? [{ id: readingPunchline.id, text: readingPunchline.text }] : []}
        align="center"
      />

      {/* Add To Collection Modal */}
      <AddToCollectionModal
        isOpen={isAddToCollectionModalOpen}
        onClose={closeAddToCollection}
        selectedPunchlineIds={selectedPunchlineIds}
        onSuccess={() => setSelectedPunchlineIds([])}
      />

      {/* Batch Edit Modal */}
      <BatchEditModal
        isOpen={isBatchModalOpen}
        onClose={closeBatchModal}
        selectedPunchlineIds={selectedPunchlineIds}
        statuses={statuses}
        categories={categories}
        onSuccess={() => setSelectedPunchlineIds([])}
        onAddToCollection={openAddToCollection}
        batchUpdateStatus={batchUpdateStatus}
        batchUpdateNotes={batchUpdateNotes}
        batchDeletePunchlines={batchDeletePunchlines}
        batchAddCategories={batchAddCategories}
        batchRemoveCategories={batchRemoveCategories}
        batchReplaceCategories={batchReplaceCategories}
      />
    </main>
  );
}
