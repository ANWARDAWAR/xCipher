"use client";

import { useState } from "react";
import { resetPassword } from "@/app/actions/password-reset";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const result = await resetPassword(token, password);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 2000);
    } else {
      setError(result.error || "Failed to reset password.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full flex items-start gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-sm" role="status">
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
        <p className="font-medium text-xs sm:text-sm leading-relaxed">
          Password reset. Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
      {error && (
        <div className="flex items-start gap-3 p-3.5 bg-bad/10 border border-bad/25 text-bad rounded-lg text-sm" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-bad" />
          <p className="font-medium text-xs sm:text-sm leading-relaxed">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
          New Password
        </label>
        <input 
          id="password"
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          required 
          minLength={8}
          autoComplete="new-password"
          className="block w-full h-11 px-3.5 py-2.5 bg-neutral-900/90 border border-neutral-700/80 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-accent/70 focus:ring-1 focus:ring-accent/40 transition-all box-border" 
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
          Confirm Password
        </label>
        <input 
          id="confirmPassword"
          type="password" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••••••"
          required 
          minLength={8}
          autoComplete="new-password"
          className="block w-full h-11 px-3.5 py-2.5 bg-neutral-900/90 border border-neutral-700/80 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-accent/70 focus:ring-1 focus:ring-accent/40 transition-all box-border" 
        />
      </div>

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
              <span>Resetting...</span>
            </>
          ) : (
            <span>Reset Password</span>
          )}
        </button>
      </div>
    </form>
  );
}
