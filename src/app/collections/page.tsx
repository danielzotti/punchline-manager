'use client';

import React, { useState, useEffect } from 'react';
import { getCollections, createCollection, deleteCollection } from '@/app/actions/collections';
import Link from 'next/link';
import { Library, Calendar, Layers, Plus, Trash2 } from 'lucide-react';
import { useIntl } from 'react-intl';

export default function CollectionsPage() {
  const intl = useIntl();
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setIsLoading(true);
      const data = await getCollections();
      setCollections(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionTitle.trim() || isSaving) return;
    try {
      setIsSaving(true);
      await createCollection(newCollectionTitle.trim(), new Date().toISOString());
      setNewCollectionTitle('');
      const data = await getCollections();
      setCollections(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (confirm(intl.formatMessage({ id: "confirm.delete" }))) {
      try {
        await deleteCollection(id);
        const data = await getCollections();
        setCollections(data || []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 transition-colors duration-200">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Title Section */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-violet-600 to-indigo-500 p-2 rounded-xl text-white shadow-lg shadow-violet-500/20">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary leading-tight">
              {intl.formatMessage({ id: "collections.title" })}
            </h2>
            <p className="text-xs text-text-muted">
              {intl.formatMessage({ id: "collections.subtitle" })}
            </p>
          </div>
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleAddCollection} className="flex flex-row gap-3 bg-bg-card p-4 border border-border-ui rounded-2xl items-center shadow-sm transition-all duration-200">
          <div className="w-full">
            <input
              type="text"
              value={newCollectionTitle}
              onChange={(e) => setNewCollectionTitle(e.target.value)}
              placeholder={intl.formatMessage({ id: "collections.new_collection_placeholder" })}
              className="w-full bg-bg-input border border-border-ui rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted-light focus:outline-none focus:border-accent-primary transition-all duration-200"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-gradient-to-r from-violet-600 to-indigo-400 hover:from-violet-750 hover:to-indigo-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ml-auto sm:ml-0 cursor-pointer md:min-w-[150px] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">{intl.formatMessage({ id: "collections.new_collection" })}</span>
          </button>
        </form>

        {/* List */}
        {isLoading ? (
          <div className="text-center text-text-muted py-12">{intl.formatMessage({ id: "common.loading", defaultMessage: "Loading..." })}</div>
        ) : (
          <div className="bg-bg-card border border-border-ui rounded-2xl divide-y divide-border-ui overflow-hidden shadow-sm transition-all duration-200">
            {collections.map((collection, index) => {
              const itemCount = collection.collection_items[0]?.count || 0;
              return (
                <div
                  key={collection.id}
                  className="p-4 flex items-center justify-between transition-colors duration-200 group hover:bg-bg-input/30"
                >
                  <Link href={`/collections/${collection.id}`} className="flex-1 flex items-center gap-3.5 select-none">
                    <span className="text-[10px] text-text-muted-light font-mono w-5">
                      {index + 1}.
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-text-primary font-medium text-sm group-hover:text-accent-primary transition-colors truncate">
                        {collection.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-x-3 text-[10px] text-text-muted mt-0.5">
                        <span className="flex items-center gap-1 shrink-0">
                          <Calendar className="w-3 h-3" />
                          {new Date(collection.date).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium text-accent-primary shrink-0">
                          <Layers className="w-2.5 h-2.5" />
                          {intl.formatMessage(
                            { id: itemCount === 1 ? "collections.item_count_singular" : "collections.item_count_plural" },
                            { count: itemCount }
                          )}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleDeleteCollection(collection.id)}
                      className="p-2 md:p-1.5 bg-bg-input/60 md:bg-transparent hover:bg-red-500/10 text-text-muted hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                      title={intl.formatMessage({ id: "button.delete" })}
                    >
                      <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {collections.length === 0 && (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-bg-card">
                <div className="bg-bg-input p-3 rounded-full text-text-muted">
                  <Library className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-text-primary">
                  {intl.formatMessage({ id: "collections.no_collections" })}
                </h3>
                <p className="text-xs text-text-muted max-w-xs">
                  {intl.formatMessage({ id: "collections.no_collections_description" })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
