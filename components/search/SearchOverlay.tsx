"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getLiveSearchResults, LiveSearchResult } from "@/app/actions/search";

interface SearchContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SearchContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
      <SearchModal />
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) throw new Error("useSearch must be used within a SearchProvider");
  return context;
}

export function SearchButton() {
  const { setIsOpen } = useSearch();
  return (
    <button className="icon-btn" aria-label="Search site" onClick={() => setIsOpen(true)}>
      <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    </button>
  );
}

function SearchModal() {
  const { isOpen, setIsOpen } = useSearch();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LiveSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Debounce search
  useEffect(() => {
    if (!isOpen || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await getLiveSearchResults(query);
        setResults(data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4 bg-black/60 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <form 
          className="relative flex items-center border-b border-[var(--line)]"
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) {
              setIsOpen(false);
              router.push(`/search?q=${encodeURIComponent(query.trim())}`);
            }
          }}
        >
          <svg className="absolute left-4 w-5 h-5 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input 
            ref={inputRef}
            type="search" 
            placeholder="Search articles..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-4 pl-12 pr-12 bg-transparent text-[var(--ink)] placeholder:text-[var(--muted)] outline-none text-lg"
          />
          {isLoading && (
            <div className="absolute right-4 text-[var(--muted)]">
              <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
          )}
        </form>

        {(results.length > 0 || query.trim().length >= 2) && (
          <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
            {results.length > 0 ? (
              results.map((article) => (
                <button
                  key={article.id}
                  onClick={() => {
                    setIsOpen(false);
                    router.push(`/article/${article.slug}`);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-[var(--surface-2)] transition-colors group flex flex-col gap-1"
                >
                  {article.category && (
                    <span className="text-[10px] font-semibold tracking-wider text-[var(--accent)] uppercase">
                      {article.category.name}
                    </span>
                  )}
                  <span className="font-medium text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                    {article.title}
                  </span>
                </button>
              ))
            ) : !isLoading && query.trim().length >= 2 ? (
              <div className="p-8 text-center text-[var(--muted)]">
                No results found for "{query}"
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
