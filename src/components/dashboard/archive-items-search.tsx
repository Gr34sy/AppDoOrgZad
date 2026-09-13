"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownUp,
  Archive as ArchiveIcon,
  ClipboardList,
  Filter,
  FolderKanban,
  ListChecks,
  ListX,
  RotateCcw,
  StickyNote,
  Trash2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ConfirmationDialog } from "@/components/dashboard/confirmation-dialog";
import { SearchInput } from "@/components/dashboard/search-input";
import { SortDirectionButton } from "@/components/dashboard/sort-direction-button";
import { TagList } from "@/components/dashboard/tag-list";
import { compareDateValues, compareTextValues, matchesSearch } from "@/lib/item-list-utils";
import type { EntityType } from "@/types/domain";

type ArchiveItem = {
  id: string;
  title: string;
  description: string;
  type: EntityType;
  typeLabel: string;
  status: string;
  priority?: string;
  tags: string[];
  items?: Array<{ title: string; isCompleted?: boolean }>;
  canFilterRelation: boolean;
  relationTargets: Array<"project" | "task">;
  createdAt: string;
  updatedAt: string;
  archivedAt: string;
};

type ArchiveItemsSearchProps = {
  items: ArchiveItem[];
};

type ArchiveConfirmation = {
  item: ArchiveItem;
  method: "PATCH" | "DELETE";
};

const typeFilters: Array<{ label: string; value: EntityType }> = [
  { label: "Notes", value: "note" },
  { label: "Checklists", value: "checklist" },
  { label: "Tasks", value: "task" },
  { label: "Projects", value: "project" }
];

