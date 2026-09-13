import { CheckSquare, ClipboardList, FolderKanban, Plus, StickyNote } from "lucide-react";
import { ReturnToLink } from "@/components/dashboard/return-to-link";

const quickActions = [
  {
    href: "/dashboard/tasks/new",
    label: "Task",
    icon: ClipboardList
  },
  {
    href: "/dashboard/checklists/new",
    label: "Checklist",
    icon: CheckSquare
  },
  {
    href: "/dashboard/notes/new",
    label: "Note",
    icon: StickyNote
  },
  {
    href: "/dashboard/projects/new",
    label: "Project",
    icon: FolderKanban
  }
];

export function QuickCreateActions() {
  return (
    <section className="px-1 py-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 pr-1 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
          Quick create
        </span>
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <ReturnToLink
              key={action.href}
              href={action.href}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 text-xs font-medium text-zinc-700 transition hover:border-[var(--app-accent)] hover:text-[var(--app-accent)] dark:border-zinc-800 dark:text-zinc-300"
            >
              <Icon aria-hidden="true" className="h-3.5 w-3.5" />
              {action.label}
            </ReturnToLink>
          );
        })}
      </div>
    </section>
  );
}
