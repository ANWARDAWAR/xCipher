"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useRef } from "react";
import { ArticleStatus } from "@prisma/client";
import { STATUS_META } from "@/lib/workflow";
import { Search, X } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  statusCounts: Record<string, number>;
  authors: FilterOption[];
  categories: FilterOption[];
  totalCount: number;
}

export default function FilterBar({
  statusCounts,
  authors,
  categories,
  totalCount,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read current state from URL
  const query = searchParams.get("q") || "";
  const statusParam = searchParams.get("status") || "";
  const authorParam = searchParams.get("author") || "";
  const categoryParam = searchParams.get("category") || "";

  const [searchValue, setSearchValue] = useState(query);
  const [prevQuery, setPrevQuery] = useState(query);

  if (prevQuery !== query) {
    setPrevQuery(query);
    setSearchValue(query);
  }

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset to page 1 on any filter change
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Debounced search
  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ q: value || null });
    }, 300);
  };

  // Status filter state
  const activeStatuses = statusParam ? statusParam.split(",") : [];

  const handleSelectTab = (statusKey: string | null) => {
    if (!statusKey) {
      updateParams({ status: null });
    } else {
      updateParams({ status: statusKey });
    }
  };

  // Collect active filters for chip display
  const activeFilters: { key: string; param: string; label: string }[] = [];
  if (query) {
    activeFilters.push({ key: "q", param: "q", label: `"${query}"` });
  }
  if (statusParam) {
    activeStatuses.forEach((s) => {
      const meta = STATUS_META[s as ArticleStatus];
      activeFilters.push({
        key: `status-${s}`,
        param: "status",
        label: meta?.label || s,
      });
    });
  }
  if (authorParam) {
    const authorLabel = authors.find((a) => a.value === authorParam)?.label || authorParam;
    activeFilters.push({ key: "author", param: "author", label: `Author: ${authorLabel}` });
  }
  if (categoryParam) {
    const catLabel = categories.find((c) => c.value === categoryParam)?.label || categoryParam;
    activeFilters.push({ key: "category", param: "category", label: `Category: ${catLabel}` });
  }

  const clearFilter = (param: string, value?: string) => {
    if (param === "status" && value) {
      const next = activeStatuses.filter((s) => s !== value);
      updateParams({ status: next.length > 0 ? next.join(",") : null });
    } else {
      updateParams({ [param]: null });
    }
  };

  const clearAll = () => {
    updateParams({ q: null, status: null, author: null, category: null });
    setSearchValue("");
  };

  const scopeTotal = Object.values(statusCounts).reduce((acc, curr) => acc + curr, 0);

  // Status tabs definition
  const statusTabs: { id: string | null; label: string; count: number }[] = [
    { id: null, label: "All", count: scopeTotal || totalCount },
    { id: "PUBLISHED", label: "Published", count: statusCounts["PUBLISHED"] || 0 },
    { id: "DRAFT", label: "Drafts", count: statusCounts["DRAFT"] || 0 },
    { id: "SUBMITTED", label: "In Review", count: statusCounts["SUBMITTED"] || 0 },
    { id: "REVISION_REQUESTED", label: "Changes Requested", count: statusCounts["REVISION_REQUESTED"] || 0 },
    { id: "APPROVED", label: "Approved", count: statusCounts["APPROVED"] || 0 },
    { id: "SCHEDULED", label: "Scheduled", count: statusCounts["SCHEDULED"] || 0 },
    { id: "ARCHIVED", label: "Archived", count: statusCounts["ARCHIVED"] || 0 },
  ];

  return (
    <div className="space-y-3 mt-4">
      {/* ── Tier 1: Segmented Status Navigation Bar ─────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {statusTabs.map((tab) => {
          const isSelected = tab.id === null 
            ? activeStatuses.length === 0 
            : activeStatuses.includes(tab.id);

          return (
            <button
              key={tab.label}
              onClick={() => handleSelectTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? "bg-surface text-ink border-line shadow-xs"
                  : "bg-transparent text-muted hover:text-ink hover:bg-surface-2 border-transparent"
              }`}
            >
              <span>{tab.label}</span>
              <span 
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected
                    ? "bg-surface-2 text-ink"
                    : "bg-surface-3/60 text-muted"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Tier 2: Search Box & Select Controls ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Search input with embedded Lucide Search icon */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            placeholder="Search by title, author, or keyword…"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-surface border border-line rounded-lg text-xs sm:text-sm pl-9 pr-3.5 py-2 text-ink placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            aria-label="Search articles"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {authors.length > 0 && (
            <select
              value={authorParam}
              onChange={(e) => updateParams({ author: e.target.value || null })}
              className="bg-surface border border-line rounded-lg text-xs font-medium text-ink px-3 py-2 focus:outline-none focus:border-accent transition-colors cursor-pointer"
              aria-label="Filter by author"
            >
              <option value="">All Authors</option>
              {authors.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          )}

          {categories.length > 0 && (
            <select
              value={categoryParam}
              onChange={(e) => updateParams({ category: e.target.value || null })}
              className="bg-surface border border-line rounded-lg text-xs font-medium text-ink px-3 py-2 focus:outline-none focus:border-accent transition-colors cursor-pointer"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label} {c.count ? `(${c.count})` : ""}
                </option>
              ))}
            </select>
          )}

          {activeFilters.length > 0 && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline px-2 py-1 font-medium transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Active Filter Badges ────────────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[11px] text-muted uppercase font-semibold tracking-wider">Active Filters:</span>
          {activeFilters.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-surface border border-line text-xs font-medium text-ink"
            >
              <span>{f.label}</span>
              <button
                onClick={() => clearFilter(f.param, f.key.startsWith("status-") ? f.key.replace("status-", "") : undefined)}
                className="text-muted hover:text-ink cursor-pointer ml-0.5"
                aria-label={`Remove filter ${f.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
