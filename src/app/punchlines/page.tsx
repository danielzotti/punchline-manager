"use client";

import AddToCollectionModal from "@/components/AddToCollectionModal";
import BatchEditModal from "@/components/BatchEditModal";
import SelectAutocomplete from "@/components/SelectAutocomplete";
import { PageHeader } from "@/components/PageHeader";
import RichTextEditor from "@/components/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { NoData } from "@/components/ui/NoData";
import { useCategories } from "@/hooks/useCategories";
import { Punchline, usePunchlines } from "@/hooks/usePunchlines";
import { useStatuses } from "@/hooks/useStatuses";
import {
  Check,
  ChevronDown,
  Edit2,
  Maximize2,
  MessageSquare,
  Minimize2,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
  ArrowLeftRight
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useIntl } from "react-intl";

interface ClampedPunchlineTextProps {
  text: string;
}

function ClampedPunchlineText({ text }: ClampedPunchlineTextProps) {
  const intl = useIntl();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    const checkClamp = () => {
      const el = containerRef.current;
      if (el) {
        setIsClamped(el.scrollHeight > el.clientHeight);
      }
    };

    checkClamp();

    // Use ResizeObserver to respond to layout size changes dynamically
    const resizeObserver = new ResizeObserver(() => {
      checkClamp();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [text]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="text-text-primary text-base mb-2 leading-relaxed rich-text-content line-clamp-6"
        dangerouslySetInnerHTML={{ __html: text }}
      />
      {isClamped && (
        <div className="inline-flex items-center gap-1 text-accent-primary text-xs font-semibold hover:text-accent-primary/80 transition-colors mb-3 bg-accent-primary/5 hover:bg-accent-primary/10 px-2.5 py-1 rounded-full border border-accent-primary/10">
          <span>{intl.formatMessage({ id: "punchline.read_more", defaultMessage: "Read more" })}</span>
          <ChevronDown className="w-3 h-3" />
        </div>
      )}
    </div>
  );
}

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
  const [readingFontSize, setReadingFontSize] = useState(32);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReadingFullWidth, setIsReadingFullWidth] = useState(false);

  // Sync modal states with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      setIsPunchlineModalOpen(hash === '#add-edit');
      setIsAddToCollectionModalOpen(hash === '#add-to-collection');
      setIsBatchModalOpen(hash === '#batch-edit');
      if (hash !== '#read') {
        setReadingPunchline(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const openAddEditModal = (punchline?: Punchline) => {
    if (punchline) {
      setEditingPunchline(punchline);
      setPunchlineText(punchline.text);
      setPunchlineNotes(punchline.notes || "");
      setPunchlineStatusId(punchline.status_id || "");
      setPunchlineCategoryIds(punchline.punchline_categories.map((pc) => pc.category_id));
    } else {
      setEditingPunchline(null);
      setPunchlineText("");
      setPunchlineNotes("");
      setPunchlineStatusId(statuses[0]?.id || "");
      setPunchlineCategoryIds([]);
    }
    window.location.hash = 'add-edit';
  };

  const closeAddEditModal = () => {
    if (window.location.hash === '#add-edit') {
      window.history.back();
    } else {
      setIsPunchlineModalOpen(false);
      setEditingPunchline(null);
    }
  };

  const openAddToCollection = () => {
    window.location.hash = 'add-to-collection';
  };

  const closeAddToCollection = () => {
    if (window.location.hash === '#add-to-collection') {
      window.history.back();
    } else {
      setIsAddToCollectionModalOpen(false);
    }
  };

  const openBatchModal = () => {
    window.location.hash = 'batch-edit';
  };

  const closeBatchModal = () => {
    if (window.location.hash === '#batch-edit') {
      window.history.back();
    } else {
      setIsBatchModalOpen(false);
    }
  };

  const openReading = (punchline: Punchline) => {
    setReadingPunchline(punchline);
    window.location.hash = 'read';
  };

  const closeReading = () => {
    if (window.location.hash === '#read') {
      window.history.back();
    } else {
      setReadingPunchline(null);
    }
  };

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

  // Lock body scroll when modals are open
  useEffect(() => {
    const isAnyModalOpen = isPunchlineModalOpen || !!readingPunchline || isBatchModalOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPunchlineModalOpen, readingPunchline, isBatchModalOpen]);

  // Form States
  const [punchlineText, setPunchlineText] = useState("");
  const [punchlineNotes, setPunchlineNotes] = useState("");
  const [punchlineStatusId, setPunchlineStatusId] = useState("");
  const [punchlineCategoryIds, setPunchlineCategoryIds] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const clearFilters = () => {
    setSearchInput("");
    setSelectedCategoryIds([]);
    setSelectedStatusId("");
  };

  const handleOpenPunchlineModal = (punchline?: Punchline) => {
    openAddEditModal(punchline);
  };

  const handleSavePunchline = async (e: React.FormEvent) => {
    e.preventDefault();
    const isTextEmpty = !punchlineText || punchlineText.replace(/<[^>]*>/g, "").trim() === "";
    if (isTextEmpty) return;

    try {
      if (editingPunchline) {
        await updatePunchline({
          id: editingPunchline.id,
          text: punchlineText,
          notes: punchlineNotes,
          status_id: punchlineStatusId || null,
          categoryIds: punchlineCategoryIds,
        });
      } else {
        await createPunchline({
          text: punchlineText,
          notes: punchlineNotes,
          status_id: punchlineStatusId || null,
          categoryIds: punchlineCategoryIds,
        });
      }
      closeAddEditModal();
    } catch (err) {
      console.error("Error saving punchline:", err);
    }
  };

  const handleDeletePunchline = async (id: string) => {
    if (confirm(intl.formatMessage({ id: "confirm.delete" }))) {
      await deletePunchline(id);
    }
  };

  const toggleFormCategory = (categoryId: string) => {
    setPunchlineCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setIsCreatingCategory(true);
      const newCat = await createCategory(newCategoryName.trim());
      if (newCat && newCat.id) {
        setPunchlineCategoryIds((prev) => [...prev, newCat.id]);
      }
      setNewCategoryName("");
    } catch (err) {
      console.error("Error creating category:", err);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const isFormTextEmpty = !punchlineText || punchlineText.replace(/<[^>]*>/g, "").trim() === "";

  const renderPunchlinesContent = () => {
    if (loadingPunchlines) {
      return <div className="py-16 text-center text-text-muted">{intl.formatMessage({ id: "common.loading", defaultMessage: "Loading..." })}</div>;
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
          <div
            key={item.id}
            onClick={() => {
              openReading(item);
              setReadingFontSize(24);
            }}
            className={`bg-bg-card border ${selectedPunchlineIds.includes(item.id) ? 'border-accent-primary ring-1 ring-accent-primary' : 'border-border-ui hover:border-accent-primary/50'} rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-sm group cursor-pointer relative`}
          >
            <div className="">
              {/* Card Header Status & Actions */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {/* Checkbox for selection */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPunchlineIds(prev =>
                        prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                      );
                    }}
                    className="flex items-center"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPunchlineIds.includes(item.id)}
                      readOnly
                      className="w-5 h-5 rounded border-border-ui text-accent-primary focus:ring-accent-primary cursor-pointer"
                    />
                  </div>

                  {item.status ? (
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm break-all"
                      style={{
                        backgroundColor: `${item.status.color}15`,
                        color: item.status.color,
                        borderColor: `${item.status.color}30`,
                      }}
                    >
                      {item.status.name}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPunchlineModal(item);
                    }}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-bg-input text-text-muted hover:text-text-primary rounded-lg transition-colors cursor-pointer h-8 w-8"
                    title={intl.formatMessage({ id: "button.edit" })}
                  >
                    <Edit2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePunchline(item.id);
                    }}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-red-500/10 text-text-muted hover:text-red-500 rounded-lg transition-colors cursor-pointer h-8 w-8"
                    title={intl.formatMessage({ id: "button.delete" })}
                  >
                    <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Text (HTML Rendered) */}
              <ClampedPunchlineText text={item.text} />

              {/* Notes if any */}
              {item.notes && (
                <div className="mb-4 bg-bg-input/40 rounded-r-xl p-3 border-l-2 border-accent-primary border-y border-r border-border-ui transition-colors duration-200">
                  <span className="text-text-muted-light font-bold text-[9px] uppercase block mb-1 tracking-wider">
                    {intl.formatMessage({ id: "punchline.notes" })}:
                  </span>
                  <p className="text-xs text-text-muted italic">{item.notes}</p>
                </div>
              )}
            </div>

            {/* Category Tags */}
            {item.punchline_categories && item.punchline_categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-border-ui transition-colors duration-200">
                {item.punchline_categories.map((pc) => (
                  <span
                    key={pc.id}
                    className="bg-bg-input text-text-muted px-2.5 py-0.5 rounded-lg text-xs font-semibold border border-border-ui"
                  >
                    {pc.category?.name || "..."}
                  </span>
                ))}
              </div>
            )}
          </div>
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
                className="pl-10"
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
                <Button
                  onClick={() => handleOpenPunchlineModal()}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">{intl.formatMessage({ id: "button.add_punchline" })}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Collapsible / Advanced Filters */}
          <div className={`${isFiltersExpanded ? "flex" : "hidden md:flex"} flex-col md:flex-row gap-4 pt-3 border-t border-border-ui md:items-start justify-between transition-all animate-fade-in`}>
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
                placeholder={intl.formatMessage({ id: "status.search_placeholder", defaultMessage: "Search statuses..." })}
                noResultsMessage={intl.formatMessage({ id: "status.no_results", defaultMessage: "No statuses found" })}
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
                placeholder={intl.formatMessage({ id: "category.search_placeholder", defaultMessage: "Search categories..." })}
                noResultsMessage={intl.formatMessage({ id: "category.no_results", defaultMessage: "No categories found" })}
              />
            </div>

            {/* Clear Button */}
            <div className="flex items-end justify-end md:self-end pt-4 md:pt-0">
              <Button
                onClick={clearFilters}
                variant="outline"
                className="w-full md:w-auto h-auto py-2.5"
              >
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

      {/* Punchline Creation/Editing Modal & Mobile Bottom Sheet */}
      {isPunchlineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4 animate-fade-in">
          <div className="bg-bg-card border-t md:border border-border-ui rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[100vh] animate-slide-up md:animate-fade-in transition-all duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border-ui flex items-center justify-between flex-shrink-0 transition-colors duration-200">
              <h3 className="text-lg font-bold text-text-primary">
                {editingPunchline
                  ? intl.formatMessage({ id: "punchline.edit_title" })
                  : intl.formatMessage({ id: "punchline.create_title" })}
              </h3>
              <Button
                onClick={closeAddEditModal}
                variant="ghost"
                size="icon"
                className="text-text-muted hover:text-text-primary p-1.5 hover:bg-bg-input rounded-xl transition-colors cursor-pointer h-auto w-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePunchline} className="flex-1 overflow-y-auto p-6 space-y-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:pb-6">
              {/* Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                  {intl.formatMessage({ id: "punchline.text" })} *
                </label>
                <RichTextEditor value={punchlineText} onChange={setPunchlineText} />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                  {intl.formatMessage({ id: "punchline.notes" })}
                </label>
                <input
                  type="text"
                  value={punchlineNotes}
                  onChange={(e) => setPunchlineNotes(e.target.value)}
                  className="w-full bg-bg-input border border-border-ui rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary placeholder-text-muted-light focus:shadow-[0_0_12px_rgba(139,92,246,0.03)] transition-all duration-200"
                  placeholder="Note, contestualizzazione o suggerimenti..."
                />
              </div>

              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                  {intl.formatMessage({ id: "punchline.status" })}
                </label>
                <select
                  value={punchlineStatusId}
                  onChange={(e) => setPunchlineStatusId(e.target.value)}
                  className="w-full bg-bg-input border border-border-ui rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors duration-200"
                >
                  <option value="">Nessuno</option>
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Categories Checklist */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase block tracking-wider">
                  {intl.formatMessage({ id: "punchline.categories" })}
                </label>

                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 border border-border-ui bg-bg-input rounded-xl transition-colors duration-200">
                    {categories.map((cat) => {
                      const isSelected = punchlineCategoryIds.includes(cat.id);
                      return (
                        <Button
                          type="button"
                          key={cat.id}
                          onClick={() => toggleFormCategory(cat.id)}
                          variant="ghost"
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer h-auto w-auto font-normal ${isSelected
                            ? "bg-accent-primary/10 border-accent-primary text-accent-primary shadow-sm"
                            : "bg-bg-card border-border-ui text-text-muted hover:border-accent-primary/40 hover:text-text-primary"
                            }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {cat.name}
                        </Button>
                      );
                    })}
                  </div>
                )}

                {/* Inline Category Creation */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateCategory();
                      }
                    }}
                    placeholder={intl.formatMessage({ id: "category.name" })}
                    className="flex-1 bg-bg-input border border-border-ui rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary placeholder-text-muted-light transition-all duration-200"
                  />
                  <Button
                    type="button"
                    onClick={() => handleCreateCategory()}
                    disabled={isCreatingCategory || !newCategoryName.trim()}
                    variant="outline"
                    className="border-accent-primary/20 hover:border-accent-primary text-accent-primary disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-all h-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden md:inline">{intl.formatMessage({ id: "category.add" })}</span>
                  </Button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-ui transition-colors duration-200">
                <Button
                  type="button"
                  onClick={closeAddEditModal}
                  variant="ghost"
                  className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors cursor-pointer h-auto w-auto"
                >
                  {intl.formatMessage({ id: "button.cancel" })}
                </Button>
                <Button
                  type="submit"
                  disabled={isFormTextEmpty}
                  className="bg-gradient-to-r from-violet-600 to-indigo-400 hover:from-violet-750 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all cursor-pointer h-auto"
                >
                  {intl.formatMessage({ id: "button.save" })}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
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
                className="text-text-primary leading-relaxed rich-text-content break-words w-full selection:bg-accent-primary/20 my-auto pt-12"
                style={{ fontSize: `${readingFontSize}px` }}
                dangerouslySetInnerHTML={{ __html: readingPunchline.text }}
              />
            </div>
          </div>
        </div>
      )}

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
