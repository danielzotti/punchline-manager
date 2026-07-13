'use client';

import React, { useState, useEffect } from 'react';
import { getCollections } from '@/app/actions/collections';
import Link from 'next/link';
import { Library, Calendar, ChevronRight, Layers } from 'lucide-react';
import { useIntl } from 'react-intl';

export default function CollectionsPage() {
  const intl = useIntl();
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCollections();
        setCollections(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 transition-colors duration-200">
        <div className="max-w-2xl mx-auto py-16 text-center text-text-muted">
          {intl.formatMessage({ id: "common.loading", defaultMessage: "Loading..." })}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 transition-colors duration-200">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-violet-600 to-indigo-500 p-2.5 rounded-xl text-white shadow-lg shadow-violet-500/20">
            <Library className="w-5.5 h-5.5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary leading-tight">
              {intl.formatMessage({ id: "collections.title" })}
            </h2>
            <p className="text-xs text-text-muted">
              {intl.formatMessage({ id: "collections.subtitle" })}
            </p>
          </div>
        </div>

        {/* Collections List */}
        <div className="space-y-3">
          {collections?.map((collection) => {
            const itemCount = collection.collection_items[0]?.count || 0;
            return (
              <Link href={`/collections/${collection.id}`} key={collection.id} className="block group">
                <div className="bg-bg-card hover:bg-bg-input/20 border border-border-ui hover:border-accent-primary/50 p-5 rounded-2xl shadow-sm transition-all duration-200 flex items-center justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <h3 className="text-md font-bold text-text-primary group-hover:text-accent-primary transition-colors truncate">
                      {collection.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(collection.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1 font-medium bg-accent-primary/10 text-accent-primary px-2 py-0.5 rounded-full text-[10px]">
                        <Layers className="w-3 h-3" />
                        {intl.formatMessage(
                          { id: itemCount === 1 ? "collections.item_count_singular" : "collections.item_count_plural" },
                          { count: itemCount }
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="text-text-muted group-hover:text-accent-primary group-hover:translate-x-1 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            );
          })}

          {collections?.length === 0 && (
            <div className="bg-bg-card border border-border-ui rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
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
      </div>
    </main>
  );
}
