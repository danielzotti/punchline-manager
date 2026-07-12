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
  X 
} from "lucide-react";

export default function PunchlinesPage() {
  const intl = useIntl();

  // Filter States
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState<string>("");

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
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={intl.formatMessage({ id: "filter.search" })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {/* Status Dropdown Filter */}
              <select
                value={selectedStatusId}
                onChange={(e) => setSelectedStatusId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="">{intl.formatMessage({ id: "filter.all_statuses" })}</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>

              {/* Reset Filters */}
              {(searchInput || selectedCategoryIds.length > 0 || selectedStatusId) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors border border-slate-880 rounded-xl hover:bg-slate-800/50 cursor-pointer"
                >
                  {intl.formatMessage({ id: "filter.clear" })}
                </button>
              )}

              {/* Create Button */}
              <button
                onClick={() => handleOpenPunchlineModal()}
                className="bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-violet-600/15 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {intl.formatMessage({ id: "button.add_punchline" })}
              </button>
            </div>
          </div>

          {/* Autocomplete Category Filter */}
          <div className="pt-2 border-t border-slate-850">
            <span className="text-xs font-semibold text-slate-400 block mb-2">
              {intl.formatMessage({ id: "filter.category" })}:
            </span>
            <CategoryAutocomplete
              categories={categories}
              selectedCategoryIds={selectedCategoryIds}
              onChange={setSelectedCategoryIds}
              placeholder={intl.formatMessage({ id: "filter.search" }) + " categorie..."}
            />
          </div>
        </div>

        {/* List of punchlines */}
        {loadingPunchlines ? (
          <div className="py-16 text-center text-slate-400">Loading...</div>
        ) : punchlines.length === 0 ? (
          <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl py-16 px-4 text-center">
            <p className="text-slate-400 text-sm">
              {intl.formatMessage({ id: "punchline.no_results" })}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {punchlines.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm group"
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
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenPunchlineModal(item)}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                        title={intl.formatMessage({ id: "button.edit" })}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePunchline(item.id)}
                        className="p-1.5 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        title={intl.formatMessage({ id: "button.delete" })}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                    <div className="mb-4 bg-slate-950/50 rounded-xl p-3 border border-slate-850">
                      <span className="text-slate-500 font-semibold text-[10px] uppercase block mb-1">
                        {intl.formatMessage({ id: "punchline.notes" })}:
                      </span>
                      <p className="text-xs text-slate-400 italic">{item.notes}</p>
                    </div>
                  )}
                </div>

                {/* Category Tags */}
                {item.punchline_categories && item.punchline_categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60">
                    {item.punchline_categories.map((pc) => (
                      <span
                        key={pc.id}
                        className="bg-slate-850 text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-medium border border-slate-800"
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

      {/* Punchline Creation/Editing Modal */}
      {isPunchlineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-850 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingPunchline 
                  ? intl.formatMessage({ id: "punchline.edit_title" }) 
                  : intl.formatMessage({ id: "punchline.create_title" })}
              </h3>
              <button
                onClick={() => setIsPunchlineModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePunchline} className="p-6 space-y-4">
              {/* Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {intl.formatMessage({ id: "punchline.text" })} *
                </label>
                <RichTextEditor value={punchlineText} onChange={setPunchlineText} />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {intl.formatMessage({ id: "punchline.notes" })}
                </label>
                <input
                  type="text"
                  value={punchlineNotes}
                  onChange={(e) => setPunchlineNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500 placeholder-slate-600"
                  placeholder="Note, contestualizzazione o suggerimenti..."
                />
              </div>

              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {intl.formatMessage({ id: "punchline.status" })}
                </label>
                <select
                  value={punchlineStatusId}
                  onChange={(e) => setPunchlineStatusId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-250 focus:outline-none focus:border-violet-500"
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
                  <label className="text-xs font-semibold text-slate-300 block">
                    {intl.formatMessage({ id: "punchline.categories" })}
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1.5 border border-slate-800 bg-slate-950 rounded-xl">
                    {categories.map((cat) => {
                      const isSelected = punchlineCategoryIds.includes(cat.id);
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => toggleFormCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? "bg-violet-600/20 border-violet-500 text-violet-300"
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
                  className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-violet-600/15 transition-all cursor-pointer"
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
