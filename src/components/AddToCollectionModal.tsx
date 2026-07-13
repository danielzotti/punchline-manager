'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { getCollections, createCollection, updateCollectionItems, getCollectionById } from '@/app/actions/collections';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

interface AddToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPunchlineIds: string[];
  onSuccess: () => void;
}

export default function AddToCollectionModal({ isOpen, onClose, selectedPunchlineIds, onSuccess }: AddToCollectionModalProps) {
  const intl = useIntl();
  const router = useRouter();
  const { error, info } = useToast();
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen]);

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

  const loadCollections = async () => {
    try {
      setIsLoading(true);
      const data = await getCollections();
      setCollections(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSaving) return;

    try {
      setIsSaving(true);
      const newCol = await createCollection(newTitle, new Date().toISOString());
      if (newCol) {
        await handleAddToCollection(newCol.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
      setIsCreating(false);
      setNewTitle('');
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      // Fetch existing items to append to them
      const collection = await getCollectionById(collectionId);
      const existingItems = collection.collection_items || [];
      const existingPunchlineIds = new Set(
        existingItems
          .filter((item: any) => item.item_type === 'punchline')
          .map((item: any) => item.punchline_id)
      );

      const uniqueSelectedIds = Array.from(new Set(selectedPunchlineIds)).filter(
        (id) => !existingPunchlineIds.has(id)
      );

      if (uniqueSelectedIds.length === 0) {
        error(intl.formatMessage({ id: 'collections.error_all_duplicates' }));
        setIsSaving(false);
        return;
      }

      if (uniqueSelectedIds.length < Array.from(new Set(selectedPunchlineIds)).length) {
        info(intl.formatMessage({ id: 'collections.info_duplicates_skipped' }));
      }

      const newItems = uniqueSelectedIds.map((id, index) => ({
        collection_id: collectionId,
        position: existingItems.length + index,
        item_type: 'punchline',
        punchline_id: id,
        text_content: null
      }));
      
      await updateCollectionItems(collectionId, [...existingItems, ...newItems]);
      onSuccess();
      onClose();
      router.push(`/collections/${collectionId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-bg-card border border-border-ui rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-slide-up">
        <div className="px-6 py-4 border-b border-border-ui flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">{intl.formatMessage({ id: 'collections.add_to_collection' })}</h3>
          <Button onClick={onClose} variant="ghost" size="icon" className="text-text-muted hover:text-text-primary p-1.5 hover:bg-bg-input rounded-xl transition-colors h-auto w-auto">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {!isCreating ? (
            <>
              <Button
                onClick={() => setIsCreating(true)}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-accent-primary text-accent-primary rounded-xl font-semibold hover:bg-accent-primary/10 transition-colors h-auto justify-center"
              >
                <Plus className="w-5 h-5" /> {intl.formatMessage({ id: 'collections.new_collection' })}
              </Button>

              <div className="flex flex-col gap-2 mt-4">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{intl.formatMessage({ id: 'collections.existing_collections' })}</span>
                {isLoading ? (
                  <p className="text-text-muted text-sm text-center py-4">{intl.formatMessage({ id: 'common.loading' })}</p>
                ) : collections.length === 0 ? (
                  <p className="text-text-muted text-sm text-center py-4">{intl.formatMessage({ id: 'collections.no_collections_modal' })}</p>
                ) : (
                  collections.map(c => {
                    const itemCount = c.collection_items[0]?.count || 0;
                    return (
                      <Button
                        key={c.id}
                        disabled={isSaving}
                        onClick={() => handleAddToCollection(c.id)}
                        variant="ghost"
                        className="flex items-center justify-between p-4 bg-bg-input hover:bg-bg-input/80 border border-border-ui rounded-xl text-left transition-colors h-auto w-full font-normal"
                      >
                        <div className="text-left">
                          <p className="font-semibold text-text-primary">{c.title}</p>
                          <p className="text-xs text-text-muted">
                            {new Date(c.date).toLocaleDateString()} • {intl.formatMessage(
                              { id: itemCount === 1 ? 'collections.item_count_singular' : 'collections.item_count_plural' },
                              { count: itemCount }
                            )}
                          </p>
                        </div>
                        <Plus className="w-4 h-4 text-accent-primary" />
                      </Button>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <form onSubmit={handleCreateAndAdd} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                  {intl.formatMessage({ id: 'collections.new_collection_title' })}
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-bg-input border border-border-ui rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                  placeholder={intl.formatMessage({ id: 'collections.new_collection_placeholder' })}
                />
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <Button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  variant="ghost"
                  className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors h-auto w-auto"
                >
                  {intl.formatMessage({ id: 'button.cancel' })}
                </Button>
                <Button
                  type="submit"
                  disabled={!newTitle.trim() || isSaving}
                  className="bg-accent-primary text-white font-semibold text-sm px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50 h-auto w-auto"
                >
                  {intl.formatMessage({ id: 'collections.create_and_add' })}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
