"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Search } from "lucide-react";
import { Category } from "@/hooks/useCategories";

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
  placeholder = "Search categories...",
}: CategoryAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div ref={containerRef} className="space-y-2.5 relative">
      {/* Selected Tags list */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCategories.map((cat) => (
            <span
              key={cat.id}
              className="bg-violet-600/10 text-violet-400 px-2.5 py-1 rounded-lg text-xs font-semibold border border-violet-500/20 flex items-center gap-1.5 shadow-sm"
            >
              {cat.name}
              <button
                type="button"
                onClick={() => handleRemove(cat.id)}
                className="hover:bg-violet-600/20 p-0.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input container */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
        />

        {/* Suggestions dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1.5 bg-slate-900 border border-slate-800 rounded-lg shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-850">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-slate-500 italic">No categories found</div>
            ) : (
              filtered.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelect(cat.id)}
                  className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-violet-600 hover:text-white transition-colors cursor-pointer"
                >
                  {cat.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
