"use client";

import React, { useState } from "react";
import { useIntl } from "react-intl";
import { Plus, Edit2, Trash2, Tag } from "lucide-react";
import { useCategories, Category } from "@/hooks/useCategories";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";

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
      console.error("Error creating category:", err);
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
      console.error("Error updating category:", err);
    }
  };

  // Delete Category Handler
  const handleDeleteCategory = async (id: string) => {
    if (!confirm(intl.formatMessage({ id: "confirm.delete" }))) return;
    try {
      await deleteCategory(id);
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 transition-colors duration-200">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          title={intl.formatMessage({ id: "category.manage" })}
          description={intl.formatMessage({ id: "category.subtitle", defaultMessage: "Create and organize labels to catalog your jokes." })}
          icon={<Tag />}
        />

        {/* Quick Add Form */}
        <form
          onSubmit={handleAddCategory}
          className="flex flex-row gap-3 bg-bg-card p-4 border border-border-ui rounded-2xl items-center shadow-sm transition-all duration-200"
        >
          <div className="w-full">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={intl.formatMessage({ id: "category.name" })}
              className="w-full bg-bg-input border border-border-ui rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted-light focus:outline-none focus:border-accent-primary transition-all duration-200"
            />
          </div>
          <Button
            type="submit"
            className="ml-auto sm:ml-0 md:min-w-[150px] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">{intl.formatMessage({ id: "category.add" })}</span>
          </Button>
        </form>

        {/* List */}
        {loadingCategories ? (
          <div className="text-center text-text-muted py-12">{intl.formatMessage({ id: "common.loading", defaultMessage: "Loading..." })}</div>
        ) : (
          <div className="bg-bg-card border border-border-ui rounded-2xl divide-y divide-border-ui overflow-hidden shadow-sm transition-all duration-200">
            {categories.map((cat, index) => (
              <div
                key={cat.id}
                className="p-4 flex items-center justify-between transition-colors duration-200 group hover:bg-bg-input/30"
              >
                {editingCategory?.id === cat.id ? (
                  <div className="flex-1 flex flex-col sm:flex-row gap-3 items-center">
                    <input
                      type="text"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      className="w-full sm:flex-1 bg-bg-input border border-border-ui rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-all duration-200"
                    />
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <Button
                        onClick={() => handleUpdateCategory(cat.id)}
                        variant="default"
                        size="sm"
                      >
                        {intl.formatMessage({ id: "button.save" })}
                      </Button>
                      <Button
                        onClick={() => setEditingCategory(null)}
                        variant="outline"
                        size="sm"
                      >
                        {intl.formatMessage({ id: "button.cancel" })}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3.5 select-none">
                      <span className="text-[10px] text-text-muted-light font-mono w-5">
                        {index + 1}.
                      </span>
                      <span className="text-text-primary font-medium text-sm break-all">
                        {cat.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        onClick={() => {
                          setEditingCategory(cat);
                          setEditCategoryName(cat.name);
                        }}
                        variant="ghost"
                        size="icon"
                        className="hover:bg-bg-input text-text-muted hover:text-text-primary rounded-lg transition-colors cursor-pointer"
                        title={intl.formatMessage({ id: "button.edit" })}
                      >
                        <Edit2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteCategory(cat.id)}
                        variant="ghost"
                        size="icon"
                        className="hover:bg-red-500/10 text-text-muted hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        title={intl.formatMessage({ id: "button.delete" })}
                      >
                        <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {categories.length === 0 && (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-bg-card">
                <div className="bg-bg-input p-3 rounded-full text-text-muted">
                  <Tag className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-text-primary">
                  {intl.formatMessage({ id: "category.no_categories" })}
                </h3>
                <p className="text-xs text-text-muted max-w-xs">
                  {intl.formatMessage({ id: "category.no_categories_description" })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
