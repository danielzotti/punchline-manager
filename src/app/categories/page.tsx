"use client";

import React, { useState } from "react";
import { useIntl } from "react-intl";
import { Plus, Edit2, Trash2 } from "lucide-react";
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
        <h2 className="text-lg font-bold text-white mb-2">
          {intl.formatMessage({ id: "category.manage" })}
        </h2>

        {/* Quick Add Form */}
        <form onSubmit={handleAddCategory} className="flex gap-2 bg-slate-900/50 p-4 border border-slate-850 rounded-xl">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={intl.formatMessage({ id: "category.name" })}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            className="bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            {intl.formatMessage({ id: "category.add" })}
          </button>
        </form>

        {/* List */}
        {loadingCategories ? (
          <div className="text-center text-slate-400 py-6">Loading...</div>
        ) : (
          <div className="bg-slate-900/30 border border-slate-850 rounded-xl divide-y divide-slate-800">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 flex items-center justify-between">
                {editingCategory?.id === cat.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-1 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
                    />
                    <button
                      onClick={() => handleUpdateCategory(cat.id)}
                      className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded-lg text-xs font-semibold"
                    >
                      {intl.formatMessage({ id: "button.save" })}
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg text-xs font-semibold"
                    >
                      {intl.formatMessage({ id: "button.cancel" })}
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-slate-200 font-medium text-sm">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setEditCategoryName(cat.name);
                        }}
                        className="p-1.5 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
