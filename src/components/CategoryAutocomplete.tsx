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
    <div ref={containerRef} className="space-y-3 relative">
      {/* Selected Tags list */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((cat) => (
            <span
              key={cat.id}
              className="bg-violet-500/10 text-violet-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-violet-500/30 flex items-center gap-2 shadow-sm animate-fade-in"
            >
              {cat.name}
              <button
                type="button"
                onClick={() => handleRemove(cat.id)}
                className="hover:bg-violet-500/25 p-0.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
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
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500/80 transition-all focus:shadow-[0_0_12px_rgba(139,92,246,0.1)]"
        />

        {/* Suggestions dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl max-h-52 overflow-y-auto divide-y divide-slate-800/50 animate-fade-in">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-slate-500 italic text-center">No categories found</div>
            ) : (
              filtered.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelect(cat.id)}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-violet-600/15 hover:text-violet-300 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] bg-slate-850 px-2 py-0.5 rounded text-slate-400 group-hover:bg-violet-500/20">Add</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
