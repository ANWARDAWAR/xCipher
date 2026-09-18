"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { subscribeNewsletter } from "@/app/actions/newsletter";

interface Props {
  className?: string;
  style?: React.CSSProperties;
  source?: string;
}

export default function NewsletterSignup({ className = "news-band", style, source = "HOMEPAGE" }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "already" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    startTransition(async () => {
      const res = await subscribeNewsletter(email, source);
      if (res.success) {
        setStatus("success");
      } else if ((res as any).code === "ALREADY_SUBSCRIBED") {
        setStatus("already");
      } else {
        setStatus("error");
        setErrorMsg(res.error || "Something went wrong. Please try again.");
      }
    });
  };

  return (
    <section className={className} style={style} aria-labelledby="nlH" data-reveal>
      <div>
        <h2 id="nlH">Get the biggest tech stories, <em>without the noise.</em></h2>
        <p>The xSypher Daily Brief — one email each morning with the stories that matter, our analysis, and nothing you didn't ask for. Free forever, unsubscribe anytime.</p>
      </div>
      <div>
        {status === "success" && (
          <div className="news-ok" role="status" aria-live="polite">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m8 12.5 2.6 2.6L16 9.5" />
            </svg>
            <div>
              <b>You're on the list.</b>
              <span>Watch for the next Daily Brief in your inbox tomorrow morning.</span>
            </div>
          </div>
        )}

        {status === "already" && (
          <div className="news-ok" role="status" aria-live="polite">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m8 12.5 2.6 2.6L16 9.5" />
            </svg>
            <div>
              <b>You're already subscribed.</b>
              <span>This email is already on the Daily Brief list.</span>
            </div>
          </div>
        )}

        {(status === "idle" || status === "error") && (
          <>
            <form className="news-form" id="nlForm" onSubmit={handleSubmit} noValidate aria-describedby="nlNote">
              <label className="sr-only" htmlFor="nlEmail">Email address</label>
              <input
                type="email"
                id="nlEmail"
                placeholder="you@example.com"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
                disabled={isPending}
                aria-invalid={status === "error"}
                aria-describedby={status === "error" ? "nlError" : "nlNote"}
              />
              <button className="btn btn-solid" type="submit" disabled={isPending}>
                {isPending ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
            {status === "error" && (
              <p id="nlError" role="alert" aria-live="assertive" style={{ fontSize: "13px", color: "var(--error, #e53e3e)", marginTop: "6px" }}>
                {errorMsg}
              </p>
            )}
            <p className="news-note" id="nlNote">
              By subscribing you agree to our <Link href="/page/privacy" style={{ textDecoration: "underline" }}>privacy policy</Link>. We never sell your data or share your address. One email a day — that's the deal.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
