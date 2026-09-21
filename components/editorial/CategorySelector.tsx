"use client";

import React, { useState, useEffect } from "react";
import { getSubcategories, createSubcategory } from "@/app/actions/taxonomy";
import { CreatableCombobox, ComboboxOption } from "@/components/ui/CreatableCombobox";

const PRIMARY_CATEGORIES = [
  { value: "ai", label: "Artificial Intelligence" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "gadgets", label: "Gadgets & Devices" },
  { value: "software", label: "Software" },
  { value: "programming", label: "Programming" },
  { value: "startups", label: "Startups" },
  { value: "gaming", label: "Gaming" },
  { value: "reviews", label: "Reviews" },
  { value: "how-to", label: "How-To" },
  { value: "opinion", label: "Opinion" },
  { value: "science", label: "Science" },
];

interface CategorySelectorProps {
  initialCategory?: any; // The category object from Prisma (with parent optionally)
  initialFallbackSlug?: string; // e.g. "ai"
  onChange: (finalSlug: string) => void;
}

export default function CategorySelector({ initialCategory, initialFallbackSlug = "ai", onChange }: CategorySelectorProps) {
  // Determine initial state
  const isSubcat = !!initialCategory?.parentId;
  const initialParent = isSubcat ? initialCategory.parent?.slug : (initialCategory?.slug || initialFallbackSlug);
  const initialSubcat = isSubcat ? initialCategory.slug : "";

  const [parentSlug, setParentSlug] = useState<string>(initialParent || "ai");
  const [subcatSlug, setSubcatSlug] = useState<string>(initialSubcat);
  
  const [subcategories, setSubcategories] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch subcategories when parent changes
  useEffect(() => {
    if (!parentSlug) return;
    let active = true;
    setLoading(true);
    getSubcategories(parentSlug).then(res => {
      if (active) {
        setSubcategories(res.map(c => ({ value: c.slug, label: c.name })));
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [parentSlug]);

  const handleParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setParentSlug(val);
    setSubcatSlug(""); // Reset subcat when parent changes
    onChange(val); // By default, assigning to the parent if no subcat is chosen
  };

  const handleSubcatChange = (val: string) => {
    setSubcatSlug(val);
    onChange(val || parentSlug); // if cleared, revert to parent
  };

  const handleCreateSubcat = async (name: string) => {
    const res = await createSubcategory(name, parentSlug);
    if (res.success && res.category) {
      setSubcategories(prev => [...prev, { value: res.category.slug, label: res.category.name }]);
      return res.category.slug;
    } else {
      console.error(res.error);
      return null;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Primary Category Dropdown */}
      <div className="relative">
        <select 
          value={parentSlug} 
          onChange={handleParentChange}
          className="ed-rail-select w-full appearance-none pr-8 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors border border-transparent hover:border-[var(--line)] outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
        >
          {PRIMARY_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--muted)]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      {/* Dependent Subcategory Combobox */}
      {parentSlug && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          <label className="text-xs font-semibold text-[var(--muted)] mb-1.5 block uppercase tracking-wider">Subcategory (Optional)</label>
          <CreatableCombobox 
            options={subcategories}
            value={subcatSlug}
            onChange={handleSubcatChange}
            onCreate={handleCreateSubcat}
            placeholder={loading ? "Loading..." : "Select or create niche..."}
          />
        </div>
      )}
    </div>
  );
}
