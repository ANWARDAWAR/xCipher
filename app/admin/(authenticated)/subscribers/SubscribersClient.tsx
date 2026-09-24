"use client";

import React, { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Plus, Download, MoreHorizontal, RefreshCw, Trash2, MailX, Mail, X } from "lucide-react";
import Pagination from "@/components/console/Pagination";
import { showToast } from "@/lib/utils";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { sendNewsletterBroadcast, adminUnsubscribeUser, adminDeleteSubscriber } from "@/app/actions/newsletter";

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

  // Broadcast state
  const [composeOpen, setComposeOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [showConfirmBroadcast, setShowConfirmBroadcast] = useState(false);
  const [sending, setSending] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

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

  const handleSendBroadcast = async () => {
    setShowConfirmBroadcast(false);
    setSending(true);
    showToast("Dispatching broadcast...", "info");
    
    try {
      const res = await sendNewsletterBroadcast(subject, content);
      if (res.success) {
        showToast(res.message || "Broadcast sent!", "success", "premium");
        setComposeOpen(false);
        setSubject("");
        setContent("");
      } else {
        showToast(res.error || "Broadcast failed", "error", "premium");
      }
    } catch (e: any) {
      showToast(e.message || "An error occurred", "error", "premium");
    } finally {
      setSending(false);
    }
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
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-bad/10 text-bad border border-bad/20">Bounced</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-2 text-muted border border-line">Unknown</span>;
    }
  };

  const handleUnsubscribe = async (email: string) => {
    setOpenDropdown(null);
    if (actionPending) return;
    setActionPending(true);
    showToast(`Unsubscribing ${email}...`, "info");
    
    try {
      const res = await adminUnsubscribeUser(email);
      if (res.success) {
        showToast(res.message || "Unsubscribed successfully.", "success", "premium");
        router.refresh();
      } else {
        showToast(res.error || "Failed to unsubscribe.", "error", "premium");
      }
    } catch (e: any) {
      showToast("An error occurred.", "error", "premium");
    } finally {
      setActionPending(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || actionPending) return;
    setActionPending(true);
    
    try {
      const res = await adminDeleteSubscriber(deleteTarget);
      if (res.success) {
        showToast(res.message || "Subscriber deleted.", "success", "premium");
        setDeleteTarget(null);
        router.refresh();
      } else {
        showToast(res.error || "Failed to delete.", "error", "premium");
      }
    } catch (e: any) {
      showToast("An error occurred.", "error", "premium");
    } finally {
      setActionPending(false);
    }
  };

  const handleAction = (action: string, email: string) => {
    setOpenDropdown(null);
    if (action === "Unsubscribe") {
      handleUnsubscribe(email);
    } else if (action === "Remove") {
      setDeleteTarget(email);
    } else {
      showToast(`${action} action triggered for ${email} (Demo)`);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-8 relative">
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
        <div className="bg-surface border border-line border-t-[3px] border-t-accent rounded-xl p-5 text-center shadow-sm">
          <div className="text-3xl font-display font-semibold text-ink">{stats.bounced}</div>
          <div className="text-xs font-medium text-muted mt-1 uppercase tracking-wider">Bounced</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
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

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          <button className="flex items-center justify-center flex-1 md:flex-none h-[38px] px-3 gap-2 text-sm font-medium border border-line bg-surface text-ink-2 hover:bg-surface-2 rounded-md transition-colors whitespace-nowrap">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            onClick={() => setComposeOpen(true)}
            className="flex items-center justify-center flex-1 md:flex-none h-[38px] px-4 gap-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 border border-transparent rounded-md transition-colors whitespace-nowrap"
          >
            <Mail className="w-4 h-4" />
            Compose Newsletter
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
                <th className="whitespace-nowrap min-w-[120px] py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider w-[40%] ">Subscriber</th>
                <th className="whitespace-nowrap min-w-[120px] py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider w-[20%] ">Status</th>
                <th className="whitespace-nowrap min-w-[120px] py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider w-[20%] ">Date Joined</th>
                <th className="whitespace-nowrap min-w-[120px] py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider w-[20%] text-right ">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {initialSubscribers.length > 0 ? (
                initialSubscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-paper/80 dark:hover:bg-surface/5 transition-colors group">
                    <td className="whitespace-nowrap py-4 px-4 align-middle w-[40%] ">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-ink font-mono">
                          {s.email}
                        </span>
                        <span className="text-[11px] text-muted mt-1 uppercase tracking-wider">
                          Source: {s.source}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-4 px-4 align-middle w-[20%] ">
                      {getStatusBadge(s.status)}
                    </td>
                    <td className="whitespace-nowrap py-4 px-4 align-middle w-[20%] ">
                      <div className="text-sm text-ink-2">
                        {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-4 px-4 align-middle text-right w-[20%] relative ">
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
                            className="w-full text-left px-4 py-2 text-sm text-bad hover:bg-bad/10 flex items-center gap-2 border-t border-line"
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
                  <td colSpan={4} className="whitespace-nowrap py-12 text-center">
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

      {/* Compose Newsletter Modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-line rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-line flex items-center justify-between bg-surface-2/30 rounded-t-xl">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <Mail className="w-5 h-5 text-accent" /> Compose Newsletter
              </h2>
              <button onClick={() => setComposeOpen(false)} className="text-muted hover:text-ink transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Subject Line</label>
                <input 
                  type="text" 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-paper border border-line rounded-md text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 font-medium"
                  placeholder="E.g., Your Weekly xSypher Updates"
                />
              </div>
              <div className="flex-1 min-h-[350px] flex flex-col">
                <label className="block text-sm font-semibold text-ink mb-1.5">HTML Content</label>
                <textarea 
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full flex-1 px-4 py-3 bg-paper border border-line rounded-md text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 font-mono text-[13px] resize-none leading-relaxed"
                  placeholder="<h1 style='color: #111;'>Hello from xSypher!</h1><p>Write your beautiful HTML newsletter here...</p>"
                />
                <p className="text-[11px] text-muted mt-2">
                  An unsubscribe link will automatically be appended to the bottom of the email.
                </p>
              </div>
            </div>
            <div className="p-5 border-t border-line flex justify-end gap-3 bg-surface-2/30 rounded-b-xl">
              <button 
                onClick={() => setComposeOpen(false)}
                className="px-5 py-2 text-sm font-semibold text-ink-2 hover:bg-surface hover:text-ink rounded-md transition-colors border border-transparent hover:border-line"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowConfirmBroadcast(true)}
                disabled={!subject || !content || sending}
                className="px-5 py-2 text-sm font-semibold bg-accent text-white hover:bg-accent-deep rounded-md transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? "Processing..." : "Review & Send"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ConfirmDialog 
        isOpen={showConfirmBroadcast}
        title="Send Newsletter Broadcast"
        description={`You are about to send "${subject}" to ALL ${stats.active} active subscribers. This action will invoke the Brevo API and cannot be undone.`}
        confirmText={sending ? "Sending Broadcast..." : "Send Broadcast"}
        isDestructive={false}
        onConfirm={handleSendBroadcast}
        onCancel={() => setShowConfirmBroadcast(false)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Subscriber"
        description={`Are you sure you want to permanently delete the subscriber ${deleteTarget}? This action cannot be undone.`}
        confirmText={actionPending ? "Deleting..." : "Delete Record"}
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
