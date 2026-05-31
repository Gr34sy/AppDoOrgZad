import Link from "next/link";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { ThemeSelector } from "@/components/theme/theme-selector";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard", label: "Notes" },
  { href: "/dashboard", label: "Checklists" },
  { href: "/dashboard", label: "Tasks" },
  { href: "/dashboard", label: "Projects" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="text-lg font-semibold tracking-normal">
            Task Manager
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300 md:flex">
              {navigationItems.map((item) => (
                <Link key={item.label} href={item.href} className="transition hover:text-brand-600">
                  {item.label}
                </Link>
              ))}
            </nav>
            <ThemeSelector />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
