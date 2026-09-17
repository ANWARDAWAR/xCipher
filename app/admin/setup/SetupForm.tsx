"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setupOwner } from "@/app/actions/setup";

export default function SetupForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    const res = await setupOwner(email, password, name);

    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/admin/login?setup=success");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="p-3 bg-red-500/10 text-red-400 rounded text-sm">{error}</div>}
      
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input name="name" type="text" required className="w-full bg-white/5 border border-white/10 rounded-lg p-2 focus:border-white/30 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input name="email" type="email" required className="w-full bg-white/5 border border-white/10 rounded-lg p-2 focus:border-white/30 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input name="password" type="password" required minLength={8} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 focus:border-white/30 outline-none" />
      </div>
      <button type="submit" disabled={loading} className="w-full py-2 bg-white text-black font-semibold rounded-lg mt-2 hover:bg-gray-200 disabled:opacity-50 transition-colors">
        {loading ? "Creating..." : "Create Owner Account"}
      </button>
    </form>
  );
}
