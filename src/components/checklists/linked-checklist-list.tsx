"use client";

import { type DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Edit2, ExternalLink, Link2Off, ListChecks, Plus, X } from "lucide-react";
import { ReturnToLink } from "@/components/dashboard/return-to-link";
import { getCreatedEntityId } from "@/lib/created-entity-response";

export type LinkedChecklistItem = {
  title: string;
  isCompleted?: boolean;
  position?: number;
  localId?: string;
};

export type LinkedChecklistOption = {
  id: string;
  title: string;
  items?: LinkedChecklistItem[];
  parentType?: "task" | "project" | null;
  parentId?: string | null;
};

type PreparedChecklistItem = LinkedChecklistItem & { localId: string };
type PreparedChecklistOption = Omit<LinkedChecklistOption, "items"> & {
  items: PreparedChecklistItem[];
};

type LinkedChecklistListProps = {
  parentType: "task" | "project";
  parentId: string;
  checklistIds: string[];
  checklistOptions: LinkedChecklistOption[];
  className?: string;
  onChecklistIdsChange?: (checklistIds: string[]) => void;
};

function normalizeItems(items: LinkedChecklistItem[]) {
  return items
    .map((item, position) => ({
      title: item.title.trim(),
      isCompleted: Boolean(item.isCompleted),
      position
    }))
    .filter((item) => item.title);
}

function createLocalId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function prepareOptions(options: LinkedChecklistOption[]): PreparedChecklistOption[] {
  return options.map((checklist) => ({
    ...checklist,
    items: (checklist.items ?? []).map((item, index) => ({
      ...item,
      localId: item.localId ?? `${checklist.id}-item-${index}`
    }))
  }));
}

function getChecklistSnapshot(checklist: LinkedChecklistOption) {
  return JSON.stringify({
    title: checklist.title.trim(),
    items: normalizeItems(checklist.items ?? [])
  });
}

