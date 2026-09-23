"use client";

import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { subscribeNewsletter } from "@/app/actions/newsletter";
import { showToast } from "@/lib/utils";

export default function NewsletterPageForm() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    startTransition(async () => {
      const res = await subscribeNewsletter(email, "NEWSLETTER_PAGE");
      if (res.success) {
        showToast("You're on the list! Watch for the next Daily Brief.", "success", "premium");
        setEmail("");
      } else if ((res as any).code === "ALREADY_SUBSCRIBED") {
        showToast("You're already subscribed to the Daily Brief.", "info", "premium");
        setEmail("");
      } else {
        showToast(res.error || "Something went wrong. Please try again.", "error", "premium");
      }
    });
  };

  return (
    <div className="my-8 bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-8 sm:p-10 text-center relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50"></div>
      <div className="w-14 h-14 rounded-full bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] mx-auto mb-5 shadow-sm">
        <Mail className="w-7 h-7" />
      </div>
      <h2 className="font-[family:var(--f-display)] font-bold text-2xl sm:text-3xl text-[var(--ink)] mb-3">
        Join The Inner Circle
      </h2>
      <p className="font-[family:var(--f-body)] text-sm sm:text-base text-[var(--muted)] mb-8 max-w-lg mx-auto leading-relaxed">
        Subscribe to the Daily Brief to receive our uncompromising insights delivered directly to your inbox.
      </p>
      
      <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col gap-4">
        <div className="relative">
          <input 
            type="email" 
            name="email"
            placeholder="Enter your email address..." 
            className="w-full px-5 py-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 transition-all font-[family:var(--f-body)] placeholder-[var(--muted)] text-sm sm:text-base shadow-sm"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
          />
        </div>
        <button 
          type="submit"
          disabled={isPending}
          className={`group relative w-full overflow-hidden py-3.5 px-6 !bg-[var(--accent)] dark:!bg-[var(--accent)] !text-white dark:!text-white font-[family:var(--f-ui)] font-bold tracking-wide rounded-xl flex items-center justify-center transition-all duration-300 shadow-md ${isPending ? "opacity-70 cursor-not-allowed" : "hover:shadow-lg hover:-translate-y-0.5"}`}
        >
          <span className="relative z-10 flex items-center gap-2">
            {isPending ? "Subscribing..." : "Subscribe Now"}
            {!isPending && (
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </span>
          {!isPending && (
            <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out z-0"></div>
          )}
        </button>
        <p className="text-xs text-[var(--muted)] font-[family:var(--f-ui)] mt-2">
          By subscribing, you agree to our <a href="/page/privacy-policy" className="text-[var(--ink)] hover:text-[var(--accent)] underline transition-colors">Privacy Policy</a>.
        </p>
      </form>
    </div>
  );
}
