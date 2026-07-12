"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowDownUp, Filter, Search, SlidersHorizontal } from "lucide-react";
import { defaultSortOptions } from "@/lib/list-query";
import { SortDirectionButton } from "@/components/dashboard/sort-direction-button";

type ListEntityType = "notes" | "tasks" | "checklists" | "projects";

type SelectOption = {
  label: string;
  value: string;
};

type ListControlsProps = {
  entityType: ListEntityType;
  searchValue: string;
  sortValue: string;
  sortDirection: "asc" | "desc";
  clearHref: string;
  filterValue?: string;
  filterOptions?: SelectOption[];
};

const priorityOptions = [
  { label: "low", value: "low" },
  { label: "medium", value: "medium" },
  { label: "high", value: "high" },
  { label: "urgent", value: "urgent" }
];

const taskProjectSortOptions = [
  ...defaultSortOptions,
  { label: "due date", value: "due" },
  { label: "priority", value: "priority" }
];

const controlConfig: Record<
  ListEntityType,
  {
    filterName?: string;
    filterLabel?: string;
    filterPlaceholder?: string;
    filterOptions?: SelectOption[];
    sortOptions: SelectOption[];
  }
> = {
  notes: {
    sortOptions: defaultSortOptions
  },
  tasks: {
    filterName: "priority",
    filterLabel: "Priority",
    filterPlaceholder: "all priorities",
    filterOptions: priorityOptions,
    sortOptions: taskProjectSortOptions
  },
  checklists: {
    sortOptions: defaultSortOptions
  },
  projects: {
    filterName: "priority",
    filterLabel: "Priority",
    filterPlaceholder: "all priorities",
    filterOptions: priorityOptions,
    sortOptions: taskProjectSortOptions
  }
};

export function ListControls({
  entityType,
  searchValue,
  sortValue,
  sortDirection,
  clearHref,
  filterValue = "",
  filterOptions
}: ListControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const config = controlConfig[entityType];
  const resolvedFilterOptions = filterOptions ?? config.filterOptions ?? [];
  const hasFilter = Boolean(config.filterName);
  const [direction, setDirection] = useState<"asc" | "desc">(sortDirection);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const query = getFormValue(formData, "q");
    const selectedFilter = config.filterName ? getFormValue(formData, config.filterName) : "";
    const selectedSort = getFormValue(formData, "sort");
    const selectedDirection = getFormValue(formData, "direction");

    if (query) {
      params.set("q", query);
    }

    if (config.filterName && selectedFilter) {
      params.set(config.filterName, selectedFilter);
    }

    if (selectedSort && selectedSort !== "updated") {
      params.set("sort", selectedSort);
    }

    if (selectedDirection === "asc") {
      params.set("direction", selectedDirection);
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative grid gap-3 overflow-hidden rounded-md border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--app-accent),#38bdf8,#a78bfa)]"
      />
      <div
        className={`grid min-w-0 items-end gap-3 ${
          hasFilter
            ? "lg:grid-cols-[minmax(16rem,24rem)_minmax(10rem,0.75fr)_minmax(10rem,0.75fr)_auto_auto_auto]"
            : "lg:grid-cols-[minmax(16rem,24rem)_minmax(10rem,0.75fr)_auto_auto_auto]"
        } lg:justify-start`}
      >
        <div className="w-full min-w-0">
          <label htmlFor={`${entityType}-search`} className="sr-only">
            Search
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              strokeWidth={2.25}
            />
            <input
              id={`${entityType}-search`}
              name="q"
              type="search"
              defaultValue={searchValue}
              placeholder="Search"
              className="h-11 w-full rounded-full border border-zinc-300 bg-white pl-11 pr-4 text-sm text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-700 focus:ring-2 focus:ring-zinc-950/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-300 dark:focus:ring-white/10"
            />
          </div>
        </div>

        {hasFilter ? (
          <label className="grid min-w-0 gap-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
              <Filter aria-hidden="true" className="h-3.5 w-3.5 text-[var(--app-accent)]" />
              {config.filterLabel ?? "Filter"}
            </span>
            <select
              name={config.filterName}
              defaultValue={filterValue}
              className="h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--app-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:bg-zinc-950"
            >
              <option value="">{config.filterPlaceholder ?? "all"}</option>
              {resolvedFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="grid min-w-0 gap-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
            <ArrowDownUp aria-hidden="true" className="h-3.5 w-3.5 text-sky-500" />
            Sort
          </span>
          <select
            name="sort"
            defaultValue={sortValue}
            className="h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--app-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:bg-zinc-950"
          >
            {config.sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <input type="hidden" name="direction" value={direction} />
        <SortDirectionButton
          direction={direction}
          onToggle={() => setDirection((current) => current === "asc" ? "desc" : "asc")}
        />

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
          Apply
        </button>
        <button
          type="button"
          onClick={() => router.push(clearHref)}
          className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:border-[var(--app-accent)] hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
        >
          Clear
        </button>
      </div>
    </form>
  );
}

function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
