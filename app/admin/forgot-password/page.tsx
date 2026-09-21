import ForgotPasswordForm from "./ForgotPasswordForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center text-neutral-200 p-4 sm:p-6 lg:p-8 relative selection:bg-accent selection:text-white">
      {/* High-Performance Animated Tech Background */}
      <div 
        className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#0c0d10]"
        aria-hidden="true"
      >
        <div 
          className="absolute inset-0 opacity-[0.07] animate-tech-grid"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div 
          className="absolute top-1/2 left-1/2 w-[580px] h-[580px] rounded-full blur-[130px] pointer-events-none animate-ambient-pulse"
          style={{
            background: "radial-gradient(circle, rgba(220, 38, 38, 0.14) 0%, rgba(185, 28, 28, 0.05) 55%, transparent 75%)",
            willChange: "transform, opacity",
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 35%, #0c0d10 90%)",
          }}
        />
      </div>

      <div className="w-full max-w-[420px] bg-[#14171c]/95 border border-white/10 shadow-2xl shadow-black/80 rounded-2xl p-8 sm:p-10 relative z-10 flex flex-col items-center backdrop-blur-sm">
        
        <div className="flex flex-col items-center mb-6 text-center w-full">
          <div className="flex items-center gap-2.5 mb-3">
            <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" className="text-white shrink-0">
              <rect x="1" y="1" width="10" height="10" fill="currentColor" />
              <rect x="15" y="1" width="10" height="10" fill="currentColor" opacity=".35" />
              <rect x="1" y="15" width="10" height="10" fill="currentColor" opacity=".35" />
              <path d="M15.5 15.5 24.5 24.5M24.5 15.5l-9 9" stroke="#f04552" strokeWidth="3.2" strokeLinecap="round" />
            </svg>
            <span className="text-2xl font-bold tracking-tight text-white font-[var(--f-ui)]">
              x<span className="text-[#f04552]">Sypher</span>
            </span>
          </div>

          <h1 className="sr-only">Forgot Password</h1>
          <p className="text-neutral-400 text-xs sm:text-sm font-normal tracking-wide">
            Reset your xSypher editorial password
          </p>
        </div>

        <ForgotPasswordForm />

      </div>
      
      <div className="mt-6 mb-3 relative z-10 flex flex-col items-center gap-3 text-center">
        <Link 
          href="/admin/login" 
          className="group inline-flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors duration-200 py-1.5 px-3.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
        >
          <ArrowLeft className="w-4 h-4 text-neutral-400 group-hover:text-white transition-transform duration-200 group-hover:-translate-x-1" />
          <span>Back to sign in</span>
        </Link>
      </div>

    </div>
  );
}
