"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDownUp, Filter, RotateCcw } from "lucide-react";
import { defaultSortOptions, descriptionSortOption } from "@/lib/list-query";
import { SearchInput } from "@/components/dashboard/search-input";
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
  linkedValue?: string;
  action?: ReactNode;
};

const priorityOptions = [
  { label: "low", value: "low" },
  { label: "medium", value: "medium" },
  { label: "high", value: "high" },
  { label: "urgent", value: "urgent" }
];

const taskProjectSortOptions = [
  ...defaultSortOptions,
  descriptionSortOption,
  { label: "due date", value: "due" },
  { label: "priority", value: "priority" }
];

const noteSortOptions = [
  ...defaultSortOptions,
  descriptionSortOption
];

const linkedOptions = [
  { label: "Linked", value: "linked" },
  { label: "Linked to Project", value: "project" },
  { label: "Linked to Task", value: "task" }
];

const controlConfig: Record<
  ListEntityType,
  {
    filterName?: string;
    filterLabel?: string;
    filterPlaceholder?: string;
    filterOptions?: SelectOption[];
    linkedFilter?: boolean;
    sortOptions: SelectOption[];
    defaultSort: string;
    defaultDirection: "asc" | "desc";
  }
> = {
  notes: {
    linkedFilter: true,
    sortOptions: noteSortOptions,
    defaultSort: "position",
    defaultDirection: "asc"
  },
  tasks: {
    filterName: "priority",
    filterLabel: "Priority",
    filterPlaceholder: "all priorities",
    filterOptions: priorityOptions,
    linkedFilter: true,
    sortOptions: taskProjectSortOptions,
    defaultSort: "position",
    defaultDirection: "asc"
  },
  checklists: {
    linkedFilter: true,
    sortOptions: defaultSortOptions,
    defaultSort: "position",
    defaultDirection: "asc"
  },
  projects: {
    filterName: "priority",
    filterLabel: "Priority",
    filterPlaceholder: "all priorities",
    filterOptions: priorityOptions,
    sortOptions: taskProjectSortOptions,
    defaultSort: "position",
    defaultDirection: "asc"
  }
};

