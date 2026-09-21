"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import CommentModerationRow from "./CommentModerationRow";
import Pagination from "@/components/console/Pagination";

interface Comment {
  id: string;
  articleSlug: string;
  displayName: string;
  body: string;
  status: string;
  ipHash: string | null;
  createdAt: string;
  moderatorNote: string | null;
  moderator: { name: string | null } | null;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  spam: number;
  rejected: number;
}

interface CommentsQueueClientProps {
  initialComments: Comment[];
  stats: Stats;
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
}

export default function CommentsQueueClient({ 
  initialComments, 
  stats, 
  totalItems, 
  currentPage, 
  itemsPerPage 
}: CommentsQueueClientProps) {
  const [comments, setComments] = useState(initialComments);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const currentTab = searchParams.get("tab") || "All";

  const handleUpdate = (id: string, newStatus: string) => {
    setComments((prev) => prev.map((c) => c.id === id ? { ...c, status: newStatus } : c));
  };

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

  const setTab = (tabName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tabName !== "All") {
      params.set("tab", tabName);
    } else {
      params.delete("tab");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const tabs = [
    { name: "All", count: stats.total },
    { name: "Pending Review", count: stats.pending, param: "Pending" },
    { name: "Approved", count: stats.approved, param: "Approved" },
    { name: "Spam", count: stats.spam, param: "Spam" },
    { name: "Trash", count: stats.rejected, param: "Trash" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = currentTab === (tab.param || "All");
            return (
              <button
                key={tab.name}
                onClick={() => setTab(tab.param || "All")}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-ink text-paper"
                    : "text-muted hover:bg-surface-2 dark:text-faint dark:hover:bg-surface/5"
                }`}
              >
                {tab.name}
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  isActive 
                    ? "bg-surface/20 text-white dark:bg-black/20 dark:text-ink" 
                    : "bg-surface-2 text-muted dark:bg-surface/10 dark:text-faint"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
          <input
            type="text"
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-surface border border-line rounded-full focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-ink"
          />
        </form>
      </div>

      <div className="bg-surface border border-line rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-line bg-paper/50 dark:bg-surface/[0.02]">
                <th className="py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider w-[20%]">Commenter</th>
                <th className="py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider w-[45%]">Comment Content</th>
                <th className="py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider w-[15%]">Date & Time</th>
                <th className="py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider w-[10%]">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider w-[10%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {comments.length > 0 ? (
                comments.map((c) => (
                  <CommentModerationRow key={c.id} comment={c} onUpdate={handleUpdate} />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <p className="text-muted font-medium">No comments awaiting moderation.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          totalCount={totalItems}
          page={currentPage}
          perPage={itemsPerPage}
          itemName="comments"
          sizeParam="limit"
          pageSizes={[20, 50, 100]}
        />
      </div>
    </div>
  );
}
