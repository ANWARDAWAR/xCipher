"use client";

import { useEffect } from "react";
import { incrementArticleView } from "@/app/actions/article";

export default function ViewCounter({ articleId }: { articleId: string }) {
  useEffect(() => {
    // Basic debounce using sessionStorage to avoid counting reloads in the same session tab
    const viewKey = `viewed-${articleId}`;
    if (!sessionStorage.getItem(viewKey)) {
      incrementArticleView(articleId).catch(console.error);
      sessionStorage.setItem(viewKey, "true");
    }
  }, [articleId]);

  return null;
}
