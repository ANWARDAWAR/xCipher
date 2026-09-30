"use client";

import { signOut } from "next-auth/react";

interface SignOutTriggerProps {
  className?: string;
  children: React.ReactNode;
}

export default function SignOutTrigger({ className, children }: SignOutTriggerProps) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className={className}
    >
      {children}
    </button>
  );
}
