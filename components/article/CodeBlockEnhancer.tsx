"use client";

import { useEffect } from "react";
import { Check, Copy } from "lucide-react";
import { createRoot } from "react-dom/client";

// A small functional component for the button itself
function CopyButton({ textToCopy }: { textToCopy: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="absolute top-2.5 right-2.5 px-2 py-1.5 rounded-md bg-[var(--surface)] border border-[var(--line-2)] text-[var(--ink)] hover:bg-[var(--surface-2)] hover:border-[var(--accent)] transition-all z-20 shadow-sm flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer"
      aria-label="Copy code"
      title="Copy code"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-500"/>
      ) : (
        <Copy className="w-3.5 h-3.5 text-[var(--ink)]"/>
      )}
    </button>
  );
}

// Ensure React is in scope for the client root rendering
import React from "react";

export default function CodeBlockEnhancer() {
  useEffect(() => {
    const container = document.querySelector(".tiptap-content") || document.querySelector(".prose");
    if (!container) return;

    const preElements = container.querySelectorAll("pre");
    
    preElements.forEach((pre) => {
      // Skip if already enhanced
      if (pre.dataset.enhanced) return;
      pre.dataset.enhanced = "true";

      // Wrap in a group for hover opacity control
      pre.classList.add("group", "relative");

      // Extract raw code for copying (without HTML tags)
      const codeEl = pre.querySelector("code");
      const textToCopy = codeEl ? codeEl.textContent || "" : pre.textContent || "";

      // Create a mount point for the React component
      const mountPoint = document.createElement("div");
      pre.appendChild(mountPoint);

      // Render the button
      const root = createRoot(mountPoint);
      root.render(<CopyButton textToCopy={textToCopy} />);
    });
  }, []);

  return null; // Component does not render anything directly in the flow
}
