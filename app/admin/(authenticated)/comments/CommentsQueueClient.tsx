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
  email: string | null;
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
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/5"
                }`}
              >
                {tab.name}
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  isActive 
                    ? "bg-white/20 text-white dark:bg-black/20 dark:text-neutral-900" 
                    : "bg-neutral-100 text-neutral-500 dark:bg-white/10 dark:text-neutral-400"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-white dark:bg-[#111317] border border-neutral-200/80 dark:border-white/10 rounded-full focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-neutral-900 dark:text-neutral-100"
          />
        </form>
      </div>

      <div className="bg-white dark:bg-[#111317] border border-neutral-200/80 dark:border-white/10 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.02]">
                <th className="py-3 px-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[20%]">Commenter</th>
                <th className="py-3 px-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[45%]">Comment Content</th>
                <th className="py-3 px-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[15%]">Date & Time</th>
                <th className="py-3 px-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[10%]">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[10%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/80 dark:divide-white/10">
              {comments.length > 0 ? (
                comments.map((c) => (
                  <CommentModerationRow key={c.id} comment={c} onUpdate={handleUpdate} />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <p className="text-neutral-500 dark:text-neutral-400 font-medium">No comments awaiting moderation.</p>
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
