"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function CopyPgpButton({ pgpKey }: { pgpKey: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pgpKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--ink)] bg-[var(--surface-3)] hover:bg-[var(--line)] border border-[var(--line-2)] rounded-md transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy PGP Key"}
    </button>
  );
}
