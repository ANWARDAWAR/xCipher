"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin dashboard error:", error);
  }, [error]);

  const isDbError = 
    error.message?.includes("Can't reach database server") || 
    error.message?.includes("PrismaClientKnownRequestError") ||
    error.message?.includes("connect to the database");

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-surface border border-line rounded-xl max-w-2xl mx-auto mt-12">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mb-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-ink mb-2 font-display">
        {isDbError ? "Database Connection Error" : "Something went wrong!"}
      </h2>
      
      <p className="text-muted mb-6 max-w-md mx-auto">
        {isDbError 
          ? "We couldn't connect to the database. If you are using Supabase free tier, your database might be paused due to inactivity." 
          : "An unexpected error occurred while loading this page."}
      </p>

      {isDbError && (
        <div className="bg-surface-2 p-4 rounded-lg text-sm text-left border border-line mb-8 w-full overflow-auto max-h-40">
          <code className="text-ink-muted whitespace-pre-wrap font-mono">
            {error.message}
          </code>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-accent text-white rounded-md font-medium hover:bg-accent-hover transition-colors"
        >
          Try again
        </button>
        <Link 
          href="/admin/drafts"
          className="px-6 py-2 bg-surface-2 text-ink border border-line rounded-md font-medium hover:bg-surface-3 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
