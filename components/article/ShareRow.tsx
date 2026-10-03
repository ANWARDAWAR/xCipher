"use client";

import { Link2 } from "lucide-react";
import { showToast } from "@/lib/utils";
import { SocialIcon } from "@/components/author/AuthorProfileView";

export default function ShareRow({ title, slug }: { title: string; slug: string }) {
  const url = typeof window !== 'undefined' ? `${window.location.origin}/article/${slug}` : `https://xsypher.com/article/${slug}`;

  const copyLink = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => showToast("Link copied to clipboard"))
        .catch(() => showToast("Failed to copy link"));
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 mt-0 mb-4 py-2 border-b border-[var(--line)]">
      <span className="text-neutral-500 font-bold uppercase tracking-wider text-xs whitespace-nowrap">
        Share this story
      </span>
      <div className="flex flex-row items-center justify-center sm:justify-start gap-2.5 flex-wrap w-full">
        <a 
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 p-0 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 flex-shrink-0 whitespace-nowrap flex justify-center items-center sm:gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 font-medium text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
        >
          <SocialIcon platform="x" /> <span className="hidden sm:inline">X</span>
        </a>
        <a 
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 p-0 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 flex-shrink-0 whitespace-nowrap flex justify-center items-center sm:gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 font-medium text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
        >
          <SocialIcon platform="whatsapp" /> <span className="hidden sm:inline">WhatsApp</span>
        </a>
        <a 
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 p-0 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 flex-shrink-0 whitespace-nowrap flex justify-center items-center sm:gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 font-medium text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
        >
          <SocialIcon platform="facebook" /> <span className="hidden sm:inline">Facebook</span>
        </a>
        <a 
          href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 p-0 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 flex-shrink-0 whitespace-nowrap flex justify-center items-center sm:gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 font-medium text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
        >
          <SocialIcon platform="linkedin" /> <span className="hidden sm:inline">LinkedIn</span>
        </a>
        <button 
          onClick={copyLink}
          className="w-10 h-10 p-0 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 flex-shrink-0 whitespace-nowrap flex justify-center items-center sm:gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 font-medium text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
        >
          <Link2 size={16} /> <span className="hidden sm:inline">Copy Link</span>
        </button>
      </div>
    </div>
  );
}
