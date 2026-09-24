"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="btn-cs p-2 sm:px-3 sm:py-1.5 flex items-center justify-center gap-2"
      style={{ cursor: "pointer" }}
      title="Sign out"
    >
      <span className="hidden sm:inline">Sign out</span>
      <LogOut className="w-4 h-4 sm:hidden" />
    </button>
  );
}
