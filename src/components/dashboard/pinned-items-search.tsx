"use client";

import { ArrowDownUp, ClipboardList, FolderKanban, ListChecks, ListX, Search, StickyNote } from "lucide-react";
import { useMemo, useState } from "react";
import { ObjectCard } from "@/components/dashboard/object-card";
import { SortDirectionButton } from "@/components/dashboard/sort-direction-button";

type PinnedItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  meta: string;
  status: string;
  priority?: string;
  tags: string[];
  items?: Array<{ title: string; isCompleted?: boolean }>;
  createdAt: string;
  updatedAt: string;
  href: string;
};

type PinnedItemsSearchProps = {
  pinnedItems: PinnedItem[];
};

const typeFilters = [
  { label: "Notes", value: "Note" },
  { label: "Checklists", value: "Checklist" },
  { label: "Tasks", value: "Task" },
  { label: "Projects", value: "Project" }
];

const sortFieldOptions = [
  { label: "updated", value: "updated" },
  { label: "created", value: "created" },
  { label: "title", value: "title" },
  { label: "description", value: "description" }
];

function getPinnedItemDeleteEndpoint(item: PinnedItem) {
  const hrefParts = item.href.split("/").filter(Boolean);
  const targetId = hrefParts[hrefParts.length - 1];
  const endpointByType: Record<string, string> = {
    Note: "notes",
    Checklist: "checklists",
    Task: "tasks",
    Project: "projects"
  };
  const endpointType = endpointByType[item.type];

  return targetId && endpointType ? `/api/${endpointType}/${targetId}` : "";
}

const iconByType = {
  Note: StickyNote,
  Checklist: ListChecks,
  Task: ClipboardList,
  Project: FolderKanban
};

export function PinnedItemsSearch({ pinnedItems }: PinnedItemsSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() =>
    typeFilters.map((filter) => filter.value)
  );
  const [sortField, setSortField] = useState("updated");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const normalizedQuery = query.trim().toLowerCase();
  const selectedTypeSet = useMemo(() => new Set(selectedTypes), [selectedTypes]);
  const filteredItems = useMemo(() => {
    return pinnedItems.filter((item) =>
      selectedTypeSet.has(item.type) &&
      (!normalizedQuery ||
        [item.title, item.description, item.type, item.meta, item.status]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery))
    );
  }, [normalizedQuery, pinnedItems, selectedTypeSet]);
  const sortedItems = useMemo(() => {
    const directionModifier = sortDirection === "asc" ? 1 : -1;

    return [...filteredItems].sort((firstItem, secondItem) => {
      if (sortField === "title") {
        return firstItem.title.localeCompare(secondItem.title) * directionModifier;
      }

      if (sortField === "description") {
        const firstDescription = firstItem.description || firstItem.meta;
        const secondDescription = secondItem.description || secondItem.meta;

        return firstDescription.localeCompare(secondDescription) * directionModifier;
      }

      const firstDate = sortField === "created" ? firstItem.createdAt : firstItem.updatedAt;
      const secondDate = sortField === "created" ? secondItem.createdAt : secondItem.updatedAt;
      const firstTime = firstDate ? new Date(firstDate).getTime() : 0;
      const secondTime = secondDate ? new Date(secondDate).getTime() : 0;

      return (firstTime - secondTime) * directionModifier;
    });
  }, [filteredItems, sortDirection, sortField]);

  function toggleType(type: string) {
    setSelectedTypes((currentTypes) =>
      currentTypes.includes(type)
        ? currentTypes.filter((currentType) => currentType !== type)
        : [...currentTypes, type]
    );
  }

  function toggleAllTypes() {
    setSelectedTypes((currentTypes) =>
      currentTypes.length === typeFilters.length ? [] : typeFilters.map((filter) => filter.value)
    );
  }

  function updateSortField(nextSortField: string) {
    setSortField(nextSortField);
    setSortDirection(nextSortField === "title" || nextSortField === "description" ? "asc" : "desc");
  }

  const hasActiveFilters = Boolean(normalizedQuery) || selectedTypes.length !== typeFilters.length;
  const hasSelectedAllTypes = selectedTypes.length === typeFilters.length;
  const countLabel = hasActiveFilters
    ? `${filteredItems.length} of ${pinnedItems.length} saved items`
    : pinnedItems.length
      ? `${pinnedItems.length} saved items`
      : "No saved items";

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">Pinned items</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{countLabel}</p>
        </div>
        <div className="grid gap-3">
          <div className="w-full min-w-0 sm:max-w-2xl">
            <label htmlFor="pinned-search" className="sr-only">
              Search pinned items
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                strokeWidth={2.25}
              />
              <input
                id="pinned-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className="h-11 w-full rounded-full border border-zinc-400 bg-white pl-11 pr-4 text-sm text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-700 focus:ring-2 focus:ring-zinc-950/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-300 dark:focus:ring-white/10"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-wrap gap-2 text-sm" aria-label="Pinned item type filters">
              <button
                type="button"
                aria-label={hasSelectedAllTypes ? "Deselect all pinned item types" : "Select all pinned item types"}
                aria-pressed={hasSelectedAllTypes}
                title={hasSelectedAllTypes ? "Deselect all pinned item types" : "Select all pinned item types"}
                onClick={toggleAllTypes}
                className={`grid h-9 w-9 place-items-center rounded-md border transition ${
                  hasSelectedAllTypes
                    ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-white shadow-sm hover:opacity-90"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-[var(--app-accent)] hover:text-[var(--app-accent)] focus-visible:border-[var(--app-accent)] focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                }`}
              >
                {hasSelectedAllTypes ? (
                  <ListX aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
                ) : (
                  <ListChecks aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
                )}
              </button>
              {typeFilters.map((filter) => {
                const isSelected = selectedTypeSet.has(filter.value);

                return (
                  <button
                    key={filter.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleType(filter.value)}
                    className={`rounded-md border px-4 py-2 font-medium transition ${
                      isSelected
                        ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-white shadow-sm hover:opacity-90"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-[var(--app-accent)] hover:text-[var(--app-accent)] focus-visible:border-[var(--app-accent)] focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
            <div className="flex min-w-0 flex-wrap items-end gap-2">
              <label className="grid min-w-[11rem] gap-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                  <ArrowDownUp aria-hidden="true" className="h-3.5 w-3.5 text-sky-500" />
                  Sort
                </span>
                <select
                  value={sortField}
                  onChange={(event) => updateSortField(event.target.value)}
                  className="h-9 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--app-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:bg-zinc-950"
                >
                  {sortFieldOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <SortDirectionButton
                direction={sortDirection}
                className="h-9"
                onToggle={() =>
                  setSortDirection((currentDirection) =>
                    currentDirection === "asc" ? "desc" : "asc"
                  )
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="app-card-grid content-start">
        {sortedItems.length ? (
          sortedItems.map((item) => {
            const Icon = iconByType[item.type as keyof typeof iconByType] ?? StickyNote;
            const isTaskOrProject = item.type === "Task" || item.type === "Project";

            return (
              <ObjectCard
                key={item.id}
                href={item.href}
                title={item.title}
                icon={Icon}
                deleteEndpoint={getPinnedItemDeleteEndpoint(item)}
                description={item.description}
                tags={item.tags}
                status={isTaskOrProject ? item.status : undefined}
                priority={isTaskOrProject ? item.priority : undefined}
                previewItems={item.type === "Checklist" ? item.items : undefined}
              />
            );
          })
        ) : (
          <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold">
              {pinnedItems.length ? "No matching pinned items" : "No pinned items"}
            </h3>
          </article>
        )}
      </section>
    </div>
  );
}
