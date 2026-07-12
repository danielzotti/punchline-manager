"use client";

import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { usePunchlines, Punchline } from "@/hooks/usePunchlines";
import { useCategories } from "@/hooks/useCategories";
import { useStatuses } from "@/hooks/useStatuses";
import RichTextEditor from "@/components/RichTextEditor";
import CategoryAutocomplete from "@/components/CategoryAutocomplete";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  SlidersHorizontal
} from "lucide-react";

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
    deletePunchline
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
    setIsPunchlineModalOpen(true);
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
      setIsPunchlineModalOpen(false);
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

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 pb-22 transition-colors duration-200">
      <div className="space-y-6">
        {/* Filters panel */}
        <div className="relative z-30 bg-bg-card/50 backdrop-blur-md border border-border-ui rounded-2xl p-4 md:p-6 space-y-4 shadow-sm md:sticky md:top-20 transition-all duration-200">
          <div className="flex flex-row gap-2.5 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={intl.formatMessage({ id: "filter.search" })}
                className="w-full bg-bg-input border border-border-ui rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted-light focus:outline-none focus:border-accent-primary transition-all duration-200"
              />
            </div>

            {/* Mobile Filter Toggle & Add Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className={`md:hidden p-2.5 border rounded-xl flex items-center justify-center transition-all cursor-pointer ${selectedStatusId || selectedCategoryIds.length > 0
                  ? "bg-accent-primary/10 border-accent-primary text-accent-primary"
                  : "bg-bg-input border-border-ui text-text-muted active:bg-bg-card"
                  }`}
                title="Filtri"
              >
                <SlidersHorizontal className="w-5 h-5" />
                {(selectedStatusId || selectedCategoryIds.length > 0) && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                )}
              </button>

              {/* Desktop Create Button */}
              <button
                onClick={() => handleOpenPunchlineModal()}
                className="hidden md:flex bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-750 hover:to-indigo-800 text-white font-semibold text-sm px-4 py-2.5 rounded-xl items-center gap-2 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {intl.formatMessage({ id: "button.add_punchline" })}
              </button>
            </div>
          </div>

          {/* Collapsible / Advanced Filters */}
          <div className={`${isFiltersExpanded ? "flex" : "hidden md:flex"} flex-col md:flex-row gap-4 pt-3 border-t border-border-ui md:items-start justify-between transition-all animate-fade-in`}>
            {/* Status Dropdown */}
            <div className="flex-1 max-w-xs">
              <span className="text-[10px] font-bold text-text-muted uppercase block mb-1.5 tracking-wider">
                {intl.formatMessage({ id: "filter.status" })}:
              </span>
              <select
                value={selectedStatusId}
                onChange={(e) => setSelectedStatusId(e.target.value)}
                className="w-full bg-bg-input border border-border-ui rounded-xl py-2.5 px-4 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors duration-200"
              >
                <option value="">{intl.formatMessage({ id: "filter.all_statuses" })}</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex-1 md:mx-4">
              <span className="text-[10px] font-bold text-text-muted uppercase block mb-1.5 tracking-wider">
                {intl.formatMessage({ id: "filter.category" })}:
              </span>
              <CategoryAutocomplete
                categories={categories}
                selectedCategoryIds={selectedCategoryIds}
                onChange={setSelectedCategoryIds}
                placeholder={intl.formatMessage({ id: "filter.search" }) + " categorie..."}
              />
            </div>

            {/* Clear Button */}
            <div className="flex items-end justify-end pt-4 md:pt-0">
              {(searchInput || selectedCategoryIds.length > 0 || selectedStatusId) && (
                <button
                  onClick={clearFilters}
                  className="w-full md:w-auto px-4 py-2.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors border border-border-ui rounded-xl hover:bg-bg-input cursor-pointer"
                >
                  {intl.formatMessage({ id: "filter.clear" })}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List of punchlines */}
        {loadingPunchlines ? (
          <div className="py-16 text-center text-text-muted">Loading...</div>
        ) : punchlines.length === 0 ? (
          <div className="bg-bg-card/20 border border-dashed border-border-ui rounded-2xl py-16 px-4 text-center">
            <p className="text-text-muted text-sm">
              {intl.formatMessage({ id: "punchline.no_results" })}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {punchlines.map((item) => (
              <div
                key={item.id}
                className="bg-bg-card border border-border-ui rounded-2xl p-6 flex flex-col justify-between hover:border-accent-primary/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-sm group"
              >
                <div>
                  {/* Card Header Status & Actions */}
                  <div className="flex items-center justify-between mb-4">
                    {item.status ? (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm"
                        style={{
                          backgroundColor: `${item.status.color}15`,
                          color: item.status.color,
                          borderColor: `${item.status.color}30`,
                        }}
                      >
                        {item.status.name}
                      </span>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleOpenPunchlineModal(item)}
                        className="p-2 md:p-1.5 bg-bg-input/60 md:bg-transparent hover:bg-bg-input text-text-muted hover:text-text-primary rounded-lg transition-colors cursor-pointer"
                        title={intl.formatMessage({ id: "button.edit" })}
                      >
                        <Edit2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePunchline(item.id)}
                        className="p-2 md:p-1.5 bg-bg-input/60 md:bg-transparent hover:bg-red-500/10 text-text-muted hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        title={intl.formatMessage({ id: "button.delete" })}
                      >
                        <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Text (HTML Rendered) */}
                  <div
                    className="text-text-primary font-medium text-base mb-4 leading-relaxed rich-text-content"
                    dangerouslySetInnerHTML={{ __html: item.text }}
                  />

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
                        className="bg-bg-input text-text-muted px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border border-border-ui"
                      >
                        {pc.category?.name || "..."}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (Mobile Only) */}
      <button
        onClick={() => handleOpenPunchlineModal()}
        className="md:hidden fixed bottom-24 right-6 z-45 bg-gradient-to-tr from-violet-600 to-indigo-650 text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all border border-accent-primary/20 cursor-pointer"
        title={intl.formatMessage({ id: "button.add_punchline" })}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Punchline Creation/Editing Modal & Mobile Bottom Sheet */}
      {isPunchlineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4 animate-fade-in">
          <div className="bg-bg-card border-t md:border border-border-ui rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] md:max-h-none animate-slide-up md:animate-fade-in transition-all duration-200">
            {/* Modal Drag Handle for mobile */}
            <div className="w-12 h-1 bg-border-ui rounded-full mx-auto my-3 md:hidden flex-shrink-0" />

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border-ui flex items-center justify-between flex-shrink-0 transition-colors duration-200">
              <h3 className="text-lg font-bold text-text-primary">
                {editingPunchline
                  ? intl.formatMessage({ id: "punchline.edit_title" })
                  : intl.formatMessage({ id: "punchline.create_title" })}
              </h3>
              <button
                onClick={() => setIsPunchlineModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1.5 hover:bg-bg-input rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
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
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => toggleFormCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${isSelected
                            ? "bg-accent-primary/10 border-accent-primary text-accent-primary shadow-sm"
                            : "bg-bg-card border-border-ui text-text-muted hover:border-accent-primary/40 hover:text-text-primary"
                            }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {cat.name}
                        </button>
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
                  <button
                    type="button"
                    onClick={() => handleCreateCategory()}
                    disabled={isCreatingCategory || !newCategoryName.trim()}
                    className="bg-accent-primary/10 border border-accent-primary/20 hover:border-accent-primary text-accent-primary disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden md:inline">{intl.formatMessage({ id: "category.add" })}</span>
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-ui transition-colors duration-200">
                <button
                  type="button"
                  onClick={() => setIsPunchlineModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  {intl.formatMessage({ id: "button.cancel" })}
                </button>
                <button
                  type="submit"
                  disabled={isFormTextEmpty}
                  className="bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-750 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  {intl.formatMessage({ id: "button.save" })}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
