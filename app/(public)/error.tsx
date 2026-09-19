"use client";

import { useEffect } from "react";
import { ServerCrash, RefreshCcw } from "lucide-react";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Public Route Error Caught:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-4 py-12">
      <div className="max-w-2xl w-full mx-auto text-center border border-[var(--line)] bg-[var(--surface-2)] rounded-xl p-8 sm:p-12 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
        
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <ServerCrash className="w-8 h-8 text-red-500" />
        </div>

        <h1 className="font-[family:var(--f-display)] text-4xl sm:text-6xl font-extrabold text-[var(--ink)] mb-4 tracking-tight">
          500
        </h1>
        <h2 className="font-[family:var(--f-display)] text-xl sm:text-2xl font-bold text-[var(--ink)] mb-4 tracking-wide uppercase">
          // System Fault
        </h2>
        
        <p className="font-[family:var(--f-ui)] text-[var(--muted)] text-base sm:text-lg mb-8 max-w-lg mx-auto">
          A critical exception occurred while attempting to fetch the requested intelligence. The incident has been logged.
        </p>

        {(error.message || error.digest) && (
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-lg p-4 mb-8 max-w-full overflow-x-auto text-left">
            <pre className="font-[family:var(--font-jetbrains-mono)] text-xs text-[var(--muted)] whitespace-pre-wrap break-all">
              {error.message || `Digest: ${error.digest}`}
            </pre>
          </div>
        )}

        <div className="flex items-center justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm !bg-[var(--accent)] dark:!bg-[var(--accent)] !text-white dark:!text-white hover:brightness-110 active:scale-95 transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            Reboot System
          </button>
        </div>
      </div>
    </div>
  );
}
