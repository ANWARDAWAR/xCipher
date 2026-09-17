"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { subscribeNewsletter } from "@/app/actions/newsletter";

interface Props {
  className?: string;
  style?: React.CSSProperties;
}

export default function NewsletterSignup({ className = "news-band", style }: Props) {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    
    startTransition(async () => {
      const res = await subscribeNewsletter(email);
      if (res.success) {
        setIsSubscribed(true);
      } else {
        alert(res.error || "Failed to subscribe");
      }
    });
  };

  return (
    <section className={className} style={style} aria-labelledby="nlH" data-reveal>
      <div>
        <h2 id="nlH">Get the biggest tech stories, <em>without the noise.</em></h2>
        <p>The xCipher Daily Brief — one email each morning with the stories that matter, our analysis, and nothing you didn't ask for. Free forever, unsubscribe anytime.</p>
      </div>
      <div>
        {isSubscribed ? (
          <div className="news-ok">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m8 12.5 2.6 2.6L16 9.5" />
            </svg>
            <div>
              <b>You're on the list.</b>
              <span>Watch for the next Daily Brief in your inbox tomorrow morning.</span>
            </div>
          </div>
        ) : (
          <>
            <form className="news-form" id="nlForm" onSubmit={handleSubmit} noValidate>
              <label className="sr-only" htmlFor="nlEmail">Email address</label>
              <input 
                type="email" 
                id="nlEmail" 
                placeholder="you@example.com" 
                required 
                autoComplete="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
              />
              <button className="btn btn-solid" type="submit" disabled={isPending}>
                {isPending ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
            <p className="news-note" id="nlNote">
              By subscribing you agree to our <Link href="/page/privacy" style={{ textDecoration: "underline" }}>privacy policy</Link>. We never sell your data or share your address. One email a day — that's the deal.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
