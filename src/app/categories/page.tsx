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
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 transition-colors duration-200">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Title Section */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-violet-600 to-indigo-500 p-2 rounded-xl text-white shadow-lg shadow-violet-500/20">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary leading-tight">
              {intl.formatMessage({ id: "category.manage" })}
            </h2>
            <p className="text-xs text-text-muted">
              {intl.formatMessage({ id: "category.subtitle", defaultMessage: "Create and organize labels to catalog your jokes." })}
            </p>
          </div>
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleAddCategory} className="flex gap-2.5 items-center bg-bg-card p-4 border border-border-ui rounded-2xl shadow-sm transition-all duration-200">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={intl.formatMessage({ id: "category.name" })}
            className="flex-1 bg-bg-input border border-border-ui rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted-light focus:outline-none focus:border-accent-primary transition-all duration-200"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-violet-600 to-indigo-400 hover:from-violet-750 hover:to-indigo-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">{intl.formatMessage({ id: "category.add" })}</span>
          </button>
        </form>

        {/* List */}
        {loadingCategories ? (
          <div className="text-center text-text-muted py-12">{intl.formatMessage({ id: "common.loading", defaultMessage: "Loading..." })}</div>
        ) : (
          <div className="bg-bg-card border border-border-ui rounded-2xl divide-y divide-border-ui overflow-hidden shadow-sm transition-all duration-200">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-bg-input/30 transition-colors duration-200 group">
                {editingCategory?.id === cat.id ? (
                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      className="flex-1 bg-bg-input border border-border-ui rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-all duration-200"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleUpdateCategory(cat.id)}
                        className="bg-accent-primary hover:bg-accent-hover text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                      >
                        {intl.formatMessage({ id: "button.save" })}
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="bg-bg-input hover:bg-bg-card border border-border-ui text-text-muted hover:text-text-primary px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {intl.formatMessage({ id: "button.cancel" })}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                      <span className="text-text-primary font-medium text-sm">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setEditCategoryName(cat.name);
                        }}
                        className="p-2 md:p-1.5 bg-bg-input/60 md:bg-transparent hover:bg-bg-input text-text-muted hover:text-text-primary rounded-lg transition-colors cursor-pointer"
                        title={intl.formatMessage({ id: "button.edit" })}
                      >
                        <Edit2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 md:p-1.5 bg-bg-input/60 md:bg-transparent hover:bg-red-500/10 text-text-muted hover:text-red-500 rounded-lg transition-colors cursor-pointer"
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
