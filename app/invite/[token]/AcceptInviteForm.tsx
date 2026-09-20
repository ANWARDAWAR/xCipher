"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInvitation } from "@/app/actions/invitations";

interface AcceptInviteFormProps {
  token: string;
  email: string;
}

export default function AcceptInviteForm({ token, email }: AcceptInviteFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = await acceptInvitation(token, formData);

    if (res.success) {
      router.push("/admin/login?setup=success");
    } else {
      setError(res.error || "An error occurred");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="p-3 bg-[var(--bad)]/10 border border-[var(--bad)]/30 text-[var(--bad)] rounded-[var(--r-sm)] text-xs font-medium font-[family:var(--f-ui)]">
          {error}
        </div>
      )}

      <div>
        <label className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)] font-[family:var(--f-ui)] font-semibold mb-2 block">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full bg-[var(--surface-2)] border border-[var(--line-2)] rounded-[var(--r-sm)] px-3.5 py-2.5 text-sm text-[var(--muted)] font-[family:var(--f-ui)] cursor-not-allowed opacity-75 select-none"
        />
        <span className="text-[10px] text-[var(--faint)] font-[family:var(--f-ui)] mt-1.5 block">
          Locked to the invited recipient
        </span>
      </div>

      <div>
        <label className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)] font-[family:var(--f-ui)] font-semibold mb-2 block">
          Full Name
        </label>
        <input
          name="name"
          type="text"
          required
          placeholder="e.g. Jane Doe"
          className="w-full bg-[var(--surface-2)] border border-[var(--line-2)] rounded-[var(--r-sm)] px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder-[var(--faint)] font-[family:var(--f-ui)] focus:border-[var(--accent)] focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)] font-[family:var(--f-ui)] font-semibold mb-2 block">
          Set Password
        </label>
        <input
          name="password"
          type="password"
          required
          minLength={10}
          placeholder="••••••••"
          className="w-full bg-[var(--surface-2)] border border-[var(--line-2)] rounded-[var(--r-sm)] px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder-[var(--faint)] font-[family:var(--f-ui)] focus:border-[var(--accent)] focus:outline-none transition-colors"
        />
        <span className="text-[10px] text-[var(--muted)] font-[family:var(--f-ui)] mt-1.5 block">
          At least 10 characters, with letters and digits
        </span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-3 px-5 bg-[var(--accent)] hover:bg-[var(--accent-deep)] text-white font-[family:var(--f-ui)] font-semibold text-xs uppercase tracking-wider rounded-[var(--r-sm)] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Activating Account...</span>
          </>
        ) : (
          "Accept & Activate Account"
        )}
      </button>
    </form>
  );
}
