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
      <section className="app-page max-w-2xl">
        <div>
          <h1 className="app-page-title">Settings</h1>
          <p className="app-page-description">
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
