"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Search } from "lucide-react";
import { Category } from "@/hooks/useCategories";
import { useIntl } from "react-intl";

interface CategoryAutocompleteProps {
  categories: Category[];
  selectedCategoryIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

export default function CategoryAutocomplete({
  categories,
  selectedCategoryIds,
  onChange,
  placeholder,
}: CategoryAutocompleteProps) {
  const intl = useIntl();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const defaultPlaceholder = placeholder || intl.formatMessage({ id: "category.search_placeholder", defaultMessage: "Search categories..." });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    if (!selectedCategoryIds.includes(id)) {
      onChange([...selectedCategoryIds, id]);
    }
    setQuery("");
    setIsOpen(false);
  };

  const handleRemove = (id: string) => {
    onChange(selectedCategoryIds.filter((item) => item !== id));
  };

  // Filter categories matching query, excluding already selected ones
  const filtered = categories.filter((cat) => {
    const matchesQuery = cat.name.toLowerCase().includes(query.toLowerCase());
    const notSelected = !selectedCategoryIds.includes(cat.id);
    return matchesQuery && notSelected;
  });

  const selectedCategories = categories.filter((cat) =>
    selectedCategoryIds.includes(cat.id)
  );

  return (
    <div ref={containerRef} className="space-y-3 relative">
      {/* Selected Tags list */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {selectedCategories.map((cat) => (
            <span
              key={cat.id}
              className="bg-accent-primary/10 text-accent-primary px-3 py-1.5 rounded-xl text-xs font-semibold border border-accent-primary/20 flex items-center gap-2 shadow-sm"
            >
              {cat.name}
              <button
                type="button"
                onClick={() => handleRemove(cat.id)}
                className="hover:bg-accent-primary/20 p-0.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input container */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={defaultPlaceholder}
          className="w-full bg-bg-input border border-border-ui rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted-light focus:outline-none focus:border-accent-primary transition-all focus:shadow-[0_0_12px_rgba(139,92,246,0.05)] duration-200"
        />
 
        {/* Suggestions dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-bg-card border border-border-ui rounded-xl shadow-2xl max-h-52 overflow-y-auto divide-y divide-border-ui/50 animate-fade-in transition-colors duration-200">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-text-muted italic text-center">
                {intl.formatMessage({ id: "category.no_results", defaultMessage: "No categories found" })}
              </div>
            ) : (
              filtered.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelect(cat.id)}
                  className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-accent-primary/10 hover:text-accent-primary transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] bg-bg-input px-2 py-0.5 rounded text-text-muted">
                    {intl.formatMessage({ id: "common.add", defaultMessage: "Add" })}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
