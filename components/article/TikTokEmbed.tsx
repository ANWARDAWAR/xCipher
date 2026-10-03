"use client";

import { useEffect, useState } from "react";

export default function TikTokEmbed({ videoId }: { videoId: string }) {
  const [debouncedId, setDebouncedId] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    const handler = setTimeout(() => {
      setDebouncedId(videoId);
    }, 2000);
    return () => clearTimeout(handler);
  }, [videoId]);

  const isValid = /^\d+$/.test(debouncedId);

  return (
    <div className="relative w-full max-w-[325px] mx-auto aspect-[9/16] rounded-xl overflow-hidden bg-transparent border border-neutral-200 dark:border-neutral-800">
      {isValid ? (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 z-10 bg-neutral-200 dark:bg-neutral-800 animate-pulse flex items-center justify-center">
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Loading TikTok...</span>
            </div>
          )}
          <iframe
            src={`https://www.tiktok.com/embed/v2/${debouncedId}`}
            className={`absolute top-0 left-0 w-full h-full border-none transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
            scrolling="no"
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            allowFullScreen
            title="TikTok Video"
          />
        </>
      ) : (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500">
          <p className="text-sm font-medium">Enter a valid TikTok URL</p>
        </div>
      )}
    </div>
  );
}
