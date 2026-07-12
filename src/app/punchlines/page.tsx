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

  const { categories } = useCategories();
  const { statuses } = useStatuses();

  // Modal States
  const [isPunchlineModalOpen, setIsPunchlineModalOpen] = useState(false);
  const [editingPunchline, setEditingPunchline] = useState<Punchline | null>(null);

  // Form States
  const [punchlineText, setPunchlineText] = useState("");
  const [punchlineNotes, setPunchlineNotes] = useState("");
  const [punchlineStatusId, setPunchlineStatusId] = useState("");
  const [punchlineCategoryIds, setPunchlineCategoryIds] = useState<string[]>([]);

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

  const isFormTextEmpty = !punchlineText || punchlineText.replace(/<[^>]*>/g, "").trim() === "";

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Filters panel */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 md:p-6 space-y-4 shadow-lg shadow-slate-950/20">
          <div className="flex flex-row gap-2.5 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={intl.formatMessage({ id: "filter.search" })}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Mobile Filter Toggle & Add Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className={`md:hidden p-2.5 border rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  selectedStatusId || selectedCategoryIds.length > 0
                    ? "bg-violet-600/10 border-violet-500 text-violet-400"
                    : "bg-slate-950 border-slate-800 text-slate-400 active:bg-slate-900"
                }`}
                title="Filtri"
              >
                <SlidersHorizontal className="w-5 h-5" />
                {(selectedStatusId || selectedCategoryIds.length > 0) && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-violet-505 animate-pulse" />
                )}
              </button>
              
              {/* Desktop Create Button */}
              <button
                onClick={() => handleOpenPunchlineModal()}
                className="hidden md:flex bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl items-center gap-2 shadow-lg shadow-violet-600/20 transition-all hover:shadow-violet-600/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {intl.formatMessage({ id: "button.add_punchline" })}
              </button>
            </div>
          </div>

          {/* Collapsible / Advanced Filters */}
          <div className={`${isFiltersExpanded ? "flex" : "hidden md:flex"} flex-col md:flex-row gap-4 pt-3 border-t border-slate-800/85 md:items-center justify-between transition-all animate-fade-in`}>
            {/* Status Dropdown */}
            <div className="flex-1 max-w-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 tracking-wider">
                {intl.formatMessage({ id: "filter.status" })}:
              </span>
              <select
                value={selectedStatusId}
                onChange={(e) => setSelectedStatusId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-violet-500/80 transition-colors"
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
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 tracking-wider">
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
                  className="w-full md:w-auto px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors border border-slate-805 rounded-xl hover:bg-slate-800/40 cursor-pointer"
                >
                  {intl.formatMessage({ id: "filter.clear" })}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List of punchlines */}
        {loadingPunchlines ? (
          <div className="py-16 text-center text-slate-400">Loading...</div>
        ) : punchlines.length === 0 ? (
          <div className="bg-slate-900/10 border border-dashed border-slate-800/85 rounded-2xl py-16 px-4 text-center">
            <p className="text-slate-400 text-sm">
              {intl.formatMessage({ id: "punchline.no_results" })}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {punchlines.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-950/5 shadow-sm group"
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
                    <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenPunchlineModal(item)}
                        className="p-2 md:p-1.5 bg-slate-800/50 md:bg-transparent hover:bg-slate-800 text-slate-300 md:text-slate-400 hover:text-slate-100 rounded-lg transition-colors cursor-pointer"
                        title={intl.formatMessage({ id: "button.edit" })}
                      >
                        <Edit2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePunchline(item.id)}
                        className="p-2 md:p-1.5 bg-slate-800/50 md:bg-transparent hover:bg-red-950/40 text-slate-350 md:text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        title={intl.formatMessage({ id: "button.delete" })}
                      >
                        <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Text (HTML Rendered) */}
                  <div 
                    className="text-slate-100 font-medium text-base mb-4 leading-relaxed rich-text-content"
                    dangerouslySetInnerHTML={{ __html: item.text }}
                  />

                  {/* Notes if any */}
                  {item.notes && (
                    <div className="mb-4 bg-slate-950/40 rounded-r-xl p-3 border-l-2 border-violet-500 border-y border-r border-slate-900/60">
                      <span className="text-slate-500 font-bold text-[9px] uppercase block mb-1 tracking-wider">
                        {intl.formatMessage({ id: "punchline.notes" })}:
                      </span>
                      <p className="text-xs text-slate-300 italic">{item.notes}</p>
                    </div>
                  )}
                </div>

                {/* Category Tags */}
                {item.punchline_categories && item.punchline_categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-slate-800/60">
                    {item.punchline_categories.map((pc) => (
                      <span
                        key={pc.id}
                        className="bg-slate-950/80 text-slate-400 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border border-slate-850/80"
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
        className="md:hidden fixed bottom-20 right-6 z-40 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl shadow-violet-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all border border-violet-500/30 cursor-pointer"
        title={intl.formatMessage({ id: "button.add_punchline" })}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Punchline Creation/Editing Modal & Mobile Bottom Sheet */}
      {isPunchlineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/75 backdrop-blur-sm p-0 md:p-4 animate-fade-in">
          <div className="bg-slate-900 border-t md:border border-slate-800/80 rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] md:max-h-none animate-slide-up md:animate-fade-in">
            {/* Modal Drag Handle for mobile */}
            <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto my-3 md:hidden flex-shrink-0" />
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-850 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-bold text-white">
                {editingPunchline 
                  ? intl.formatMessage({ id: "punchline.edit_title" }) 
                  : intl.formatMessage({ id: "punchline.create_title" })}
              </h3>
              <button
                onClick={() => setIsPunchlineModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePunchline} className="flex-1 overflow-y-auto p-6 space-y-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:pb-6">
              {/* Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {intl.formatMessage({ id: "punchline.text" })} *
                </label>
                <RichTextEditor value={punchlineText} onChange={setPunchlineText} />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {intl.formatMessage({ id: "punchline.notes" })}
                </label>
                <input
                  type="text"
                  value={punchlineNotes}
                  onChange={(e) => setPunchlineNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500 placeholder-slate-650 focus:shadow-[0_0_12px_rgba(139,92,246,0.06)]"
                  placeholder="Note, contestualizzazione o suggerimenti..."
                />
              </div>

              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {intl.formatMessage({ id: "punchline.status" })}
                </label>
                <select
                  value={punchlineStatusId}
                  onChange={(e) => setPunchlineStatusId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-205 focus:outline-none focus:border-violet-500"
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
              {categories.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase block tracking-wider">
                    {intl.formatMessage({ id: "punchline.categories" })}
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 border border-slate-800 bg-slate-950 rounded-xl">
                    {categories.map((cat) => {
                      const isSelected = punchlineCategoryIds.includes(cat.id);
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => toggleFormCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? "bg-violet-600/20 border-violet-500 text-violet-300 shadow-sm"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsPunchlineModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {intl.formatMessage({ id: "button.cancel" })}
                </button>
                <button
                  type="submit"
                  disabled={isFormTextEmpty}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-violet-600/15 transition-all cursor-pointer"
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
