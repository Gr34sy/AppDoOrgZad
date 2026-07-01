import { ChevronLeft, ChevronRight } from "lucide-react";
import { getServerSession } from "next-auth";
import { RealtimeRefresh } from "@/components/layout/realtime-refresh";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { authOptions } from "@/lib/auth";

function getUserInitial(name?: string | null, email?: string | null) {
  const label = name || email || "User";
  return label.trim().charAt(0).toUpperCase();
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name || session?.user?.email || "Signed in user";
  const userInitial = getUserInitial(session?.user?.name, session?.user?.email);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--app-background)] text-zinc-950 dark:text-zinc-50">
      <RealtimeRefresh />
      <input id="app-sidebar-toggle" type="checkbox" className="peer sr-only" aria-hidden="true" />
      <label
        htmlFor="app-sidebar-toggle"
        className="fixed left-4 top-4 z-50 grid h-10 w-10 cursor-pointer place-items-center rounded-md bg-white text-zinc-900 shadow-lg shadow-zinc-950/10 transition hover:bg-zinc-100 lg:hidden dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        aria-label="Toggle navigation"
      >
        <ChevronRight aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
      </label>
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[min(18rem,calc(100vw-2rem))] -translate-x-full flex-col border-r border-zinc-200 bg-white px-4 py-5 shadow-2xl shadow-zinc-950/10 transition-[transform,width] duration-300 peer-checked:translate-x-0 peer-checked:lg:w-20 lg:w-72 lg:translate-x-0 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="sidebar-user flex items-center gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-zinc-950 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
            {userInitial}
          </div>
          <div className="sidebar-collapsible min-w-0">
            <p className="truncate text-sm font-semibold">{userName}</p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Task Manager</p>
          </div>
          <label
            htmlFor="app-sidebar-toggle"
            className="ml-auto hidden h-8 w-8 cursor-pointer place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 lg:grid dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
            aria-label="Collapse navigation"
            title="Toggle sidebar"
          >
            <ChevronLeft
              aria-hidden="true"
              className="sidebar-expanded-icon h-4 w-4"
              strokeWidth={2.5}
            />
            <ChevronRight
              aria-hidden="true"
              className="sidebar-collapsed-icon hidden h-4 w-4"
              strokeWidth={2.5}
            />
          </label>
        </div>

        <SidebarNav />

        <div className="sidebar-collapsible mt-auto grid gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <SignOutButton />
        </div>
      </aside>
      <main className="mx-auto w-full min-w-0 max-w-7xl px-4 py-20 transition-[margin] duration-300 sm:px-6 lg:ml-72 lg:px-8 lg:py-8 peer-checked:lg:ml-20">
        {children}
      </main>
    </div>
  );
}
