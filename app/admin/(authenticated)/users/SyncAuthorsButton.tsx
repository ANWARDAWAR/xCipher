"use client";

import { useState } from "react";
import { syncAllExistingAuthors } from "@/app/actions/profile";
import { RefreshCw } from "lucide-react";

export default function SyncAuthorsButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncAllExistingAuthors();
      if (res.success) {
        alert(`Successfully synced ${res.count} legacy users to authors!`);
      } else {
        alert("Failed to sync authors: " + res.error);
      }
    } catch (e) {
      alert("Error syncing authors.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-surface-3 text-ink text-xs sm:text-sm font-semibold rounded-lg shadow-xs border border-line transition-all duration-150 active:scale-[0.99] disabled:opacity-50"
      title="Retroactively create Author profiles for legacy users missing them"
    >
      <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
      <span>{isSyncing ? "Syncing..." : "Sync Legacy Authors"}</span>
    </button>
  );
}
