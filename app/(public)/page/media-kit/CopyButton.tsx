"use client";
import { useState } from "react";
import { Check } from "lucide-react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="text-xs font-bold text-[var(--accent)] hover:underline uppercase tracking-wide flex items-center gap-1"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" /> COPIED
        </>
      ) : (
        "Copy Text"
      )}
    </button>
  );
}
