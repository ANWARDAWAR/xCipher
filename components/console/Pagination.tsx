"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from "lucide-react";

interface PaginationProps {
  totalCount: number;
  page: number;
  perPage: number;
  /** Plural noun for the result count, e.g. "articles", "subscribers". */
  itemName?: string;
  /** Query param carrying the page size. The article index uses "per"; the
   *  audit-log, comments and subscriber pages read "limit". */
  sizeParam?: string;
  /** Page sizes offered in the selector. */
  pageSizes?: number[];
}

const DEFAULT_PAGE_SIZES = [25, 50, 100];

export default function Pagination({
  totalCount,
  page,
  perPage,
  itemName = "results",
  sizeParam = "per",
  pageSizes = DEFAULT_PAGE_SIZES,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const clampedPage = Math.min(page, totalPages);
  const start = totalCount > 0 ? (clampedPage - 1) * perPage + 1 : 0;
  const end = Math.min(clampedPage * perPage, totalCount);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const goToPage = (p: number) => {
    updateParams({ page: p === 1 ? "" : String(p) });
  };

  const changePageSize = (size: number) => {
    updateParams({ [sizeParam]: String(size), page: "" });
  };

  // Generate page numbers to display (always show first, last, and 2 around current)
  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "...")[] = [1];

    if (clampedPage > 3) pages.push("...");

    const rangeStart = Math.max(2, clampedPage - 1);
    const rangeEnd = Math.min(totalPages - 1, clampedPage + 1);

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (clampedPage < totalPages - 2) pages.push("...");

    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  if (totalCount === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-1 border-t border-line mt-5 text-xs text-muted">
      {/* Result count */}
      <div>
        Showing <strong className="text-ink font-semibold">{start}–{end}</strong> of{" "}
        <strong className="text-ink font-semibold">{totalCount.toLocaleString()}</strong> {itemName}
      </div>

      {/* Page navigation buttons */}
      <div className="flex items-center gap-1.5">
        {/* First */}
        <button
          onClick={() => goToPage(1)}
          disabled={clampedPage <= 1}
          title="First page"
          className="p-1.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous */}
        <button
          onClick={() => goToPage(clampedPage - 1)}
          disabled={clampedPage <= 1}
          title="Previous page"
          className="p-1.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1.5 text-muted select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goToPage(p)}
                aria-label={`Page ${p}`}
                aria-current={p === clampedPage ? "page" : undefined}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  p === clampedPage
                    ? "bg-accent border-accent text-white shadow-xs"
                    : "bg-surface border-line text-ink hover:bg-surface-2"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => goToPage(clampedPage + 1)}
          disabled={clampedPage >= totalPages}
          title="Next page"
          className="p-1.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last */}
        <button
          onClick={() => goToPage(totalPages)}
          disabled={clampedPage >= totalPages}
          title="Last page"
          className="p-1.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <select
          value={perPage}
          onChange={(e) => changePageSize(Number(e.target.value))}
          className="bg-surface border border-line rounded-lg text-xs font-medium text-ink px-2.5 py-1.5 focus:outline-none focus:border-accent transition-colors cursor-pointer"
          aria-label={`${itemName} per page`}
        >
          {pageSizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
