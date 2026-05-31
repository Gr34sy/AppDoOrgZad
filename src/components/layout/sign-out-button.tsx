"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut({ redirect: false, callbackUrl: "/login" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium transition hover:border-brand-500 hover:text-brand-600 dark:border-zinc-700"
    >
      Sign out
    </button>
  );
}
