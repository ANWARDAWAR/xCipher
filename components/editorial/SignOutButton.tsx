"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="btn-cs"
      style={{ cursor: "pointer" }}
    >
      Sign out
    </button>
  );
}
