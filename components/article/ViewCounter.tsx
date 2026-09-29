"use client";

import { useEffect } from "react";


export default function ViewCounter({ articleId }: { articleId: string }) {
  useEffect(() => {
    // Basic debounce using sessionStorage to avoid counting reloads in the same session tab
    const viewKey = `viewed-${articleId}`;
    if (!sessionStorage.getItem(viewKey)) {
      fetch("/api/article/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "incrementView", articleId }),
      }).catch(console.error);
      sessionStorage.setItem(viewKey, "true");
    }
  }, [articleId]);

  return null;
}
