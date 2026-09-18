"use client";

import React, { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Plus, Download, MoreHorizontal, RefreshCw, Trash2, MailX } from "lucide-react";
import Pagination from "@/components/console/Pagination";
import { showToast } from "@/lib/utils"; // Assuming you have a toast helper

interface Subscriber {
  id: string;
  email: string;
  status: string;
  source: string;
  consentAt: string | Date;
  createdAt: string | Date;
}

interface Stats {
  total: number;
  active: number;
  unsubscribed: number;
  bounced: number;
}

interface SubscribersClientProps {
  initialSubscribers: Subscriber[];
  stats: Stats;
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
}

export default function SubscribersClient({
  initialSubscribers,
  stats,
  totalItems,
  currentPage,
  itemsPerPage,
}: SubscribersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set("query", searchQuery);
    } else {
      params.delete("query");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Active</span>;
      case "PENDING":
      case "UNCONFIRMED": // In case unconfirmed is used
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Unconfirmed</span>;
      case "UNSUBSCRIBED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/10 text-muted border border-muted/25">Unsubscribed</span>;
      case "BOUNCED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">Bounced</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-2 text-muted border border-line">Unknown</span>;
    }
  };

  const handleAction = (action: string, email: string) => {
    setOpenDropdown(null);
    showToast(`${action} action triggered for ${email} (Demo)`);
  };

  // Close dropdown when clicking outside (simple hack, better to use Radix/DropdownMenu)
  React.useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-line border-t-[3px] border-t-ink rounded-xl p-5 text-center shadow-sm">
          <div className="text-3xl font-display font-semibold text-ink">{stats.total}</div>
          <div className="text-xs font-medium text-muted mt-1 uppercase tracking-wider">Total Subscribers</div>
        </div>
        <div className="bg-surface border border-line border-t-[3px] border-t-emerald-500 rounded-xl p-5 text-center shadow-sm">
          <div className="text-3xl font-display font-semibold text-ink">{stats.active}</div>
          <div className="text-xs font-medium text-muted mt-1 uppercase tracking-wider">Active</div>
        </div>
        <div className="bg-surface border border-line border-t-[3px] border-t-faint rounded-xl p-5 text-center shadow-sm">
          <div className="text-3xl font-display font-semibold text-ink">{stats.unsubscribed}</div>
          <div className="text-xs font-medium text-muted mt-1 uppercase tracking-wider">Unsubscribed</div>
        </div>
        <div className="bg-surface border border-line border-t-[3px] border-t-red-500 rounded-xl p-5 text-center shadow-sm">
          <div className="text-3xl font-display font-semibold text-ink">{stats.bounced}</div>
          <div className="text-xs font-medium text-muted mt-1 uppercase tracking-wider">Bounced</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
          <input
            type="text"
            placeholder="Search email addresses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface border border-line rounded-md focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-ink"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex items-center justify-center flex-1 md:flex-none h-[38px] px-3 gap-2 text-sm font-medium border border-line bg-surface text-ink-2 hover:bg-surface-2 rounded-md transition-colors whitespace-nowrap">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button className="flex items-center justify-center flex-1 md:flex-none h-[38px] px-4 gap-2 text-sm font-medium bg-accent text-white hover:bg-accent-deep border border-transparent rounded-md transition-colors whitespace-nowrap">
            <Plus className="w-4 h-4" />
            Add Subscriber
          </button>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-line bg-paper/50 dark:bg-surface/[0.02]">
                <th className="py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider w-[40%]">Subscriber</th>
                <th className="py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider w-[20%]">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider w-[20%]">Date Joined</th>
                <th className="py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider w-[20%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {initialSubscribers.length > 0 ? (
                initialSubscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-paper/80 dark:hover:bg-surface/5 transition-colors group">
                    <td className="py-4 px-4 align-middle w-[40%]">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-ink font-mono">
                          {s.email}
                        </span>
                        <span className="text-[11px] text-muted mt-1 uppercase tracking-wider">
                          Source: {s.source}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-middle w-[20%]">
                      {getStatusBadge(s.status)}
                    </td>
                    <td className="py-4 px-4 align-middle w-[20%]">
                      <div className="text-sm text-ink-2">
                        {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </td>
                    <td className="py-4 px-4 align-middle text-right w-[20%] relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === s.id ? null : s.id);
                        }}
                        className="inline-flex items-center justify-center p-1.5 rounded-md text-muted hover:text-ink dark:hover:text-ink hover:bg-surface-2 transition-colors"
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>

                      {openDropdown === s.id && (
                        <div 
                          className="absolute right-6 top-10 w-48 bg-surface border border-line rounded-md shadow-lg z-10 overflow-hidden text-left"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleAction("Resend Confirmation", s.email)}
                            className="w-full text-left px-4 py-2 text-sm text-ink-2 hover:bg-surface-2 flex items-center gap-2"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-faint" /> Resend Confirmation
                          </button>
                          <button
                            onClick={() => handleAction("Unsubscribe", s.email)}
                            className="w-full text-left px-4 py-2 text-sm text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 flex items-center gap-2 border-t border-line"
                          >
                            <MailX className="w-3.5 h-3.5" /> Unsubscribe
                          </button>
                          <button
                            onClick={() => handleAction("Remove", s.email)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 border-t border-line"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <p className="text-muted font-medium">No subscribers found matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination stick to bottom */}
        <div className="mt-auto">
          <Pagination
            totalCount={totalItems}
            page={currentPage}
            perPage={itemsPerPage}
            itemName="subscribers"
            sizeParam="limit"
          />
        </div>
      </div>
    </div>
  );
}
