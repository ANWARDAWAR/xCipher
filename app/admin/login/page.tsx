"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("from") || "/admin";
  const setupSuccess = searchParams.get("setup") === "success";

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {setupSuccess && (
        <div className="p-3 bg-green-500/10 text-green-400 rounded text-sm mb-2">
          Setup complete! You may now log in with your new Owner account.
        </div>
      )}
      {error && <div className="p-3 bg-red-500/10 text-red-400 rounded text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
          className="w-full bg-white/5 border border-white/10 rounded-lg p-2 focus:border-white/30 outline-none" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
          className="w-full bg-white/5 border border-white/10 rounded-lg p-2 focus:border-white/30 outline-none" 
        />
      </div>
      <button 
        type="submit" 
        disabled={loading} 
        className="w-full py-2 bg-white text-black font-semibold rounded-lg mt-2 hover:bg-gray-200 disabled:opacity-50 transition-colors"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md p-8 bg-[#111] rounded-2xl border border-white/10">
        <h1 className="text-2xl font-semibold mb-2">Sign in to xCipher</h1>
        <p className="text-white/60 mb-6">Enter your credentials to access the editorial console.</p>
        <Suspense fallback={<div className="text-white/50">Loading form...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