const sortFieldOptions = [
  { label: "archived", value: "archived" },
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

const iconByType: Record<EntityType, LucideIcon> = {
  note: StickyNote,
  checklist: ListChecks,
  task: ClipboardList,
  project: FolderKanban
};

function getArchiveItemText(item: ArchiveItem, field: string) {
  if (field === "title") {
    return item.title;
  }

  if (field === "description") {
    return item.description;
  }

  return "";
}

function getArchiveItemDate(item: ArchiveItem, field: string) {
  if (field === "created") {
    return item.createdAt;
  }

  if (field === "updated") {
    return item.updatedAt;
  }

  return item.archivedAt;
}

function matchesRelationFilter(item: ArchiveItem, relationFilter: string) {
  if (!relationFilter || !item.canFilterRelation) {
    return true;
  }

  if (relationFilter === "linked") {
    return item.relationTargets.length > 0;
  }

  return item.relationTargets.includes(relationFilter as "project" | "task");
}

export function ArchiveItemsSearch({ items }: ArchiveItemsSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<EntityType[]>(() =>
    typeFilters.map((filter) => filter.value)
  );
  const [relationFilter, setRelationFilter] = useState("");
  const [sortField, setSortField] = useState("archived");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [pendingItemId, setPendingItemId] = useState("");
  const [confirmation, setConfirmation] = useState<ArchiveConfirmation | null>(null);
  const [error, setError] = useState("");
  const selectedTypeSet = useMemo(() => new Set(selectedTypes), [selectedTypes]);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesType = selectedTypeSet.has(item.type);
      const matchesRelation = matchesRelationFilter(item, relationFilter);
      const matchesQuery =
        matchesSearch(
          [
          item.title,
          item.description,
          item.typeLabel,
          item.status,
          item.priority ?? "",
          ...item.tags
          ],
          normalizedQuery
        );

      return matchesType && matchesRelation && matchesQuery;
    });
  }, [items, normalizedQuery, relationFilter, selectedTypeSet]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((firstItem, secondItem) => {
      if (sortField === "title" || sortField === "description") {
        return compareTextValues(
          getArchiveItemText(firstItem, sortField),
          getArchiveItemText(secondItem, sortField),
          sortDirection
        );
      }

      return compareDateValues(
        getArchiveItemDate(firstItem, sortField),
        getArchiveItemDate(secondItem, sortField),
        sortDirection
      );
    });
  }, [filteredItems, sortDirection, sortField]);

  async function mutateArchiveItem() {
    if (!confirmation) {
      return;
    }

    const { item, method } = confirmation;

    setPendingItemId(item.id);
    setError("");

    const response = await fetch(`/api/archive/${item.type}/${item.id}`, {
      method
    });

    setPendingItemId("");

    if (!response.ok) {
      setError(method === "PATCH" ? "Could not restore the item." : "Could not delete the item.");
      return;
    }

    setConfirmation(null);
    router.refresh();
  }

  function requestArchiveMutation(item: ArchiveItem, method: "PATCH" | "DELETE") {
    setError("");
    setConfirmation({ item, method });
  }

  function toggleType(type: EntityType) {
    setSelectedTypes((currentTypes) =>
      currentTypes.includes(type)
        ? currentTypes.filter((currentType) => currentType !== type)
        : [...currentTypes, type]
    );
  }

  function toggleAllTypes() {
    setSelectedTypes((currentTypes) =>
      currentTypes.length === typeFilters.length
        ? []
        : typeFilters.map((filter) => filter.value)
    );
  }

  function updateSortField(nextSortField: string) {
    setSortField(nextSortField);
    setSortDirection(nextSortField === "title" || nextSortField === "description" ? "asc" : "desc");
  }

  function resetControls() {
    setQuery("");
    setSelectedTypes(typeFilters.map((filter) => filter.value));
    setRelationFilter("");
    setSortField("archived");
    setSortDirection("desc");
  }

  const hasActiveFilters =
    Boolean(normalizedQuery) ||
    selectedTypes.length !== typeFilters.length ||
    Boolean(relationFilter);
  const hasSelectedAllTypes = selectedTypes.length === typeFilters.length;
  const countLabel = hasActiveFilters
    ? `${filteredItems.length} of ${items.length} archived items`
    : items.length
      ? `${items.length} archived items`
      : "No archived items";
  const isRestoring = confirmation?.method === "PATCH";
  const isPermanentlyDeleting = confirmation?.method === "DELETE";

  return (
    <div className="grid gap-6">
      <section className="app-controls-panel">
        <div aria-hidden="true" className="app-controls-accent" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{countLabel}</p>
        <div className="grid gap-3">
          <SearchInput
            id="archive-search"
            label="Search archived items"
            defaultValue=""
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="grid min-w-0 gap-3">
            <div className="flex flex-wrap gap-2 text-sm" aria-label="Archived item type filters">
              <button
                type="button"
                aria-label={hasSelectedAllTypes ? "Deselect all archived item types" : "Select all archived item types"}
                aria-pressed={hasSelectedAllTypes}
                title={hasSelectedAllTypes ? "Deselect all archived item types" : "Select all archived item types"}
                onClick={toggleAllTypes}
                className={`grid h-9 w-9 place-items-center rounded-md border transition ${
                  hasSelectedAllTypes
                    ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-white shadow-sm hover:opacity-90"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-[var(--app-accent)] hover:text-[var(--app-accent)] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
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
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-[var(--app-accent)] hover:text-[var(--app-accent)] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
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
              <SortDirectionButton
                direction={sortDirection}
                className="h-11"
                onToggle={() =>
                  setSortDirection((currentDirection) =>
                    currentDirection === "asc" ? "desc" : "asc"
                  )
                }
              />
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

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {sortedItems.length ? (
        <section className="app-card-grid content-start">
          {sortedItems.map((item) => {
            const Icon = iconByType[item.type];
            const isChecklist = item.type === "checklist";
            const isPending = pendingItemId === item.id;

            return (
              <article
                key={`${item.type}-${item.id}`}
                className="group relative min-w-0 max-w-sm overflow-hidden rounded-md transition hover:-translate-y-0.5"
              >
                <div className="mb-2 flex justify-end gap-2 sm:absolute sm:right-2 sm:top-2 sm:z-10 sm:mb-0 sm:translate-y-1 sm:opacity-0 sm:transition sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => requestArchiveMutation(item, "PATCH")}
                    className="grid h-9 w-9 place-items-center rounded-md text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-200 dark:hover:bg-emerald-500/10"
                    aria-label={`Restore ${item.title}`}
                    title="Restore"
                  >
                    <RotateCcw aria-hidden="true" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => requestArchiveMutation(item, "DELETE")}
                    className="grid h-9 w-9 place-items-center rounded-md text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-500/10"
                    aria-label={`Permanently delete ${item.title}`}
                    title="Delete permanently"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid min-h-44 min-w-0 rounded-md border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:pr-24 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex min-w-0 items-start gap-3">
                    <Icon
                      aria-hidden="true"
                      className="mt-0.5 h-5 w-5 shrink-0 text-[var(--app-accent)] opacity-80"
                    />
                    <h2 className="min-w-0 flex-1 overflow-hidden break-words text-lg font-semibold tracking-normal text-zinc-950 dark:text-zinc-50">
                      {item.title}
                    </h2>
                  </div>
                  <p className="mt-2 text-xs font-medium uppercase tracking-normal text-zinc-500 dark:text-zinc-400">
                    {[item.typeLabel, item.status, item.priority].filter(Boolean).join(" / ")}
                  </p>
                  {isChecklist ? (
                    item.items?.length ? (
                      <ul className="mt-4 grid gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
                        {item.items.slice(0, 5).map((entry, index) => (
                          <li key={`${entry.title}-${index}`} className="flex min-w-0 items-center gap-2">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${entry.isCompleted ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                            <span className={`min-w-0 truncate ${entry.isCompleted ? "text-zinc-400 line-through decoration-2 decoration-zinc-400 dark:text-zinc-500 dark:decoration-zinc-500" : ""}`}>
                              {entry.title}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                        No checklist items.
                      </p>
                    )
                  ) : (
                    <>
                      <TagList tags={item.tags} className="mt-4" limit={3} showEmpty size="compact" />
                      <p className="mt-4 min-w-0 break-words text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {item.description || "No description yet."}
                      </p>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="grid min-h-72 place-items-center rounded-md bg-white px-6 py-12 text-center dark:bg-zinc-950">
          <div className="max-w-sm">
            <ArchiveIcon
              aria-hidden="true"
              className="mx-auto h-10 w-10 text-[var(--app-accent)]"
            />
            <h2 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              {items.length ? "No matching archived items" : "Archive is empty"}
            </h2>
          </div>
        </div>
      )}
      <ConfirmationDialog
        isOpen={Boolean(confirmation)}
        title={isRestoring ? "Restore this item?" : "Delete permanently?"}
        description={
          isRestoring
            ? "The item will be moved back to the active workspace."
            : "The item will be permanently removed from the archive. This action cannot be undone."
        }
        confirmLabel={
          pendingItemId
            ? isRestoring
              ? "Restoring..."
              : "Deleting..."
            : isRestoring
              ? "Restore"
              : "Delete permanently"
        }
        cancelLabel="Cancel"
        error={error}
        icon={
          isPermanentlyDeleting ? (
            <Trash2 aria-hidden="true" className="h-5 w-5" />
          ) : (
            <RotateCcw aria-hidden="true" className="h-5 w-5" />
          )
        }
        isPending={Boolean(pendingItemId)}
        onCancel={() => {
          if (!pendingItemId) {
            setConfirmation(null);
          }
        }}
        onConfirm={() => void mutateArchiveItem()}
        variant={isRestoring ? "success" : "danger"}
      />
    </div>
  );
}