export function ListControls({
  entityType,
  searchValue,
  sortValue,
  sortDirection,
  clearHref,
  filterValue = "",
  filterOptions,
  linkedValue = "",
  action
}: ListControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const config = controlConfig[entityType];
  const resolvedFilterOptions = filterOptions ?? config.filterOptions ?? [];
  const hasFilter = Boolean(config.filterName);
  const hasLinkedFilter = Boolean(config.linkedFilter);
  const [query, setQuery] = useState(searchValue);
  const [selectedFilter, setSelectedFilter] = useState(filterValue);
  const [selectedLinkedFilter, setSelectedLinkedFilter] = useState(linkedValue);
  const [selectedSort, setSelectedSort] = useState(sortValue);
  const [direction, setDirection] = useState<"asc" | "desc">(sortDirection);
  const hasSearchSettled = useRef(false);
  const isUserOrderSort = selectedSort === "position";

  const navigateWithControls = useCallback(({
    nextQuery,
    nextFilter,
    nextLinkedFilter,
    nextSort,
    nextDirection,
    replace
  }: {
    nextQuery: string;
    nextFilter: string;
    nextLinkedFilter: string;
    nextSort: string;
    nextDirection: "asc" | "desc";
    replace: boolean;
  }) => {
    const params = new URLSearchParams();
    const trimmedQuery = nextQuery.trim();

    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }

    if (config.filterName && nextFilter) {
      params.set(config.filterName, nextFilter);
    }

    if (config.linkedFilter && nextLinkedFilter) {
      params.set("linked", nextLinkedFilter);
    }

    if (nextSort && nextSort !== config.defaultSort) {
      params.set("sort", nextSort);
    }

    if (nextSort !== "position" && nextDirection !== config.defaultDirection) {
      params.set("direction", nextDirection);
    }

    const queryString = params.toString();
    const nextHref = queryString ? `${pathname}?${queryString}` : pathname;
    const currentQueryString = searchParams.toString();
    const currentHref = currentQueryString ? `${pathname}?${currentQueryString}` : pathname;

    if (nextHref === currentHref) {
      return;
    }

    if (replace) {
      router.replace(nextHref);
      return;
    }

    router.push(nextHref);
  }, [
    config.defaultDirection,
    config.defaultSort,
    config.filterName,
    config.linkedFilter,
    pathname,
    router,
    searchParams
  ]);

  useEffect(() => {
    setQuery(searchValue);
  }, [searchValue]);

  useEffect(() => {
    setSelectedFilter(filterValue);
  }, [filterValue]);

  useEffect(() => {
    setSelectedLinkedFilter(linkedValue);
  }, [linkedValue]);

  useEffect(() => {
    setSelectedSort(sortValue);
  }, [sortValue]);

  useEffect(() => {
    setDirection(sortDirection);
  }, [sortDirection]);

  useEffect(() => {
    if (!hasSearchSettled.current) {
      hasSearchSettled.current = true;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      navigateWithControls({
        nextQuery: query,
        nextFilter: selectedFilter,
        nextLinkedFilter: selectedLinkedFilter,
        nextSort: selectedSort,
        nextDirection: direction,
        replace: true
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [direction, navigateWithControls, query, selectedFilter, selectedLinkedFilter, selectedSort]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  function handleFilterChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextFilter = event.target.value;

    setSelectedFilter(nextFilter);
    navigateWithControls({
      nextQuery: query,
      nextFilter,
      nextLinkedFilter: selectedLinkedFilter,
      nextSort: selectedSort,
      nextDirection: direction,
      replace: true
    });
  }

  function handleLinkedFilterChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLinkedFilter = event.target.value;

    setSelectedLinkedFilter(nextLinkedFilter);
    navigateWithControls({
      nextQuery: query,
      nextFilter: selectedFilter,
      nextLinkedFilter,
      nextSort: selectedSort,
      nextDirection: direction,
      replace: true
    });
  }

  function handleSortChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextSort = event.target.value;
    const nextDirection = nextSort === "position" ? "asc" : direction;

    setSelectedSort(nextSort);
    setDirection(nextDirection);
    navigateWithControls({
      nextQuery: query,
      nextFilter: selectedFilter,
      nextLinkedFilter: selectedLinkedFilter,
      nextSort,
      nextDirection,
      replace: true
    });
  }

  function toggleDirection() {
    const nextDirection = direction === "asc" ? "desc" : "asc";

    setDirection(nextDirection);
    navigateWithControls({
      nextQuery: query,
      nextFilter: selectedFilter,
      nextLinkedFilter: selectedLinkedFilter,
      nextSort: selectedSort,
      nextDirection,
      replace: true
    });
  }

  function resetControls() {
    setQuery("");
    setSelectedFilter("");
    setSelectedLinkedFilter("");
    setSelectedSort(config.defaultSort);
    setDirection(config.defaultDirection);
    router.replace(clearHref);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="app-controls-panel"
    >
      <div aria-hidden="true" className="app-controls-accent" />
      <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <SearchInput
          id={`${entityType}-search`}
          name="q"
          label="Search"
          defaultValue={searchValue}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        {action ? <div className="min-w-0 sm:shrink-0">{action}</div> : null}
      </div>

      <div className="grid min-w-0 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(10rem,auto))] lg:justify-start">

        {hasFilter ? (
          <label className="grid min-w-0 gap-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
              <Filter aria-hidden="true" className="h-3.5 w-3.5 text-[var(--app-accent)]" />
              {config.filterLabel ?? "Filter"}
            </span>
            <select
              name={config.filterName}
              value={selectedFilter}
              onChange={handleFilterChange}
              className="app-select h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--app-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:bg-zinc-950"
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

        {hasLinkedFilter ? (
          <label className="grid min-w-0 gap-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
              <Filter aria-hidden="true" className="h-3.5 w-3.5 text-[var(--app-accent)]" />
              Relation
            </span>
            <select
              name="linked"
              value={selectedLinkedFilter}
              onChange={handleLinkedFilterChange}
              className="app-select h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--app-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:bg-zinc-950"
            >
              <option value="">all relations</option>
              {linkedOptions.map((option) => (
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
            value={selectedSort}
            onChange={handleSortChange}
            className="app-select h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--app-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:bg-zinc-950"
          >
            {config.sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <input type="hidden" name="direction" value={direction} />
        {isUserOrderSort ? null : (
          <SortDirectionButton
            direction={direction}
            onToggle={toggleDirection}
          />
        )}

        <button
          type="button"
          onClick={resetControls}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:border-[var(--app-accent)] hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Reset
        </button>
      </div>
    </form>
  );
}
