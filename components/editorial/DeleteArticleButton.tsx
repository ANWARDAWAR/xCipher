"use client";

import { useState } from "react";
import { deleteArticle } from "@/app/actions/article";
import { showToast } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  title?: string;
}

export default function DeleteArticleButton({ id, title }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title || "this article"}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const result = await deleteArticle(id);
      if (result.success) {
        showToast("Article deleted successfully");
        router.refresh();
      } else {
        showToast("Failed to delete: " + result.error);
      }
    } catch (err: any) {
      showToast("Error deleting article");
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="act danger"
      title="Delete article"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
