"use client";

import React, { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Filter, Download, Eye } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import AuditLogDetailsDialog from "./AuditLogDetailsDialog";

interface AuditLog {
  id: string;
  userId: string | null;
  user: { name: string | null; email: string | null } | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: any;
  createdAt: string | Date;
}

interface AuditLogsClientProps {
  logs: AuditLog[];
  totalLogs: number;
  currentPage: number;
  itemsPerPage: number;
}

export default function AuditLogsClient({
  logs,
  totalLogs,
  currentPage,
  itemsPerPage,
}: AuditLogsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

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

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "All") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const getActionBadgeStyle = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("PUBLISH") || act.includes("UPDATE") || act.includes("CREATE")) {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    }
    if (act.includes("LOGIN") || act.includes("AUTH") || act.includes("PASSWORD")) {
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    }
    if (act.includes("DELETE") || act.includes("REVOKE") || act.includes("REMOVE")) {
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    }
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  };

  const getRelativeTime = (date: string | Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hr${hours !== 1 ? "s" : ""} ago`;
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const formatExactDate = (date: string | Date) => {
    return new Date(date).toISOString().replace("T", " ").slice(0, 19) + " UTC";
  };

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search actor, IP, or resource..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#111317] border border-neutral-200/80 dark:border-white/10 rounded-md focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-neutral-900 dark:text-neutral-100"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center bg-white dark:bg-[#111317] border border-neutral-200/80 dark:border-white/10 rounded-md px-3 py-1.5 h-[38px]">
            <Filter className="w-4 h-4 text-neutral-400 mr-2" />
            <select
              className="bg-transparent text-sm focus:outline-none text-neutral-700 dark:text-neutral-300 min-w-[120px]"
              value={searchParams.get("category") || "All"}
              onChange={(e) => handleFilterChange("category", e.target.value)}
            >
              <option value="All">All Events</option>
              <option value="Publishing">Publishing</option>
              <option value="Authentication">Authentication</option>
              <option value="User Management">User Management</option>
              <option value="System">System / Settings</option>
            </select>
          </div>

          <div className="flex items-center bg-white dark:bg-[#111317] border border-neutral-200/80 dark:border-white/10 rounded-md px-3 py-1.5 h-[38px]">
            <select
              className="bg-transparent text-sm focus:outline-none text-neutral-700 dark:text-neutral-300 min-w-[100px]"
              value={searchParams.get("dateRange") || "All Time"}
              onChange={(e) => handleFilterChange("dateRange", e.target.value)}
            >
              <option value="All Time">All Time</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <button className="flex items-center justify-center h-[38px] px-3 gap-2 text-sm font-medium border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#111317] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 rounded-md transition-colors whitespace-nowrap">
            <Download className="w-4 h-4" />
            Export Log
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111317] border border-neutral-200/80 dark:border-white/10 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.02]">
                <th className="py-3 px-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[18%]">Timestamp</th>
                <th className="py-3 px-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[22%]">Actor</th>
                <th className="py-3 px-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[22%]">Action / Event</th>
                <th className="py-3 px-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[26%]">Resource / Target</th>
                <th className="py-3 px-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[12%] text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/80 dark:divide-white/10">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors group">
                    <td className="py-3 px-4 align-top">
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {getRelativeTime(log.createdAt)}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-500 font-mono mt-0.5">
                        {formatExactDate(log.createdAt)}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase flex-shrink-0">
                          {log.user?.name ? log.user.name.slice(0, 2) : (log.user?.email ? log.user.email.slice(0, 2) : "SY")}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[160px]">
                            {log.user?.name || log.user?.email || "System"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide border ${getActionBadgeStyle(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="text-sm text-neutral-700 dark:text-neutral-300">
                        {log.entityType}
                      </div>
                      {log.entityId && (
                        <div className="text-xs font-mono text-neutral-500 dark:text-neutral-500 mt-0.5">
                          {log.entityId}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 align-top text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center justify-center p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                        aria-label="View Details"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-3" />
                      <p className="text-neutral-500 dark:text-neutral-400 font-medium">No audit logs found matching your criteria.</p>
                      <button 
                        onClick={() => router.push(pathname)}
                        className="mt-2 text-sm text-accent hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalLogs / itemsPerPage)}
          totalItems={totalLogs}
          itemsPerPage={itemsPerPage}
          itemName="logs"
        />
      </div>

      <AuditLogDetailsDialog
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </>
  );
}
