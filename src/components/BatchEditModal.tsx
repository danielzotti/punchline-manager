'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2, FolderPlus, Tags, MessageSquare, Settings } from 'lucide-react';
import { useIntl } from 'react-intl';
import { Button } from '@/components/ui/Button';
import SelectAutocomplete from '@/components/SelectAutocomplete';

interface BatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPunchlineIds: string[];
  statuses: any[];
  categories: any[];
  onSuccess: () => void;
  onAddToCollection: () => void;
  batchUpdateStatus: (arg: { ids: string[]; statusId: string | null }) => Promise<any>;
  batchUpdateNotes: (arg: { ids: string[]; notes: string | null }) => Promise<any>;
  batchDeletePunchlines: (ids: string[]) => Promise<any>;
  batchAddCategories: (arg: { ids: string[]; categoryIds: string[] }) => Promise<any>;
  batchRemoveCategories: (arg: { ids: string[]; categoryIds: string[] }) => Promise<any>;
  batchReplaceCategories: (arg: { ids: string[]; categoryIds: string[] }) => Promise<any>;
}

export default function BatchEditModal({
  isOpen,
  onClose,
  selectedPunchlineIds,
  statuses,
  categories,
  onSuccess,
  onAddToCollection,
  batchUpdateStatus,
  batchUpdateNotes,
  batchDeletePunchlines,
  batchAddCategories,
  batchRemoveCategories,
  batchReplaceCategories,
}: BatchEditModalProps) {
  const intl = useIntl();

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  // States
  const [selectedStatusId, setSelectedStatusId] = useState<string>('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categoryMode, setCategoryMode] = useState<'add' | 'remove' | 'replace'>('add');
  const [notesText, setNotesText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleUpdateStatus = async () => {
    try {
      setIsSubmitting(true);
      await batchUpdateStatus({
        ids: selectedPunchlineIds,
        statusId: selectedStatusId || null,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error batch updating status:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategories = async () => {
    try {
      setIsSubmitting(true);
      if (categoryMode === 'add') {
        await batchAddCategories({ ids: selectedPunchlineIds, categoryIds: selectedCategoryIds });
      } else if (categoryMode === 'remove') {
        await batchRemoveCategories({ ids: selectedPunchlineIds, categoryIds: selectedCategoryIds });
      } else if (categoryMode === 'replace') {
        await batchReplaceCategories({ ids: selectedPunchlineIds, categoryIds: selectedCategoryIds });
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error batch updating categories:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNotes = async () => {
    try {
      setIsSubmitting(true);
      await batchUpdateNotes({
        ids: selectedPunchlineIds,
        notes: notesText || null,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error batch updating notes:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSelected = async () => {
    const message = intl.formatMessage(
      { id: 'batch.confirm_delete', defaultMessage: 'Sei sicuro di voler eliminare {count} punchline selezionate?' },
      { count: selectedPunchlineIds.length }
    );
    if (confirm(message)) {
      try {
        setIsSubmitting(true);
        await batchDeletePunchlines(selectedPunchlineIds);
        onSuccess();
        onClose();
      } catch (err) {
        console.error('Error batch deleting punchlines:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4 animate-fade-in">
      <div className="bg-bg-card border-t md:border border-border-ui rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] animate-slide-up md:animate-fade-in transition-all duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border-ui flex items-center justify-between flex-shrink-0 transition-colors duration-200">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Settings className="w-5 h-5 text-accent-primary" />
              {intl.formatMessage({ id: 'batch.title', defaultMessage: 'Gestione in Batch' })}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {intl.formatMessage(
                { id: 'collections.item_count_plural', defaultMessage: '{count} elementi selezionati' },
                { count: selectedPunchlineIds.length }
              )}
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-text-muted hover:text-text-primary p-1.5 hover:bg-bg-input rounded-xl transition-colors cursor-pointer h-auto w-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:pb-6">


          {/* Section: Extra Operations (Collections & Delete) */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 py-5"
            >
              <Trash2 className="w-4 h-4" />
              <span>{intl.formatMessage({ id: 'batch.delete_selected', defaultMessage: 'Elimina Selezionate' })}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onAddToCollection();
                onClose();
              }}
              className="flex items-center justify-center gap-2 py-5"
            >
              <FolderPlus className="w-4 h-4 text-violet-500" />
              <span>{intl.formatMessage({ id: 'batch.add_to_collection', defaultMessage: 'Aggiungi a Raccolta' })}</span>
            </Button>
          </div>

          {/* Section: Status */}
          <div className="space-y-3 p-4 border border-border-ui rounded-2xl bg-bg-primary/30">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              {intl.formatMessage({ id: 'punchline.status', defaultMessage: 'Stato' })}
            </h4>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
              <div className="flex-1">
                <SelectAutocomplete
                  items={statuses}
                  multiple={false}
                  selectedId={selectedStatusId}
                  onChange={setSelectedStatusId}
                  placeholder={intl.formatMessage({ id: 'batch.status_no_change', defaultMessage: 'Nessun cambiamento' })}
                  noResultsMessage={intl.formatMessage({ id: 'status.no_results', defaultMessage: 'No statuses found' })}
                />
              </div>
              <Button
                onClick={handleUpdateStatus}
                disabled={isSubmitting}
                className="whitespace-nowrap"
              >
                {intl.formatMessage({ id: 'batch.update_status', defaultMessage: 'Aggiorna Stato' })}
              </Button>
            </div>
          </div>

          {/* Section: Categories */}
          <div className="space-y-3 p-4 border border-border-ui rounded-2xl bg-bg-primary/30">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              {intl.formatMessage({ id: 'punchline.categories', defaultMessage: 'Categorie' })}
            </h4>
            <div className="space-y-3">
              {/* Mode Selection */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-bg-input rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setCategoryMode('add')}
                  className={`py-1.5 rounded-lg transition-all text-center ${categoryMode === 'add'
                    ? 'bg-bg-card text-accent-primary shadow-sm font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                    }`}
                >
                  {intl.formatMessage({ id: 'batch.category_mode_add', defaultMessage: 'Aggiungi' })}
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryMode('remove')}
                  className={`py-1.5 rounded-lg transition-all text-center ${categoryMode === 'remove'
                    ? 'bg-bg-card text-accent-primary shadow-sm font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                    }`}
                >
                  {intl.formatMessage({ id: 'batch.category_mode_remove', defaultMessage: 'Rimuovi' })}
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryMode('replace')}
                  className={`py-1.5 rounded-lg transition-all text-center ${categoryMode === 'replace'
                    ? 'bg-bg-card text-accent-primary shadow-sm font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                    }`}
                >
                  {intl.formatMessage({ id: 'batch.category_mode_replace', defaultMessage: 'Sostituisci' })}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                <div className="flex-1">
                  <SelectAutocomplete
                    items={categories}
                    multiple={true}
                    selectedIds={selectedCategoryIds}
                    onChange={setSelectedCategoryIds}
                    placeholder={intl.formatMessage({ id: 'category.search_placeholder', defaultMessage: 'Search categories...' })}
                    noResultsMessage={intl.formatMessage({ id: 'category.no_results', defaultMessage: 'No categories found' })}
                  />
                </div>
                <Button
                  onClick={handleUpdateCategories}
                  disabled={isSubmitting || selectedCategoryIds.length === 0}
                  className="whitespace-nowrap"
                >
                  {intl.formatMessage({ id: 'batch.update_categories', defaultMessage: 'Aggiorna Categorie' })}
                </Button>
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <div className="space-y-3 p-4 border border-border-ui rounded-2xl bg-bg-primary/30">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {intl.formatMessage({ id: 'punchline.notes', defaultMessage: 'Note' })}
            </h4>
            <div className="space-y-3">
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder={intl.formatMessage({ id: 'batch.notes_placeholder', defaultMessage: 'Inserisci una nota...' })}
                className="w-full min-h-[80px] p-3 text-sm rounded-xl border border-border-ui bg-bg-input focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent text-text-primary"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleUpdateNotes}
                  disabled={isSubmitting}
                >
                  {intl.formatMessage({ id: 'batch.update_notes', defaultMessage: 'Aggiorna Note' })}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
