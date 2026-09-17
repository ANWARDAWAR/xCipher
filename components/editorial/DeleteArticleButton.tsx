"use client";

import { useState } from "react";
import { deleteArticle } from "@/app/actions/article";
import { showToast } from "@/lib/utils";
import { useRouter } from "next/navigation";
import ConfirmDialog from "../ui/ConfirmDialog";

interface Props {
  id: string;
  title?: string;
}

export default function DeleteArticleButton({ id, title }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleConfirmDelete = async () => {
    setShowConfirm(false);

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
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="act danger"
        title="Delete article"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>

      <ConfirmDialog 
        isOpen={showConfirm}
        title="Delete Article"
        description={`Are you sure you want to delete "${title || "this article"}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
