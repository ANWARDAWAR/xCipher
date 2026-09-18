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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Dialog content */}
      <div className="relative w-full max-w-2xl bg-surface rounded-xl shadow-lg border border-line overflow-hidden flex flex-col max-h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div>
            <h3 className="text-lg font-semibold text-ink">
              Audit Log Details
            </h3>
            <p className="text-sm text-muted mt-1">
              Event ID: <span className="font-mono text-xs">{log.id}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-muted hover:text-ink dark:hover:text-ink rounded-full hover:bg-surface-2 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Actor</div>
              <div className="text-sm font-medium text-ink">{log.user?.name || log.user?.email || "System"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Timestamp</div>
              <div className="text-sm font-medium text-ink">{new Date(log.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Action</div>
              <div className="text-sm font-medium text-ink">{log.action}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Target Entity</div>
              <div className="text-sm font-medium text-ink">{log.entityType} {log.entityId ? `(${log.entityId})` : ""}</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Payload / Metadata</div>
            <div className="bg-paper border border-line rounded-md p-4 overflow-x-auto">
              <pre className="text-xs font-mono text-ink-2 whitespace-pre-wrap break-words">
                {log.details ? JSON.stringify(log.details, null, 2) : "No metadata attached to this event."}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line bg-paper/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md border border-line bg-surface text-ink-2 hover:bg-surface-2 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
