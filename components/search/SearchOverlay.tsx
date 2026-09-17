"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchContextType {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
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
    <button className="icon-btn" aria-label="Search xCipher" title="Search ( / )" onClick={() => setIsOpen(true)}>
      <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.8-3.8" />
      </svg>
    </button>
  );
}

function SearchModal() {
  const { isOpen, setIsOpen } = useSearch();
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
      if (e.key === "/" && !isOpen && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div className="search-overlay" style={{ position: "fixed", inset: 0, backgroundColor: "var(--paper)", zIndex: 999, display: "flex", flexDirection: "column" }}>
      <div className="wrap" style={{ padding: "40px 16px", display: "flex", gap: "16px", alignItems: "center" }}>
        <form 
          style={{ flex: 1, position: "relative" }}
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) {
              setIsOpen(false);
              router.push(`/search?q=${encodeURIComponent(query.trim())}`);
            }
          }}
        >
          <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.8-3.8" />
          </svg>
          <input 
            ref={inputRef}
            type="search" 
            placeholder="Search xCipher..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", padding: "16px 16px 16px 48px", fontSize: "1.2rem", border: "1px solid var(--line)", borderRadius: "var(--r-md)", backgroundColor: "var(--surface)", color: "var(--ink)" }}
          />
        </form>
        <button className="icon-btn" onClick={() => setIsOpen(false)} aria-label="Close search">
          <svg className="ic-l" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
