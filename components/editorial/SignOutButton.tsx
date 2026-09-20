"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { showToast } from "@/lib/utils";

// Audit: signing out was a single click with no confirmation, on the same
// sidebar as every destructive editorial control. It now confirms first, and
// the pending state makes a double-click harmless while the session closes.
export default function SignOutButton() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      // signOut navigates away on success; onSubmit it never resolves with a
      // failure, but a network partition can still leave the callback
      // rejected -- which is why the catch exists instead of optimism.
      await signOut({ callbackUrl: "/admin/login" });
    } catch {
      setIsPending(false);
      setConfirmOpen(false);
      showToast("Error: Sign out failed. Please try again.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="btn-cs"
        style={{ cursor: "pointer" }}
      >
        Sign out
      </button>
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Sign out of xSypher?"
        description="You will need your email and password to sign back in to the console. Any unsaved work stays exactly where you left it."
        confirmText="Sign out"
        cancelText="Stay signed in"
        isDestructive={false}
        isPending={isPending}
        pendingText="Signing out…"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
