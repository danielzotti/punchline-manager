"use client";

import React, { useState } from "react";
import { useIntl } from "react-intl";
import { Plus, Edit2, Trash2, Tag } from "lucide-react";
import { useCategories, Category } from "@/hooks/useCategories";

export default function CategoriesPage() {
  const intl = useIntl();

  // Category State
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  const {
    categories,
    isLoading: loadingCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  // Add Category Handler
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await createCategory(newCategoryName.trim());
      setNewCategoryName("");
    } catch (err) {
      console.error(err);
    }
  };

  // Update Category Handler
  const handleUpdateCategory = async (id: string) => {
    if (!editCategoryName.trim()) return;
    try {
      await updateCategory({ id, name: editCategoryName.trim() });
      setEditingCategory(null);
      setEditCategoryName("");
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Category Handler
  const handleDeleteCategory = async (id: string) => {
    if (confirm(intl.formatMessage({ id: "confirm.delete" }))) {
      await deleteCategory(id);
    }
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Title Section */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-violet-600 to-indigo-500 p-2 rounded-xl text-white shadow-lg shadow-violet-500/20">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              {intl.formatMessage({ id: "category.manage" })}
            </h2>
            <p className="text-xs text-slate-400">
              Crea e organizza le etichette per catalogare le tue battute.
            </p>
          </div>
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleAddCategory} className="flex gap-2.5 bg-slate-900/40 backdrop-blur-md p-4 border border-slate-800/80 rounded-2xl shadow-lg shadow-slate-950/10">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={intl.formatMessage({ id: "category.name" })}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-700 hover:to-indigo-750 text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-violet-600/15 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">{intl.formatMessage({ id: "category.add" })}</span>
          </button>
        </form>

        {/* List */}
        {loadingCategories ? (
          <div className="text-center text-slate-400 py-12">Loading...</div>
        ) : (
          <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/80 rounded-2xl divide-y divide-slate-800/70 overflow-hidden shadow-lg shadow-slate-950/15">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-900/10 transition-colors group">
                {editingCategory?.id === cat.id ? (
                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleUpdateCategory(cat.id)}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow shadow-violet-600/15 transition-colors cursor-pointer"
                      >
                        {intl.formatMessage({ id: "button.save" })}
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {intl.formatMessage({ id: "button.cancel" })}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      <span className="text-slate-200 font-medium text-sm">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setEditCategoryName(cat.name);
                        }}
                        className="p-2 md:p-1.5 bg-slate-800/40 md:bg-transparent hover:bg-slate-800 text-slate-300 md:text-slate-400 hover:text-slate-100 rounded-lg transition-colors cursor-pointer"
                        title={intl.formatMessage({ id: "button.edit" })}
                      >
                        <Edit2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 md:p-1.5 bg-slate-800/40 md:bg-transparent hover:bg-red-950/45 text-slate-350 md:text-slate-450 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        title={intl.formatMessage({ id: "button.delete" })}
                      >
                        <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
