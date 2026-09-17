import { unsubscribeByToken } from "@/app/actions/newsletter";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await unsubscribeByToken(token);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
      padding: "24px",
    }}>
      <div style={{
        maxWidth: "480px",
        width: "100%",
        padding: "40px 32px",
        background: "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-1)",
        textAlign: "center",
      }}>
        {result.success ? (
          <>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke={result.alreadyDone ? "var(--ink-muted)" : "var(--success)"}
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{ margin: "0 auto 20px" }}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m8 12.5 2.6 2.6L16 9.5" />
            </svg>
            <h1 style={{ fontSize: "22px", marginBottom: "12px" }}>
              {result.alreadyDone ? "Already Unsubscribed" : "You've Been Unsubscribed"}
            </h1>
            <p style={{ color: "var(--ink-muted)", marginBottom: "28px", lineHeight: 1.6 }}>
              {result.message} You will no longer receive the xCipher Daily Brief.
            </p>
            <p style={{ fontSize: "13px", color: "var(--ink-muted)", marginBottom: "24px" }}>
              Changed your mind?{" "}
              <Link href="/" style={{ color: "var(--accent)", textDecoration: "underline" }}>
                Resubscribe on our homepage
              </Link>.
            </p>
          </>
        ) : (
          <>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--error, #e53e3e)"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{ margin: "0 auto 20px" }}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6M9 9l6 6" />
            </svg>
            <h1 style={{ fontSize: "22px", marginBottom: "12px" }}>Invalid Link</h1>
            <p style={{ color: "var(--ink-muted)", marginBottom: "28px", lineHeight: 1.6 }}>
              {result.error || "This unsubscribe link is invalid or has expired."}
            </p>
          </>
        )}
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "10px 24px",
            background: "var(--accent)",
            color: "#fff",
            borderRadius: "var(--r-md)",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          ← Back to xCipher
        </Link>
      </div>
    </div>
  );
}
