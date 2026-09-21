"use client";

import React, { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface CreatableComboboxProps {
  options: ComboboxOption[];
  value: string; // The current selected value (for single select)
  onChange: (val: string) => void;
  onCreate: (val: string) => Promise<string | null>; // Returns the new value (e.g., slug) on success
  placeholder?: string;
  isMulti?: boolean;
  selectedValues?: string[]; // For multi-select
  onSelectMultiple?: (vals: string[]) => void;
  id?: string;
}

export function CreatableCombobox({
  options,
  value,
  onChange,
  onCreate,
  placeholder = "Select or create...",
  isMulti = false,
  selectedValues = [],
  onSelectMultiple,
  id,
}: CreatableComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(query.toLowerCase())
  );

  const exactMatch = options.find(opt => opt.label.toLowerCase() === query.trim().toLowerCase());

  const handleSelect = (val: string, label: string) => {
    if (isMulti && onSelectMultiple) {
      if (!selectedValues.includes(label)) {
        onSelectMultiple([...selectedValues, label]);
      }
    } else {
      onChange(val);
      // Single select: don't keep query because we will derive input text from value
    }
    setIsOpen(false);
    setQuery("");
  };

  const handleCreate = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsCreating(true);
    try {
      const newVal = await onCreate(trimmed);
      if (newVal) {
        if (isMulti && onSelectMultiple) {
          if (!selectedValues.includes(trimmed)) {
            onSelectMultiple([...selectedValues, trimmed]);
          }
        } else {
          onChange(newVal);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
      setIsOpen(false);
      setQuery("");
    }
  };

  // Determine what to show in the input box when NOT typing
  const displayValue = !isOpen && !isMulti ? (options.find(o => o.value === value)?.label || "") : query;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative flex items-center w-full">
        <input
          id={id}
          ref={inputRef}
          type="text"
          className="ed-rail-input w-full pr-8"
          placeholder={isMulti && selectedValues.length > 0 ? "Add another..." : placeholder}
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (exactMatch) {
                handleSelect(exactMatch.value, exactMatch.label);
              } else if (query.trim() && !isCreating) {
                handleCreate();
              }
            }
          }}
        />
        {isCreating && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--surface)] border border-[var(--line)] rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            <ul className="py-1 m-0 list-none">
              {filteredOptions.map((opt) => (
                <li
                  key={opt.value}
                  onClick={() => handleSelect(opt.value, opt.label)}
                  className={`px-3 py-2 cursor-pointer text-sm transition-colors hover:bg-[var(--surface-2)] text-[var(--ink)] ${(isMulti ? selectedValues.includes(opt.label) : value === opt.value) ? "font-bold bg-[var(--surface-2)]" : ""
                    }`}
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-2 text-sm text-[var(--muted)]">No matches found.</div>
          )}

          {query.trim() && !exactMatch && (
            <div
              className="px-3 py-2 border-t border-[var(--line)] cursor-pointer text-sm font-semibold text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors flex items-center gap-2"
              onClick={handleCreate}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              Create "{query.trim()}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