export function LinkedChecklistList({
  parentType,
  parentId,
  checklistIds,
  checklistOptions,
  className = "",
  onChecklistIdsChange
}: LinkedChecklistListProps) {
  const [options, setOptions] = useState<PreparedChecklistOption[]>(() => prepareOptions(checklistOptions));
  const [linkedIds, setLinkedIds] = useState(checklistIds);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState("");
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newItemTitles, setNewItemTitles] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [editingItem, setEditingItem] = useState<{ checklistId: string; itemId: string } | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ checklistId: string; itemId: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    checklistId: string;
    itemId: string;
    position: "before" | "after";
  } | null>(null);
  const suppressItemClickRef = useRef(false);
  const persistedSnapshotsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const preparedOptions = prepareOptions(checklistOptions);
    setOptions(preparedOptions);
    persistedSnapshotsRef.current = new Map(
      preparedOptions.map((checklist) => [checklist.id, getChecklistSnapshot(checklist)])
    );
  }, [checklistOptions]);
  useEffect(() => setLinkedIds(checklistIds), [checklistIds]);

  const linkedChecklists = useMemo(
    () => linkedIds
      .map((id) => options.find((checklist) => checklist.id === id))
      .filter((checklist): checklist is PreparedChecklistOption => Boolean(checklist)),
    [linkedIds, options]
  );
  const availableChecklists = options.filter((checklist) =>
    !linkedIds.includes(checklist.id) && !checklist.parentId
  );
  const parentEndpoint = `/api/${parentType === "task" ? "tasks" : "projects"}/${parentId}`;

  function updateLocalChecklist(
    checklistId: string,
    update: (checklist: PreparedChecklistOption) => PreparedChecklistOption
  ) {
    setOptions((current) => current.map((checklist) =>
      checklist.id === checklistId ? update(checklist) : checklist
    ));
  }

  async function persistChecklist(checklist: LinkedChecklistOption) {
    const snapshot = getChecklistSnapshot(checklist);

    if (persistedSnapshotsRef.current.get(checklist.id) === snapshot) {
      return;
    }

    setSavingId(checklist.id);
    setError("");
    const response = await fetch(`/api/checklists/${checklist.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: checklist.title.trim(),
        items: normalizeItems(checklist.items ?? [])
      })
    });
    setSavingId("");

    if (!response.ok) {
      setError("Could not save the checklist.");
      return;
    }

    persistedSnapshotsRef.current.set(checklist.id, snapshot);
  }

  async function saveLinkedIds(nextIds: string[]) {
    const response = await fetch(parentEndpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklistIds: nextIds })
    });

    if (!response.ok) {
      setError("Could not link the checklist.");
      return false;
    }

    setLinkedIds(nextIds);
    onChecklistIdsChange?.(nextIds);
    return true;
  }

  async function attachChecklist() {
    if (!selectedChecklistId) return;
    setSavingId("attach");
    setError("");
    const relationResponse = await fetch(`/api/checklists/${selectedChecklistId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentType, parentId })
    });

    if (!relationResponse.ok) {
      setSavingId("");
      setError("Could not link the checklist.");
      return;
    }

    const didSave = await saveLinkedIds([...linkedIds, selectedChecklistId]);
    setSavingId("");

    if (didSave) {
      updateLocalChecklist(selectedChecklistId, (checklist) => ({
        ...checklist,
        parentType,
        parentId
      }));
      setSelectedChecklistId("");
      setIsAdding(false);
      return;
    }

    await fetch(`/api/checklists/${selectedChecklistId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentType: null, parentId: null })
    });
  }

  async function unlinkChecklist(checklist: PreparedChecklistOption) {
    const nextIds = linkedIds.filter((id) => id !== checklist.id);
    setSavingId(checklist.id);
    setError("");

    const relationResponse = await fetch(`/api/checklists/${checklist.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentType: null, parentId: null })
    });

    if (!relationResponse.ok) {
      setSavingId("");
      setError("Could not unlink the checklist.");
      return;
    }

    if (await saveLinkedIds(nextIds)) {
      updateLocalChecklist(checklist.id, (currentChecklist) => ({
        ...currentChecklist,
        parentType: null,
        parentId: null
      }));
      setExpandedIds((current) => current.filter((id) => id !== checklist.id));
      setSavingId("");
      return;
    }

    await fetch(`/api/checklists/${checklist.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentType, parentId })
    });
    setSavingId("");
  }

  async function createChecklist() {
    const title = newChecklistTitle.trim();
    if (!title) return;

    setSavingId("create");
    setError("");
    const response = await fetch("/api/checklists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, parentType, parentId, items: [] })
    });

    if (!response.ok) {
      setSavingId("");
      setError("Could not create the checklist.");
      return;
    }

    const checklistId = await getCreatedEntityId(response, "checklist");
    if (!checklistId || !(await saveLinkedIds([...linkedIds, checklistId]))) {
      setSavingId("");
      return;
    }

    const createdChecklist: PreparedChecklistOption = {
      id: checklistId,
      title,
      items: [],
      parentType,
      parentId
    };
    persistedSnapshotsRef.current.set(checklistId, getChecklistSnapshot(createdChecklist));
    setOptions((current) => [...current, createdChecklist]);
    setExpandedIds((current) => [...current, checklistId]);
    setNewChecklistTitle("");
    setIsAdding(false);
    setSavingId("");
  }

  function toggleChecklist(checklistId: string) {
    setExpandedIds((current) => current.includes(checklistId)
      ? current.filter((id) => id !== checklistId)
      : [...current, checklistId]
    );
  }

  function changeTitle(checklistId: string, title: string) {
    updateLocalChecklist(checklistId, (checklist) => ({ ...checklist, title }));
  }

  function changeItem(checklistId: string, itemIndex: number, title: string) {
    updateLocalChecklist(checklistId, (checklist) => ({
      ...checklist,
      items: (checklist.items ?? []).map((item, index) =>
        index === itemIndex ? { ...item, title } : item
      )
    }));
  }

  async function finishItemEdit(checklist: PreparedChecklistOption) {
    const nextChecklist: PreparedChecklistOption = {
      ...checklist,
      items: checklist.items
        .map((item, position) => ({ ...item, title: item.title.trim(), position }))
        .filter((item) => item.title)
    };
    updateLocalChecklist(checklist.id, () => nextChecklist);
    await persistChecklist(nextChecklist);
  }

  async function toggleItem(checklist: PreparedChecklistOption, itemIndex: number) {
    const nextChecklist: PreparedChecklistOption = {
      ...checklist,
      items: (checklist.items ?? []).map((item, index) =>
        index === itemIndex ? { ...item, isCompleted: !item.isCompleted } : item
      )
    };
    updateLocalChecklist(checklist.id, () => nextChecklist);
    await persistChecklist(nextChecklist);
  }

  async function removeItem(checklist: PreparedChecklistOption, itemIndex: number) {
    const nextChecklist: PreparedChecklistOption = {
      ...checklist,
      items: (checklist.items ?? []).filter((_, index) => index !== itemIndex)
    };
    updateLocalChecklist(checklist.id, () => nextChecklist);
    await persistChecklist(nextChecklist);
  }

  async function addItem(checklist: PreparedChecklistOption) {
    const title = (newItemTitles[checklist.id] ?? "").trim();
    if (!title) return;

    const nextChecklist: PreparedChecklistOption = {
      ...checklist,
      items: [
        ...(checklist.items ?? []),
        { title, isCompleted: false, localId: createLocalId() }
      ]
    };
    updateLocalChecklist(checklist.id, () => nextChecklist);
    setNewItemTitles((current) => ({ ...current, [checklist.id]: "" }));
    await persistChecklist(nextChecklist);
  }

  function handleItemDragStart(
    event: DragEvent<HTMLDivElement>,
    checklistId: string,
    itemId: string
  ) {
    suppressItemClickRef.current = true;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
    setDraggedItem({ checklistId, itemId });
  }

  function finishItemDrag() {
    setDraggedItem(null);
    setDropTarget(null);
    window.setTimeout(() => {
      suppressItemClickRef.current = false;
    }, 0);
  }

  function handleItemDragOver(
    event: DragEvent<HTMLDivElement>,
    checklistId: string,
    itemId: string
  ) {
    if (!draggedItem || draggedItem.checklistId !== checklistId || draggedItem.itemId === itemId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const bounds = event.currentTarget.getBoundingClientRect();
    setDropTarget({
      checklistId,
      itemId,
      position: event.clientY < bounds.top + bounds.height / 2 ? "before" : "after"
    });
  }

  async function handleItemDrop(
    event: DragEvent<HTMLDivElement>,
    checklist: PreparedChecklistOption,
    targetItemId: string
  ) {
    event.preventDefault();
    const draggedItemId = event.dataTransfer.getData("text/plain") || draggedItem?.itemId;
    const dropPosition = dropTarget?.position ?? "before";
    setDraggedItem(null);
    setDropTarget(null);

    if (!draggedItemId || draggedItemId === targetItemId) {
      return;
    }

    const nextItems = [...(checklist.items ?? [])];
    const draggedIndex = nextItems.findIndex((item) => item.localId === draggedItemId);

    if (draggedIndex < 0) {
      return;
    }

    const [movedItem] = nextItems.splice(draggedIndex, 1);
    const targetIndex = nextItems.findIndex((item) => item.localId === targetItemId);

    if (targetIndex < 0) {
      return;
    }

    nextItems.splice(targetIndex + (dropPosition === "after" ? 1 : 0), 0, movedItem);
    const nextChecklist: PreparedChecklistOption = {
      ...checklist,
      items: nextItems.map((item, position) => ({ ...item, position }))
    };
    updateLocalChecklist(checklist.id, () => nextChecklist);
    await persistChecklist(nextChecklist);
  }

  return (
    <section className={`border-t border-zinc-200 pt-5 dark:border-zinc-800 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <ListChecks aria-hidden="true" className="h-4 w-4 text-[var(--app-accent)]" />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Checklists</h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{linkedChecklists.length}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding((current) => !current)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-[var(--app-accent)] transition hover:bg-[var(--app-accent)]/5"
          aria-expanded={isAdding}
        >
          {isAdding ? <X aria-hidden="true" className="h-4 w-4" /> : <Plus aria-hidden="true" className="h-4 w-4" />}
          {isAdding ? "Close" : "Add"}
        </button>
      </div>

      {isAdding ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex min-w-0 gap-2">
            <select
              aria-label="Existing checklist"
              value={selectedChecklistId}
              onChange={(event) => setSelectedChecklistId(event.target.value)}
              className="app-select h-9 min-w-0 flex-1 rounded-md bg-zinc-100 px-3 text-sm outline-none dark:bg-zinc-900"
            >
              <option value="">Existing checklist</option>
              {availableChecklists.map((checklist) => (
                <option key={checklist.id} value={checklist.id}>{checklist.title}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedChecklistId || Boolean(savingId)}
              onClick={() => void attachChecklist()}
              className="h-9 rounded-md px-3 text-sm font-medium text-[var(--app-accent)] transition hover:bg-[var(--app-accent)]/5 disabled:opacity-40"
            >
              Attach
            </button>
          </div>
          <div className="flex min-w-0 gap-2">
            <input
              aria-label="New checklist title"
              value={newChecklistTitle}
              onChange={(event) => setNewChecklistTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void createChecklist();
                }
              }}
              placeholder="New checklist"
              className="h-9 min-w-0 flex-1 rounded-md bg-zinc-100 px-3 text-sm outline-none placeholder:text-zinc-400 dark:bg-zinc-900"
            />
            <button
              type="button"
              disabled={!newChecklistTitle.trim() || Boolean(savingId)}
              onClick={() => void createChecklist()}
              className="h-9 rounded-md px-3 text-sm font-medium text-[var(--app-accent)] transition hover:bg-[var(--app-accent)]/5 disabled:opacity-40"
            >
              Create
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        {linkedChecklists.map((checklist) => {
          const isExpanded = expandedIds.includes(checklist.id);

          return (
            <div key={checklist.id} className="border-t border-zinc-200 first:border-t-0 dark:border-zinc-800">
              <div className="flex min-w-0 items-center gap-1 py-2">
                <button
                  type="button"
                  onClick={() => toggleChecklist(checklist.id)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-[var(--app-accent)] dark:hover:bg-zinc-900"
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${checklist.title}`}
                >
                  <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-zinc-400 transition ${isExpanded ? "rotate-180" : ""}`} />
                </button>
                <input
                  aria-label={`${checklist.title} title`}
                  value={checklist.title}
                  onFocus={() => {
                    if (!isExpanded) {
                      setExpandedIds((current) => [...current, checklist.id]);
                    }
                  }}
                  onChange={(event) => changeTitle(checklist.id, event.target.value)}
                  onBlur={() => checklist.title.trim() && void persistChecklist(checklist)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  className="min-w-0 flex-1 truncate bg-transparent py-1 text-sm font-medium text-zinc-800 outline-none dark:text-zinc-100"
                />
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={savingId === checklist.id}
                    onClick={() => void unlinkChecklist(checklist)}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-[var(--app-accent)] disabled:opacity-40 dark:hover:bg-zinc-900"
                    aria-label={`Unlink ${checklist.title}`}
                    title="Unlink checklist"
                  >
                    <Link2Off aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                  <ReturnToLink
                    href={`/dashboard/checklists/${checklist.id}`}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-[var(--app-accent)] dark:hover:bg-zinc-900"
                    aria-label={`Open ${checklist.title}`}
                    title="Open checklist"
                  >
                    <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                  </ReturnToLink>
                  <span className="min-w-8 text-right text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                    {checklist.items.filter((item) => item.isCompleted).length}/{checklist.items.length}
                  </span>
                </div>
              </div>

              {isExpanded ? (
                <div className="pb-4 pl-6">
                  <div className="grid gap-1">
                    {(checklist.items ?? []).map((item, itemIndex) => (
                      <div
                        key={item.localId}
                        draggable
                        onDragStart={(event) => handleItemDragStart(event, checklist.id, item.localId ?? "")}
                        onDragOver={(event) => handleItemDragOver(event, checklist.id, item.localId ?? "")}
                        onDragLeave={() => setDropTarget(null)}
                        onDrop={(event) => void handleItemDrop(event, checklist, item.localId ?? "")}
                        onDragEnd={finishItemDrag}
                        onClick={() => {
                          if (!suppressItemClickRef.current) {
                            void toggleItem(checklist, itemIndex);
                          }
                        }}
                        className={`group relative flex min-w-0 cursor-grab items-center gap-2 py-1 active:cursor-grabbing ${
                          draggedItem?.itemId === item.localId ? "opacity-60" : ""
                        }`}
                      >
                        {dropTarget?.checklistId === checklist.id && dropTarget.itemId === item.localId ? (
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none absolute inset-x-0 h-0.5 rounded-full bg-[var(--app-accent)] ${
                              dropTarget.position === "before" ? "top-0" : "bottom-0"
                            }`}
                          />
                        ) : null}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void toggleItem(checklist, itemIndex);
                          }}
                          className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${item.isCompleted ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-white" : "border-zinc-300 dark:border-zinc-700"}`}
                          aria-label={`${item.isCompleted ? "Mark incomplete" : "Mark complete"}: ${item.title}`}
                        >
                          {item.isCompleted ? <Check aria-hidden="true" className="h-3 w-3" /> : null}
                        </button>
                        {editingItem?.checklistId === checklist.id && editingItem.itemId === item.localId ? (
                          <input
                            autoFocus
                            draggable={false}
                            aria-label={`Checklist item ${itemIndex + 1}`}
                            value={item.title}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => changeItem(checklist.id, itemIndex, event.target.value)}
                            onBlur={() => {
                              setEditingItem(null);
                              void finishItemEdit(checklist);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") event.currentTarget.blur();
                            }}
                            className={`min-w-0 flex-1 cursor-pointer bg-zinc-100/80 px-1 text-sm outline-none dark:bg-zinc-900 ${item.isCompleted ? "text-zinc-400 line-through dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"}`}
                          />
                        ) : (
                          <span className={`min-w-0 flex-1 cursor-pointer break-words text-sm ${item.isCompleted ? "text-zinc-400 line-through dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"}`}>
                            {item.title}
                          </span>
                        )}
                        <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                          <button
                            type="button"
                            draggable={false}
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditingItem({ checklistId: checklist.id, itemId: item.localId });
                            }}
                            className="grid h-7 w-7 place-items-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-[var(--app-accent)] dark:hover:bg-zinc-900"
                            aria-label={`Edit ${item.title}`}
                            title="Edit item"
                          >
                            <Edit2 aria-hidden="true" className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            draggable={false}
                            onClick={(event) => {
                              event.stopPropagation();
                              void removeItem(checklist, itemIndex);
                            }}
                            className="grid h-7 w-7 place-items-center rounded text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                            aria-label={`Remove ${item.title}`}
                            title="Remove item"
                          >
                            <X aria-hidden="true" className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex min-w-0 items-center gap-2">
                    <Plus aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-400" />
                    <input
                      aria-label={`Add item to ${checklist.title}`}
                      value={newItemTitles[checklist.id] ?? ""}
                      onChange={(event) => setNewItemTitles((current) => ({ ...current, [checklist.id]: event.target.value }))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void addItem(checklist);
                        }
                      }}
                      placeholder="Add item"
                      className="min-w-0 flex-1 bg-transparent py-1 text-sm text-zinc-700 outline-none placeholder:text-zinc-400 focus:text-zinc-950 dark:text-zinc-300 dark:focus:text-zinc-50"
                    />
                    <button
                      type="button"
                      disabled={!(newItemTitles[checklist.id] ?? "").trim() || savingId === checklist.id}
                      onClick={() => void addItem(checklist)}
                      className="px-2 py-1 text-xs font-medium text-[var(--app-accent)] disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
        {!linkedChecklists.length ? (
          <p className="py-3 text-sm text-zinc-500 dark:text-zinc-400">No linked checklists.</p>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p> : null}
    </section>
  );
}
