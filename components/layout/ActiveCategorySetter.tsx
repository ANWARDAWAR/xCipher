"use client";

import { useEffect } from "react";
import { useNavStore } from "@/lib/store/useNavStore";

export default function ActiveCategorySetter({ slug }: { slug: string | null }) {
  const setActiveCategorySlug = useNavStore((state) => state.setActiveCategorySlug);

  useEffect(() => {
    setActiveCategorySlug(slug);
    return () => setActiveCategorySlug(null);
  }, [slug, setActiveCategorySlug]);

  return null;
}
