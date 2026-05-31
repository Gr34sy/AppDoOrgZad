"use client";

import { signIn } from "next-auth/react";

const providers = [
  { id: "google", label: "Continue with Google" },
  { id: "github", label: "Continue with GitHub" },
  { id: "facebook", label: "Continue with Facebook" }
];

export function LoginPanel() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <section className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Choose an OAuth provider to access your workspace.
        </p>
        <div className="mt-6 grid gap-3">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => signIn(provider.id, { callbackUrl: "/dashboard" })}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:border-brand-500 hover:text-brand-600 dark:border-zinc-700"
            >
              {provider.label}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
