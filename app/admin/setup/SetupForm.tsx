"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setupOwner } from "@/app/actions/setup";
import { Eye, EyeOff } from "lucide-react";

export default function SetupForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      {error && <div className="p-3 bg-bad/10 text-bad rounded text-sm">{error}</div>}
      
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input name="name" type="text" required className="w-full bg-white/5 border border-white/10 rounded-lg p-2 focus:border-white/30 outline-none [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_50px_#121212_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:white]" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input name="email" type="email" required className="w-full bg-white/5 border border-white/10 rounded-lg p-2 focus:border-white/30 outline-none [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_50px_#121212_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:white]" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <div className="relative">
          <input name="password" type={showPassword ? "text" : "password"} required minLength={8} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 pr-10 focus:border-white/30 outline-none [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_50px_#121212_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:white]" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 focus:outline-none transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={loading} className="w-full py-2 bg-white text-black font-semibold rounded-lg mt-2 hover:bg-gray-200 disabled:opacity-50 transition-colors">
        {loading ? "Creating..." : "Create Owner Account"}
      </button>
    </form>
  );
}
