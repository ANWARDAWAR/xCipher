"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface AuditLogDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  log: any; // Using any for quick integration, ideally should be typed
}

export default function AuditLogDetailsDialog({ isOpen, onClose, log }: AuditLogDetailsDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Dialog content */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111317] rounded-xl shadow-lg border border-neutral-200/80 dark:border-white/10 overflow-hidden flex flex-col max-h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200/80 dark:border-white/10">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Audit Log Details
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Event ID: <span className="font-mono text-xs">{log.id}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Actor</div>
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{log.user?.name || log.user?.email || "System"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Timestamp</div>
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{new Date(log.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Action</div>
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{log.action}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Target Entity</div>
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{log.entityType} {log.entityId ? `(${log.entityId})` : ""}</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Payload / Metadata</div>
            <div className="bg-neutral-50 dark:bg-[#0c0d10] border border-neutral-200/80 dark:border-white/5 rounded-md p-4 overflow-x-auto">
              <pre className="text-xs font-mono text-neutral-800 dark:text-neutral-300 whitespace-pre-wrap break-words">
                {log.details ? JSON.stringify(log.details, null, 2) : "No metadata attached to this event."}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-[#0c0d10]/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#111317] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
