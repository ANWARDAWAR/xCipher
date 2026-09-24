import re

with open('app/admin/(authenticated)/layout.tsx', 'r') as f:
    content = f.read()

# 1. Hide .cs-tag on mobile
content = content.replace('<span className="cs-tag">Editorial Console</span>', '<span className="cs-tag hidden sm:inline-flex">Editorial Console</span>')

# 2. Add responsive gap spacing
content = content.replace('<div className="flex items-center gap-2">', '<div className="flex items-center gap-2 sm:gap-4">')

# 3. Hide 'View site' text on mobile
content = content.replace('<span>View site</span>', '<span className="hidden sm:inline">View site</span>')

with open('app/admin/(authenticated)/layout.tsx', 'w') as f:
    f.write(content)

with open('components/editorial/SignOutButton.tsx', 'r') as f:
    so_content = f.read()

# Make SignOutButton smaller on mobile by hiding text and showing an icon
new_so_content = """"use client";

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
"""
with open('components/editorial/SignOutButton.tsx', 'w') as f:
    f.write(new_so_content)

print("Fixed layout.tsx and SignOutButton.tsx")
