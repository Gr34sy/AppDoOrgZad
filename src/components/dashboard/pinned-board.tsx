import type { ListControlSettings } from "@/lib/list-preferences";
import { DashboardMetricTile, type DashboardMetric } from "@/components/dashboard/dashboard-metric-tile";
import { PinnedItemsSearch } from "@/components/dashboard/pinned-items-search";
import { QuickCreateActions } from "@/components/dashboard/quick-create-actions";

type PinnedItem = {
  id: string;
  position: number;
  title: string;
  description: string;
  type: string;
  meta: string;
  status: string;
  priority?: string;
  tags: string[];
  items?: Array<{ title: string; isCompleted?: boolean }>;
  canFilterRelation: boolean;
  relationTargets: Array<"project" | "task">;
  createdAt: string;
  updatedAt: string;
  href: string;
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
  initialListSettings?: ListControlSettings;
  pinnedItems: PinnedItem[];
  dashboardMetrics: DashboardMetric[];
  calendarEvents: CalendarEvent[];
};

const priorityStyles: Record<string, string> = {
  low: "bg-emerald-400",
  medium: "bg-sky-400",
  high: "bg-fuchsia-400",
  urgent: "bg-rose-500"
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

export function PinnedBoard({ pinnedItems, dashboardMetrics, calendarEvents, initialListSettings }: PinnedBoardProps) {
  const calendarDays = buildCalendarDays(calendarEvents);
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    new Date()
  );

  return (
    <div className="grid gap-6">
      <QuickCreateActions />

      <section className="grid gap-3">
        <div className="grid min-w-0 items-stretch gap-4 md:grid-cols-[minmax(0,412px)_minmax(18rem,340px)] md:justify-start">
          <div className="grid h-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:grid-rows-2">
            {dashboardMetrics.map((metric, index) => (
              <DashboardMetricTile
                key={metric.title}
                metric={metric}
                alignRight={index % 2 === 1}
              />
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

      <PinnedItemsSearch pinnedItems={pinnedItems} initialListSettings={initialListSettings} />
    </div>
  );
}
