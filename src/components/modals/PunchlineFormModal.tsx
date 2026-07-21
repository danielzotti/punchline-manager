"use client";

import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { X, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import RichTextEditor from "@/components/RichTextEditor";
import { Modal } from "@/components/ui/Modal";
import { Punchline } from "@/hooks/usePunchlines";

interface Category {
  id: string;
  name: string;
}

interface Status {
  id: string;
  name: string;
  color: string;
}

interface PunchlineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPunchline: Punchline | null;
  statuses: Status[];
  categories: Category[];
  onCreateCategory: (name: string) => Promise<Category>;
  onSave: (data: {
    text: string;
    status_id: string;
    category_ids: string[];
    notes: string;
  }) => Promise<void>;
}

export function PunchlineFormModal({
  isOpen,
  onClose,
  editingPunchline,
  statuses,
  categories,
  onCreateCategory,
  onSave,
}: PunchlineFormModalProps) {
  const intl = useIntl();

  const [punchlineText, setPunchlineText] = useState("");
  const [punchlineNotes, setPunchlineNotes] = useState("");
  const [punchlineStatusId, setPunchlineStatusId] = useState("");
  const [punchlineCategoryIds, setPunchlineCategoryIds] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync form states with editingPunchline
  useEffect(() => {
    if (editingPunchline) {
      setPunchlineText(editingPunchline.text);
      setPunchlineNotes(editingPunchline.notes || "");
      setPunchlineStatusId(editingPunchline.status_id || "");
      setPunchlineCategoryIds(editingPunchline.punchline_categories?.map((c) => c.category_id) || []);
    } else {
      setPunchlineText("");
      setPunchlineNotes("");
      setPunchlineStatusId("");
      setPunchlineCategoryIds([]);
    }
  }, [editingPunchline, isOpen]);

  const toggleFormCategory = (id: string) => {
    setPunchlineCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id]
    );
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || isCreatingCategory) return;
    setIsCreatingCategory(true);
    try {
      const newCat = await onCreateCategory(newCategoryName.trim());
      setPunchlineCategoryIds((prev) => [...prev, newCat.id]);
      setNewCategoryName("");
    } catch (err) {
      console.error("Failed to create category:", err);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSavePunchline = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = punchlineText.replace(/<p><\/p>/g, "").trim();
    if (!cleanText || isSaving) return;

    setIsSaving(true);
    try {
      await onSave({
        text: punchlineText,
        status_id: punchlineStatusId,
        category_ids: punchlineCategoryIds,
        notes: punchlineNotes,
      });
      onClose();
    } catch (err) {
      console.error("Failed to save punchline:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormTextEmpty = !punchlineText.replace(/<p><\/p>/g, "").trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
      maxWidthClass="max-w-4xl"
      title={
        editingPunchline
          ? intl.formatMessage({ id: "punchline.edit_title" })
          : intl.formatMessage({ id: "punchline.create_title" })
      }
    >
      <form onSubmit={handleSavePunchline} className="space-y-5">
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

        {/* Status Selection (Checklist-like) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-muted uppercase block tracking-wider">
            {intl.formatMessage({ id: "punchline.status" })}
          </label>

          {statuses.length > 0 && (
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 border border-border-ui bg-bg-input rounded-xl transition-colors duration-200">
              {statuses.map((status) => {
                const isSelected = punchlineStatusId === status.id;
                return (
                  <Button
                    type="button"
                    key={status.id}
                    onClick={() => setPunchlineStatusId((prev) => (prev === status.id ? "" : status.id))}
                    variant="ghost"
                    style={{
                      color: status.color,
                      backgroundColor: isSelected ? `${status.color}15` : undefined,
                      borderColor: isSelected ? status.color : undefined,
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer h-auto w-auto font-normal ${
                      isSelected ? "shadow-sm" : "bg-bg-card border-border-ui hover:bg-bg-input/50"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {status.name}
                  </Button>
                );
              })}
            </div>
          )}
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer h-auto w-auto font-normal ${
                      isSelected
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
            onClick={onClose}
            variant="ghost"
            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors cursor-pointer h-auto w-auto"
          >
            {intl.formatMessage({ id: "button.cancel" })}
          </Button>
          <Button
            type="submit"
            disabled={isFormTextEmpty || isSaving}
            className="bg-gradient-to-r from-violet-600 to-indigo-400 hover:from-violet-750 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all cursor-pointer h-auto"
          >
            {intl.formatMessage({ id: "button.save" })}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
