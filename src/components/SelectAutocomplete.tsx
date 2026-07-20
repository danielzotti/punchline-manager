"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Search } from "lucide-react";
import { useIntl } from "react-intl";

interface AutocompleteItem {
  id: string;
  name: string;
}

interface BaseProps {
  items: AutocompleteItem[];
  placeholder?: string;
  noResultsMessage?: string;
}

interface SingleSelectProps extends BaseProps {
  multiple?: false;
  selectedId: string;
  onChange: (id: string) => void;
}

interface MultiSelectProps extends BaseProps {
  multiple: true;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

type SelectAutocompleteProps = SingleSelectProps | MultiSelectProps;

export default function SelectAutocomplete(props: SelectAutocompleteProps) {
  const { items, placeholder, noResultsMessage, multiple = false } = props;
  const intl = useIntl();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const defaultPlaceholder = placeholder || intl.formatMessage({
    id: "common.search_placeholder",
    defaultMessage: "Search...",
  });

  const defaultNoResults = noResultsMessage || intl.formatMessage({
    id: "common.no_results",
    defaultMessage: "No items found",
  });

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
    if (multiple) {
      const selectedIds = (props as MultiSelectProps).selectedIds || [];
      if (!selectedIds.includes(id)) {
        (props as MultiSelectProps).onChange([...selectedIds, id]);
      }
    } else {
      (props as SingleSelectProps).onChange(id);
    }
    setQuery("");
    setIsOpen(false);
  };

  const handleRemove = (id: string) => {
    if (multiple) {
      const selectedIds = (props as MultiSelectProps).selectedIds || [];
      (props as MultiSelectProps).onChange(selectedIds.filter((item) => item !== id));
    } else {
      (props as SingleSelectProps).onChange("");
    }
  };

  const isSelected = (id: string) => {
    if (multiple) {
      const selectedIds = (props as MultiSelectProps).selectedIds || [];
      return selectedIds.includes(id);
    } else {
      const selectedId = (props as SingleSelectProps).selectedId || "";
      return selectedId === id;
    }
  };

  // Filter items matching query, excluding already selected ones
  const filtered = items.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
    const notSelected = !isSelected(item.id);
    return matchesQuery && notSelected;
  });

  const selectedItems = multiple
    ? items.filter((item) => ((props as MultiSelectProps).selectedIds || []).includes(item.id))
    : items.filter((item) => (props as SingleSelectProps).selectedId === item.id);

  // We always show the input
  const showInput = true;

  return (
    <div ref={containerRef} className="space-y-2 relative">
      {/* Selected Tags list */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {selectedItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleRemove(item.id)}
              className="bg-accent-primary/10 text-accent-primary px-3 py-1.5 rounded-xl text-xs font-semibold border border-accent-primary/20 flex items-center gap-2 shadow-sm"
            >
              {item.name}
              <X className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      )}

      {/* Input container */}
      {showInput && (
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
                  {defaultNoResults}
                </div>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-accent-primary/10 hover:text-accent-primary transition-colors flex items-center justify-between cursor-pointer rounded-none font-normal"
                  >
                    <span>{item.name}</span>
                    <span className="text-xs bg-bg-input px-2 py-0.5 rounded text-text-muted">
                      {intl.formatMessage({ id: "common.add", defaultMessage: "Add" })}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
