import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemName?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  itemName = "entries",
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", e.target.value);
    params.set("page", "1"); // Reset to page 1
    router.push(`${pathname}?${params.toString()}`);
  };

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 border-t border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-[#111317]">
      <div className="text-sm text-neutral-500 dark:text-neutral-400">
        Showing <span className="font-medium text-neutral-900 dark:text-neutral-100">{startIdx}</span> to <span className="font-medium text-neutral-900 dark:text-neutral-100">{endIdx}</span> of <span className="font-medium text-neutral-900 dark:text-neutral-100">{totalItems}</span> {itemName}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1 rounded-md border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#111317] text-neutral-500 dark:text-neutral-400 disabled:opacity-50 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(currentPage - p) <= 1)
            .map((p, i, arr) => (
              <React.Fragment key={p}>
                {i > 0 && arr[i - 1] !== p - 1 && (
                  <span className="text-neutral-500 dark:text-neutral-400 px-1">...</span>
                )}
                <button
                  onClick={() => handlePageChange(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                    currentPage === p
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                      : "border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#111317] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5"
                  }`}
                >
                  {p}
                </button>
              </React.Fragment>
            ))}
        </div>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1 rounded-md border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#111317] text-neutral-500 dark:text-neutral-400 disabled:opacity-50 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <label htmlFor="limit" className="text-neutral-500 dark:text-neutral-400">Rows per page:</label>
        <select
          id="limit"
          value={itemsPerPage}
          onChange={handleLimitChange}
          className="bg-white dark:bg-[#111317] border border-neutral-200/80 dark:border-white/10 text-neutral-900 dark:text-neutral-100 text-sm rounded-md focus:ring-accent focus:border-accent block p-1"
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </select>
      </div>
    </div>
  );
}
