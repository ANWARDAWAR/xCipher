"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import Logo from "@/components/common/Logo";

export default function DownloadAssetCard({ title, desc, type }: { title: string, desc: string, type: "svg" | "png" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const confirmDownload = async () => {
    try {
      setIsDownloading(true);
      // Map type to actual files in the public directory
      const url = type === "svg" ? "/xsypher-logo-full.svg" : "/xsypher-logo-full.png";
      const response = await fetch(`${window.location.origin}${url}`);
      
      if (!response.ok) throw new Error("Failed to fetch asset");
      
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `xSypher-Logo.${type}`;
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
      
      setIsOpen(false);
    } catch (error) {
      console.error("Download failed:", error);
      // In production, might want to show an error toast here
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(true);
  };

  return (
    <>
      <button 
        onClick={handleDownload}
        className="flex flex-col text-left p-6 bg-[var(--surface-2)] border border-[var(--line)] rounded-sm hover:border-[var(--accent)] transition-all group w-full relative overflow-hidden"
      >
        {/* Logo Preview Background */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-end pr-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
          <Logo showText={false} className="w-24 h-24 text-[var(--ink)]" />
        </div>

        <div className="relative z-10 w-full flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[var(--ink)] text-lg">{title}</h3>
            <p className="text-sm text-[var(--muted)] mt-1">{desc}</p>
          </div>
          <div className="p-3 shrink-0 ml-4 bg-[var(--surface)] border border-[var(--line)] rounded-full text-[var(--muted)] group-hover:text-white group-hover:bg-[var(--accent)] group-hover:border-[var(--accent)] transition-all">
            <Download className="w-5 h-5" />
          </div>
        </div>
      </button>

      {/* Sleek Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-lg shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-[var(--line)]">
              <h4 className="font-bold text-[var(--ink)]">Download Asset</h4>
              <button onClick={() => setIsOpen(false)} className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 flex flex-col items-center justify-center text-center bg-[var(--surface)]">
              <Logo variant="brand" className="text-4xl text-[var(--ink)] mb-4" />
              <p className="text-sm text-[var(--muted)] mt-4">
                You are about to download the official xSypher logo in {type.toUpperCase()} format.
              </p>
            </div>

            <div className="p-4 border-t border-[var(--line)] bg-[var(--surface-2)] flex justify-end gap-3">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-bold text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDownload}
                disabled={isDownloading}
                className="px-4 py-2 text-sm font-bold bg-[var(--accent)] text-white rounded hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" /> 
                {isDownloading ? "Downloading..." : "Download Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
