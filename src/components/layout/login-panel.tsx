"use client";

import { signIn } from "next-auth/react";

type LoginProvider = {
  id: string;
  name: string;
};

type LoginPanelProps = {
  providers: LoginProvider[];
};

function getAuthorizationParams(providerId: string): Record<string, string> | undefined {
  if (providerId === "google") {
    return { prompt: "login" };
  }

  return undefined;
}

export function LoginPanel({ providers }: LoginPanelProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--app-background)] px-4">
      <section className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Choose an OAuth provider to access your workspace.
        </p>
        <div className="mt-6 grid gap-3">
          {providers.length > 0 ? (
            providers.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() =>
                  signIn(
                    provider.id,
                    { callbackUrl: "/dashboard" },
                    getAuthorizationParams(provider.id)
                  )
                }
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:border-[var(--app-accent)] hover:text-[var(--app-accent)] dark:border-zinc-700"
              >
                Continue with {provider.name}
              </button>
            ))
          ) : (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
              OAuth is not configured yet.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
