import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import SetupForm from "./SetupForm";

export default async function SetupPage() {
  const userCount = await db.user.count();

  if (userCount > 0) {
    redirect("/admin/login");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md p-8 bg-[#111] rounded-2xl border border-white/10">
        <h1 className="text-2xl font-semibold mb-2">Welcome to xCipher</h1>
        <p className="text-white/60 mb-6">Create the initial Owner account to access the newsroom CMS.</p>
        <SetupForm />
      </div>
    </div>
  );
}
