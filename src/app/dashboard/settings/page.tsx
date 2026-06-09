import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ColorThemeSettings } from "@/components/theme/color-theme-settings";
import { authOptions } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <AppShell>
      <section className="grid max-w-2xl gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Settings</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Adjust the application appearance.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold tracking-normal">Color theme</h2>
          <div className="mt-4">
            <ColorThemeSettings />
          </div>
        </div>
      </section>
    </AppShell>
  );
}
