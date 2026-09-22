"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/app/actions/password-reset";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const response = await requestPasswordReset(email);
    if (response.error) {
      setError(response.error);
    } else if (response.success) {
      setSuccess(response.success);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-start gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-sm" role="status">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <p className="font-medium text-xs sm:text-sm leading-relaxed">
            {success}
          </p>
        </div>
        <Link 
          href="/admin/login"
          className="w-full h-11 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm tracking-wide rounded-lg transition-all"
        >
          Return to Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
          Email Address
        </label>
        <input 
          id="email"
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="editor@xsypher.com"
          required 
          autoComplete="email"
          className="block w-full h-11 px-3.5 py-2.5 bg-neutral-900/90 border border-neutral-700/80 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-accent/70 focus:ring-1 focus:ring-accent/40 transition-all box-border" 
        />
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="pt-1">
        <button 
          type="submit" 
          disabled={loading} 
          style={{ backgroundColor: loading ? '#b91c1c' : '#dc2626' }}
          className="w-full h-11 flex items-center justify-center gap-2 bg-accent hover:bg-accent-deep active:bg-accent-press text-white font-medium text-sm tracking-wide rounded-lg shadow-md shadow-accent/25 transition-all duration-200 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Sending Request...</span>
            </>
          ) : (
            <span>Send Reset Link</span>
          )}
        </button>
      </div>
    </form>
  );
}
