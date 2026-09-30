"use client";

import dynamic from "next/dynamic";
import React from "react";
import type ArticleEditorComponent from "./ArticleEditor";

const ArticleEditor = dynamic(() => import("./ArticleEditor"), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-[var(--muted)]">
      Loading editorial studio...
    </div>
  ),
});

export default function ArticleEditorClient(
  props: React.ComponentProps<typeof ArticleEditorComponent>
) {
  return <ArticleEditor {...props} />;
}
