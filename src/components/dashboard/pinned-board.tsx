import Link from "next/link";
import { PinnedItemsSearch } from "@/components/dashboard/pinned-items-search";

type PinnedItem = {
  id: string;
  title: string;
  type: string;
  meta: string;
  status: string;
  href: string;
};

type DashboardMetric = {
  title: string;
  count: number;
  colorKey: "notes" | "checklists" | "tasks" | "projects";
  items: Array<{
    id: string;
    title: string;
    href: string;
    updatedAt: string;
    meta: string;
    priority?: string;
  }>;
};

type CalendarEvent = {
  id: string;
  title: string;
  type: string;
  date: string;
  priority: string;
  status: string;
  href: string;
};

type PinnedBoardProps = {
  pinnedItems: PinnedItem[];
  dashboardMetrics: DashboardMetric[];
  calendarEvents: CalendarEvent[];
};

const typeStyles: Record<string, string> = {
  Note: "border-fuchsia-300/70 bg-fuchsia-100 text-fuchsia-950",
  Checklist: "border-emerald-300/70 bg-emerald-100 text-emerald-950",
  Task: "border-sky-300/70 bg-sky-100 text-sky-950",
  Project: "border-violet-300/70 bg-violet-100 text-violet-950"
};

const priorityStyles: Record<string, string> = {
  low: "bg-emerald-400",
  medium: "bg-sky-400",
  high: "bg-fuchsia-400",
  urgent: "bg-rose-500"
};

const dashboardMetricStyles: Record<DashboardMetric["colorKey"], string> = {
  notes: "bg-[var(--dashboard-upcoming-color)]",
  checklists: "bg-[var(--dashboard-todo-color)]",
  tasks: "bg-[var(--dashboard-progress-color)]",
  projects: "bg-[var(--dashboard-completed-color)]"
};

function buildCalendarDays(events: CalendarEvent[]) {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const startOffset = (monthStart.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + monthEnd.getDate()) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), index - startOffset + 1);
    const dateKey = date.toISOString().slice(0, 10);

    return {
      date,
      dateKey,
      isCurrentMonth: date.getMonth() === today.getMonth(),
      isToday: date.toDateString() === today.toDateString(),
      events: events.filter((event) => event.date.slice(0, 10) === dateKey)
    };
  });
}

function formatUpdatedAt(date: string) {
  return date ? `Updated ${new Date(date).toLocaleDateString("en")}` : "Recently updated";
}

function MetricOverlay({
  emptyLabel,
  items
}: {
  emptyLabel: string;
  items: Array<{
    id: string;
    title: string;
    href: string;
    meta?: string;
    priority?: string;
    updatedAt?: string;
  }>;
}) {
  return (
    <div className="absolute left-0 top-full z-30 hidden w-[min(20rem,calc(100vw-2rem))] pt-2 group-hover:block">
      <div className="rounded-lg border border-zinc-200 bg-white p-3 text-zinc-950 shadow-xl shadow-zinc-950/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
        {items.length ? (
          <div className="grid">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="grid grid-cols-[auto_1fr] gap-3 rounded-lg border-b border-zinc-200 p-2 transition last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950/60"
              >
                <span
                  className={`mt-1 h-2.5 w-2.5 rounded-full ${
                    priorityStyles[item.priority ?? ""] ?? "bg-[var(--dashboard-accent)]"
                  }`}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{item.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {[item.meta, item.updatedAt ? formatUpdatedAt(item.updatedAt) : null]
                      .filter(Boolean)
                      .join(" / ")}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}

export function PinnedBoard({ pinnedItems, dashboardMetrics, calendarEvents }: PinnedBoardProps) {
  const calendarDays = buildCalendarDays(calendarEvents);
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    new Date()
  );

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,340px)] xl:justify-start">
          <div className="grid h-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:grid-rows-2 xl:max-w-[412px]">
            {dashboardMetrics.map((metric) => (
              <div
                key={metric.title}
                className={`group relative z-0 rounded-lg ${
                  dashboardMetricStyles[metric.colorKey] ?? "bg-zinc-900"
                } p-3 shadow-lg shadow-black/20 transition hover:z-20 hover:-translate-y-0.5 hover:shadow-xl focus-within:z-20`}
              >
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="text-[11px] font-medium uppercase text-zinc-200">
                    {metric.title}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-100">{metric.count}</p>
                </div>
                <MetricOverlay
                  emptyLabel={`No recently updated ${metric.title.toLowerCase()}`}
                  items={metric.items.map((item) => ({
                    id: item.id,
                    title: item.title,
                    href: item.href,
                    meta: item.meta,
                    priority: item.priority,
                    updatedAt: item.updatedAt
                  }))}
                />
              </div>
            ))}
          </div>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{monthLabel}</h2>
              <span className="rounded-md bg-[color-mix(in_srgb,var(--dashboard-calendar-color)_18%,transparent)] px-2 py-1 text-xs font-semibold text-[var(--dashboard-calendar-color)]">
                {calendarEvents.length}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-zinc-400 dark:text-zinc-500">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <span key={`${day}-${index}`}>{day}</span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {calendarDays.map((day) => (
                <div
                  key={day.dateKey}
                  className={`relative aspect-square rounded-md border p-1 text-[11px] ${
                    day.isToday
                      ? "border-[var(--dashboard-calendar-color)] bg-[var(--dashboard-calendar-color)] font-semibold text-white"
                    : day.isCurrentMonth
                        ? "border-zinc-200 bg-[color-mix(in_srgb,var(--dashboard-calendar-color)_8%,transparent)] text-zinc-700 dark:border-zinc-800 dark:text-zinc-200"
                        : "border-transparent bg-transparent text-zinc-300 dark:text-zinc-700"
                  }`}
                >
                  <span>{day.date.getDate()}</span>
                  {day.events.length > 0 ? (
                    <div className="absolute inset-x-1 bottom-1 flex justify-center gap-0.5">
                      {day.events.slice(0, 3).map((event) => (
                        <span
                          key={event.id}
                          className={`h-1 w-1 rounded-full ${
                            priorityStyles[event.priority] ?? "bg-[var(--dashboard-calendar-color)]"
                          }`}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <PinnedItemsSearch pinnedItems={pinnedItems} typeStyles={typeStyles} />
    </div>
  );
}
