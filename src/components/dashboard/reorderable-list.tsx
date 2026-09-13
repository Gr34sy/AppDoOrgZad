"use client";

import { type DragEvent, type ReactNode, useEffect, useState } from "react";
import { GripVertical } from "lucide-react";

type ReorderableItem = {
  id: string;
  position: number;
  content: ReactNode;
};

type ReorderableEntityType = "pin" | "note" | "checklist" | "task" | "project";

type ReorderableListProps = {
  items: ReorderableItem[];
  entityType: ReorderableEntityType;
  className?: string;
  itemClassName?: string;
  handleLabel?: string;
  disabled?: boolean;
};

function orderItems(items: ReorderableItem[]) {
  return [...items].sort((firstItem, secondItem) => {
    if (firstItem.position === secondItem.position) {
      return firstItem.id.localeCompare(secondItem.id);
    }

    return firstItem.position - secondItem.position;
  });
}

function moveItem(items: ReorderableItem[], draggedId: string, targetId: string) {
  const draggedIndex = items.findIndex((item) => item.id === draggedId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (draggedIndex < 0 || targetIndex < 0 || draggedIndex === targetIndex) {
    return items;
  }

  const nextItems = [...items];
  const [draggedItem] = nextItems.splice(draggedIndex, 1);
  nextItems.splice(targetIndex, 0, draggedItem);

  return nextItems;
}

export function ReorderableList({
  items,
  entityType,
  className = "grid gap-3",
  itemClassName = "",
  handleLabel = "Drag to reorder",
  disabled = false
}: ReorderableListProps) {
  const [orderedItems, setOrderedItems] = useState(() => (disabled ? items : orderItems(items)));
  const [draggedItemId, setDraggedItemId] = useState("");
  const [activeDropId, setActiveDropId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setOrderedItems(disabled ? items : orderItems(items));
  }, [disabled, items]);

  async function persistOrder(nextItems: ReorderableItem[]) {
    const response = await fetch("/api/reorder", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        entityType,
        items: nextItems.map((item, index) => ({
          id: item.id,
          position: index
        }))
      })
    });

    if (!response.ok) {
      throw new Error("Failed to save order.");
    }
  }

  async function applyOrder(nextItems: ReorderableItem[]) {
    const previousItems = orderedItems;

    setError("");
    setOrderedItems(nextItems);

    try {
      await persistOrder(nextItems);
    } catch {
      setOrderedItems(previousItems);
      setError("Could not save the new order.");
    }
  }

  function handleDragStart(event: DragEvent<HTMLElement>, itemId: string) {
    if (disabled) {
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
    setDraggedItemId(itemId);
  }

  function handleDragOver(event: DragEvent<HTMLElement>, itemId: string) {
    if (disabled || !draggedItemId || draggedItemId === itemId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setActiveDropId(itemId);
  }

  async function handleDrop(event: DragEvent<HTMLElement>, targetId: string) {
    event.preventDefault();

    if (disabled) {
      return;
    }

    const itemId = event.dataTransfer.getData("text/plain") || draggedItemId;
    const nextItems = moveItem(orderedItems, itemId, targetId);

    setDraggedItemId("");
    setActiveDropId("");

    if (nextItems === orderedItems) {
      return;
    }

    await applyOrder(nextItems);
  }

  return (
    <div className="grid gap-3">
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </p>
      ) : null}
      <div className={className}>
        {orderedItems.map((item) => (
          <div
            key={item.id}
            draggable={!disabled}
            onDragStart={(event) => handleDragStart(event, item.id)}
            onDragOver={(event) => handleDragOver(event, item.id)}
            onDragLeave={() => setActiveDropId("")}
            onDrop={(event) => void handleDrop(event, item.id)}
            onDragEnd={() => {
              setDraggedItemId("");
              setActiveDropId("");
            }}
            className={`group/reorder relative min-w-0 rounded-md transition ${
              draggedItemId === item.id ? "opacity-60" : ""
            } ${
              activeDropId === item.id
                ? "ring-2 ring-[var(--app-accent)]/30"
                : ""
            } ${itemClassName}`}
          >
            {!disabled ? (
              <div className="mb-2 flex items-center gap-1 sm:absolute sm:left-2 sm:top-2 sm:z-20 sm:mb-0 sm:translate-y-1 sm:opacity-0 sm:transition sm:group-hover/reorder:translate-y-0 sm:group-hover/reorder:opacity-100 sm:group-focus-within/reorder:translate-y-0 sm:group-focus-within/reorder:opacity-100">
                <button
                  type="button"
                  className="grid h-8 w-8 cursor-grab place-items-center rounded-md border border-zinc-200 bg-white text-zinc-400 shadow-sm transition active:cursor-grabbing dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500"
                  aria-label={handleLabel}
                  title={handleLabel}
                >
                  <GripVertical aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}
