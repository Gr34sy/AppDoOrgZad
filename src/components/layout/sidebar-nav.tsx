"use client";

import Link from "next/link";
import {
  CalendarCheck,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  NotebookText,
  Settings
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/notes", label: "Notes", icon: NotebookText },
  { href: "/dashboard/checklists", label: "Checklists", icon: ListChecks },
  { href: "/dashboard/tasks", label: "Tasks", icon: CalendarCheck },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 grid gap-2">
      {navigationItems.map((item) => {
        const isActive = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-[var(--app-accent)] text-white shadow-sm shadow-zinc-950/10"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
            }`}
          >
            <span
              className={`grid h-8 w-8 place-items-center transition ${
                isActive
                  ? "text-white"
                  : "text-zinc-500 group-hover:text-zinc-950 dark:text-zinc-400 dark:group-hover:text-white"
              }`}
            >
              <item.icon aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <span className="sidebar-collapsible">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
