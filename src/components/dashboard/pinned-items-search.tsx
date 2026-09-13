"use client";

import {
  ArrowDownUp,
  ClipboardList,
  Filter,
  FolderKanban,
  ListChecks,
  ListX,
  RotateCcw,
  StickyNote
} from "lucide-react";
import { useMemo, useState } from "react";
import { ObjectCard } from "@/components/dashboard/object-card";
import { ReorderableList } from "@/components/dashboard/reorderable-list";
import { SearchInput } from "@/components/dashboard/search-input";
import { SortDirectionButton } from "@/components/dashboard/sort-direction-button";
import {
  compareDateValues,
  compareNumberValues,
  compareTextValues,
  matchesSearch
} from "@/lib/item-list-utils";

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
  { label: "User's Order", value: "position" },
  { label: "updated", value: "updated" },
  { label: "created", value: "created" },
  { label: "title", value: "title" },
  { label: "description", value: "description" }
];

const relationOptions = [
  { label: "Linked", value: "linked" },
  { label: "Linked to Project", value: "project" },
  { label: "Linked to Task", value: "task" }
];

function matchesRelationFilter(item: PinnedItem, relationFilter: string) {
  if (!relationFilter || !item.canFilterRelation) {
    return true;
  }

  if (relationFilter === "linked") {
    return item.relationTargets.length > 0;
  }

  return item.relationTargets.includes(relationFilter as "project" | "task");
}

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
  const [relationFilter, setRelationFilter] = useState("");
  const [sortField, setSortField] = useState("position");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const normalizedQuery = query.trim().toLowerCase();
  const selectedTypeSet = useMemo(() => new Set(selectedTypes), [selectedTypes]);
  const filteredItems = useMemo(() => {
    return pinnedItems.filter((item) =>
      selectedTypeSet.has(item.type) &&
      matchesRelationFilter(item, relationFilter) &&
      matchesSearch(
        [item.title, item.description, item.type, item.meta, item.status],
        normalizedQuery
      )
    );
  }, [normalizedQuery, pinnedItems, relationFilter, selectedTypeSet]);
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((firstItem, secondItem) => {
      if (sortField === "title") {
        return compareTextValues(firstItem.title, secondItem.title, sortDirection);
      }

      if (sortField === "description") {
        const firstDescription = firstItem.description || firstItem.meta;
        const secondDescription = secondItem.description || secondItem.meta;

        return compareTextValues(firstDescription, secondDescription, sortDirection);
      }

      if (sortField === "position") {
        return compareNumberValues(firstItem.position, secondItem.position, sortDirection);
      }

      const firstDate = sortField === "created" ? firstItem.createdAt : firstItem.updatedAt;
      const secondDate = sortField === "created" ? secondItem.createdAt : secondItem.updatedAt;

      return compareDateValues(firstDate, secondDate, sortDirection);
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
    setSortDirection(
      nextSortField === "position" || nextSortField === "title" || nextSortField === "description"
        ? "asc"
        : "desc"
    );
  }

  function resetControls() {
    setQuery("");
    setSelectedTypes(typeFilters.map((filter) => filter.value));
    setRelationFilter("");
    setSortField("position");
    setSortDirection("asc");
  }

  const hasActiveFilters = Boolean(normalizedQuery) || selectedTypes.length !== typeFilters.length || Boolean(relationFilter);
  const hasSelectedAllTypes = selectedTypes.length === typeFilters.length;
  const canReorder = !hasActiveFilters && sortField === "position";
  const countLabel = hasActiveFilters
    ? `${filteredItems.length} of ${pinnedItems.length} saved items`
    : pinnedItems.length
      ? `${pinnedItems.length} saved items`
      : "No saved items";

  return (
    <div className="grid gap-6">
      <section className="app-controls-panel">
        <div aria-hidden="true" className="app-controls-accent" />
        <div>
          <h2 className="text-xl font-semibold tracking-normal">Pinned items</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{countLabel}</p>
        </div>
        <div className="grid gap-3">
          <SearchInput
            id="pinned-search"
            label="Search pinned items"
            defaultValue=""
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="grid min-w-0 gap-3">
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
            <div className="grid min-w-0 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(10rem,auto))] lg:justify-start">
              <label className="grid min-w-0 gap-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                  <Filter aria-hidden="true" className="h-3.5 w-3.5 text-[var(--app-accent)]" />
                  Relation
                </span>
                <select
                  value={relationFilter}
                  onChange={(event) => setRelationFilter(event.target.value)}
                  className="app-select h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--app-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:bg-zinc-950"
                >
                  <option value="">all relations</option>
                  {relationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid min-w-0 gap-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                  <ArrowDownUp aria-hidden="true" className="h-3.5 w-3.5 text-sky-500" />
                  Sort
                </span>
                <select
                  value={sortField}
                  onChange={(event) => updateSortField(event.target.value)}
                  className="app-select h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-950 outline-none transition focus:border-[var(--app-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:bg-zinc-950"
                >
                  {sortFieldOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {sortField === "position" ? null : (
                <SortDirectionButton
                  direction={sortDirection}
                  className="h-11"
                  onToggle={() =>
                    setSortDirection((currentDirection) =>
                      currentDirection === "asc" ? "desc" : "asc"
                    )
                  }
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
          </div>
        </div>
      </section>

      <ReorderableList
        entityType="pin"
        className="app-card-grid content-start"
        disabled={!canReorder}
        items={sortedItems.map((item) => {
          const Icon = iconByType[item.type as keyof typeof iconByType] ?? StickyNote;
          const isTaskOrProject = item.type === "Task" || item.type === "Project";

          return {
            id: item.id,
            position: item.position,
            content: (
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
            )
          };
        })}
      />
      {!sortedItems.length ? (
        <section className="app-card-grid content-start">
          <article className="rounded-lg bg-white p-5 shadow-sm dark:bg-zinc-900">
            <h3 className="text-lg font-semibold">
              {pinnedItems.length ? "No matching pinned items" : "No pinned items"}
            </h3>
          </article>
        </section>
      ) : null}
    </div>
  );
}
