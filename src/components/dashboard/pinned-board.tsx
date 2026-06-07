import Link from "next/link";

type PinnedItem = {
  id: string;
  title: string;
  type: string;
  meta: string;
  status: string;
  href: string;
};

type WorkflowColumn = {
  title: string;
  count: number;
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
  workflowColumns: WorkflowColumn[];
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

const workflowStyles: Record<string, string> = {
  backlog: "from-emerald-500 to-green-700",
  todo: "from-sky-500 to-blue-700",
  in_progress: "from-fuchsia-500 to-violet-700",
  testing: "from-amber-400 to-orange-600",
  done: "from-zinc-700 to-zinc-900"
};

const dashboardMetricOrder = ["todo", "in_progress", "backlog"];

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function getDashboardLabel(value: string) {
  return value === "backlog" ? "completed this quarter" : formatLabel(value);
}

function getOrderedWorkflowColumns(workflowColumns: WorkflowColumn[]) {
  const byTitle = new Map(workflowColumns.map((column) => [column.title, column]));
  const ordered = dashboardMetricOrder
    .map((title) => byTitle.get(title))
    .filter((column): column is WorkflowColumn => Boolean(column));

  return [
    ...ordered,
    ...workflowColumns.filter((column) => !dashboardMetricOrder.includes(column.title))
  ];
}

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

export function PinnedBoard({ pinnedItems, workflowColumns, calendarEvents }: PinnedBoardProps) {
  const calendarDays = buildCalendarDays(calendarEvents);
  const orderedWorkflowColumns = getOrderedWorkflowColumns(workflowColumns);
  const dashboardMetrics = orderedWorkflowColumns.slice(0, 3);
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    new Date()
  );
  const upcomingEvents = calendarEvents
    .slice()
    .sort((first, second) => first.date.localeCompare(second.date))
    .slice(0, 5);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section>
          <div>
            <div className="flex min-w-0 flex-col justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Dashboard</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {dashboardMetrics.map((column) => (
                  <div
                    key={column.title}
                    className={`rounded-lg bg-gradient-to-br ${
                      workflowStyles[column.title] ?? "from-zinc-700 to-zinc-900"
                  } p-4 shadow-lg shadow-black/20`}
                >
                  <p className="text-xs font-medium uppercase text-zinc-200">
                    {getDashboardLabel(column.title)}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-zinc-100">{column.count}</p>
                </div>
              ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-zinc-950 p-4 text-white shadow-2xl shadow-zinc-950/15">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-white">{monthLabel}</h2>
            <span className="rounded-md bg-white/15 px-2 py-1 text-xs font-semibold text-white">
              {calendarEvents.length}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-white/45">
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
                    ? "border-fuchsia-300 bg-fuchsia-300 text-zinc-950"
                    : day.isCurrentMonth
                      ? "border-white/10 bg-white/10 text-white"
                      : "border-transparent bg-transparent text-white/25"
                }`}
              >
                <span>{day.date.getDate()}</span>
                {day.events.length > 0 ? (
                  <div className="absolute inset-x-1 bottom-1 flex justify-center gap-0.5">
                    {day.events.slice(0, 3).map((event) => (
                      <span
                        key={event.id}
                        className={`h-1 w-1 rounded-full ${
                          priorityStyles[event.priority] ?? "bg-white"
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

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">Pinned items</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {pinnedItems.length ? `${pinnedItems.length} saved items` : "No saved items"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/dashboard/notes/new"
            className="rounded-md bg-zinc-950 px-4 py-2 font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Note
          </Link>
          <Link
            href="/dashboard/checklists/new"
            className="rounded-md border border-zinc-200 px-4 py-2 font-medium transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            Checklist
          </Link>
          <Link
            href="/dashboard/tasks/new"
            className="rounded-md border border-zinc-200 px-4 py-2 font-medium transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            Task
          </Link>
          <Link
            href="/dashboard/projects/new"
            className="rounded-md border border-zinc-200 px-4 py-2 font-medium transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            Project
          </Link>
        </div>
      </section>

      <div className="grid gap-6">
        <section className="grid content-start gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {pinnedItems.length ? (
            pinnedItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group min-h-44 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-950/10 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                      typeStyles[item.type] ?? "border-zinc-300 bg-zinc-100 text-zinc-900"
                    }`}
                  >
                    {item.type}
                  </span>
                  <span className="max-w-[9rem] truncate rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    {formatLabel(item.status)}
                  </span>
                </div>
                <h3 className="mt-5 line-clamp-2 text-lg font-semibold tracking-normal">
                  {item.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {item.meta}
                </p>
                <div className="mt-5 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-1.5 rounded-full ${
                      item.type === "Note"
                        ? "bg-fuchsia-400"
                        : item.type === "Checklist"
                          ? "bg-emerald-400"
                          : item.type === "Project"
                            ? "bg-violet-400"
                            : "bg-sky-400"
                    }`}
                    style={{ width: "42%" }}
                  />
                </div>
              </Link>
            ))
          ) : (
            <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-lg font-semibold">No pinned items</h3>
            </article>
          )}
        </section>

        <section className="max-w-xl rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold tracking-normal">Upcoming</h2>
            <div className="mt-4 grid gap-3">
              {upcomingEvents.length ? (
                upcomingEvents.map((event) => (
                  <Link
                    key={`${event.type}-${event.id}`}
                    href={event.href}
                    className="grid grid-cols-[auto_1fr] gap-3 rounded-lg border border-zinc-100 p-3 transition hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                  >
                    <span
                      className={`mt-1 h-3 w-3 rounded-full ${
                        priorityStyles[event.priority] ?? "bg-zinc-400"
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{event.title}</span>
                      <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                        {event.type} / {new Date(event.date).toLocaleDateString("en")}
                      </span>
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No due dates this month</p>
              )}
            </div>
        </section>
      </div>

    </div>
  );
}
