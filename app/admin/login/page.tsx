"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import Logo from "@/components/common/Logo";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const emailInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("from") || "/admin";
  const setupSuccess = searchParams.get("setup") === "success";

  // Auto-focus email input on mount
  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
      {setupSuccess && (
        <div 
          className="flex items-start gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-sm"
          role="status"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <p className="font-medium text-xs sm:text-sm leading-relaxed">
            Setup complete! You may now log in with your new Owner account.
          </p>
        </div>
      )}
      
      {error && (
        <div 
          className="flex items-start gap-3 p-3.5 bg-bad/10 border border-bad/25 text-bad rounded-lg text-sm"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-bad" />
          <p className="font-medium text-xs sm:text-sm leading-relaxed">{error}</p>
        </div>
      )}

      {/* Email Form Group */}
      <div className="flex flex-col gap-2">
        <label 
          htmlFor="email" 
          className="block text-xs font-semibold uppercase tracking-wider text-neutral-300"
        >
          Email Address
        </label>
        <input 
          id="email"
          type="email" 
          ref={emailInputRef}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="editor@xsypher.com"
          required 
          autoComplete="email"
          className="block w-full h-11 px-3.5 py-2.5 bg-neutral-900/90 border border-neutral-700/80 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-accent/70 focus:ring-1 focus:ring-accent/40 transition-all box-border" 
        />
      </div>

      {/* Password Form Group */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label 
            htmlFor="password" 
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-300"
          >
            Password
          </label>
          <Link 
            href="/admin/forgot-password" 
            className="text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors focus:outline-none focus-visible:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input 
          id="password"
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          required 
          autoComplete="current-password"
          className="block w-full h-11 px-3.5 py-2.5 bg-neutral-900/90 border border-neutral-700/80 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-accent/70 focus:ring-1 focus:ring-accent/40 transition-all box-border" 
        />
      </div>

      {/* Primary CTA Action */}
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
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center text-neutral-200 p-4 sm:p-6 lg:p-8 relative selection:bg-accent selection:text-white">
      {/* High-Performance Animated Tech Background */}
      <div 
        className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#0c0d10]"
        aria-hidden="true"
      >
        {/* Layer 1: Subtle Tech Grid with drifting animation */}
        <div 
          className="absolute inset-0 opacity-[0.07] animate-tech-grid"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Layer 2: Ambient Deep Crimson Breathing Glow */}
        <div 
          className="absolute top-1/2 left-1/2 w-[580px] h-[580px] rounded-full blur-[130px] pointer-events-none animate-ambient-pulse"
          style={{
            background: "radial-gradient(circle, rgba(220, 38, 38, 0.14) 0%, rgba(185, 28, 28, 0.05) 55%, transparent 75%)",
            willChange: "transform, opacity",
          }}
        />

        {/* Layer 3: Soft Radial Vignette */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 35%, #0c0d10 90%)",
          }}
        />
      </div>

      {/* Editorial Auth Card */}
      <div className="w-full max-w-[420px] bg-[#14171c]/95 border border-white/10 shadow-2xl shadow-black/80 rounded-2xl p-8 sm:p-10 relative z-10 flex flex-col items-center backdrop-blur-sm">
        
        {/* Header Section with Brand Mark */}
        <div className="flex flex-col items-center mb-6 text-center w-full">
          <div className="flex items-center gap-2.5 mb-3">
            <Logo variant="sans" className="text-2xl text-white" />
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase bg-white/5 border border-white/10 text-neutral-400 rounded">
              Console
            </span>
          </div>

          <h1 className="sr-only">Sign In to xSypher Editorial Console</h1>
          <p className="text-neutral-400 text-xs sm:text-sm font-normal tracking-wide">
            Sign in to access editorial newsroom & CMS
          </p>
        </div>

        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-12 text-neutral-400 space-y-4">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
            <p className="text-sm font-medium">Loading console...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>

      </div>
      
      {/* Return Link & Footer */}
      <div className="mt-6 mb-3 relative z-10 flex flex-col items-center gap-3 text-center">
        <Link 
          href="/" 
          className="group inline-flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors duration-200 py-1.5 px-3.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
        >
          <ArrowLeft className="w-4 h-4 text-neutral-400 group-hover:text-white transition-transform duration-200 group-hover:-translate-x-1" />
          <span>Return to publication</span>
        </Link>
        <p className="text-[11px] text-neutral-500 tracking-wider uppercase">
          &copy; {new Date().getFullYear()} xSypher Media Network · Authorized Editorial Staff Only
        </p>
      </div>

    </div>
  );
}
