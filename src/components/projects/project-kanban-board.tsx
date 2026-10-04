'use client';

import { useRouter } from 'next/navigation';
import {
  CalendarClock,
  Check,
  Gauge,
  GripVertical,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmationDialog } from '@/components/dashboard/confirmation-dialog';
import { TagList } from '@/components/dashboard/tag-list';
import { ReturnToLink } from '@/components/dashboard/return-to-link';

type KanbanColumn = {
  id: string;
  title: string;
  color?: string;
  isDone: boolean;
};

type KanbanTask = {
  id: string;
  title: string;
  description: string;
  priority: string;
  statusId: string;
  position: number;
  dueDateLabel?: string;
  tags: string[];
};

type ProjectKanbanBoardProps = {
  projectId: string;
  columns: KanbanColumn[];
  tasks: KanbanTask[];
};

const priorityStyles: Record<string, string> = {
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  medium:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
  high: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/10 dark:text-fuchsia-200',
  urgent:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
};

const taskDragType = 'application/x-kanban-task';
const columnDragType = 'application/x-kanban-column';

function withColumnPositions(columns: KanbanColumn[]) {
  return columns.map((column, position) => ({ ...column, position }));
}

export function ProjectKanbanBoard({
  projectId,
  columns,
  tasks,
}: ProjectKanbanBoardProps) {
  const router = useRouter();
  const [movingTaskId, setMovingTaskId] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState('');
  const [activeDropColumnId, setActiveDropColumnId] = useState('');
  const [activeDropTaskId, setActiveDropTaskId] = useState('');
  const [activeDropTaskPosition, setActiveDropTaskPosition] = useState<'before' | 'after'>('before');
  const [boardTasks, setBoardTasks] = useState(tasks);
  const [boardColumns, setBoardColumns] = useState(columns);
  const [editingColumnId, setEditingColumnId] = useState('');
  const [columnDraft, setColumnDraft] = useState<KanbanColumn | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#71717a');
  const [newColumnIsDone, setNewColumnIsDone] = useState(false);
  const [savingColumns, setSavingColumns] = useState(false);
  const [draggedColumnId, setDraggedColumnId] = useState('');
  const [activeColumnDropId, setActiveColumnDropId] = useState('');
  const [columnPendingDeletion, setColumnPendingDeletion] = useState<KanbanColumn | null>(null);
  const [error, setError] = useState<string | null>(null);
  const suppressCardNavigationRef = useRef(false);
  const addColumnPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBoardTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    setBoardColumns(columns);
  }, [columns]);

  useEffect(() => {
    if (!isAddingColumn) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !savingColumns) {
        setIsAddingColumn(false);
      }
    }

    function closeOnOutsideClick(event: PointerEvent) {
      if (!savingColumns && !addColumnPopoverRef.current?.contains(event.target as Node)) {
        setIsAddingColumn(false);
      }
    }

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnOutsideClick);
    };
  }, [isAddingColumn, savingColumns]);

  const orderedColumns = useMemo(() => {
    const baseColumns = boardColumns.length
      ? boardColumns
      : [{ id: 'todo', title: 'To do', color: '#2563eb', isDone: false }];
    const knownColumnIds = new Set(baseColumns.map((column) => column.id));
    const extraColumns = Array.from(
      new Set(
        boardTasks
          .map((task) => task.statusId)
          .filter((statusId) => statusId && !knownColumnIds.has(statusId)),
      ),
    ).map((statusId) => ({
      id: statusId,
      title: statusId.replace(/_/g, ' '),
      color: '#71717a',
      isDone: false,
    }));

    return [...baseColumns, ...extraColumns];
  }, [boardColumns, boardTasks]);
  const taskCount = boardTasks.length;

  function getOrderedColumnTasks(taskList: KanbanTask[], statusId: string) {
    return taskList
      .filter((task) => task.statusId === statusId)
      .sort(
        (firstTask, secondTask) =>
          firstTask.position - secondTask.position,
      );
  }

  function buildMovedTaskOrder(
    task: KanbanTask,
    nextStatusId: string,
    targetTaskId = '',
    dropPosition: 'before' | 'after' = 'before',
  ) {
    const sourceStatusId = task.statusId;
    const originalTargetTasks = getOrderedColumnTasks(boardTasks, nextStatusId);
    const originalTargetIndex = targetTaskId
      ? originalTargetTasks.findIndex((currentTask) => currentTask.id === targetTaskId)
      : -1;
    const sourceTasks = getOrderedColumnTasks(boardTasks, sourceStatusId).filter(
      (currentTask) => currentTask.id !== task.id,
    );
    const targetTasks = originalTargetTasks.filter(
      (currentTask) => currentTask.id !== task.id,
    );
    const targetIndex = targetTaskId
      ? targetTasks.findIndex((currentTask) => currentTask.id === targetTaskId)
      : -1;
    const nextTargetTasks = [...targetTasks];
    const movedTask = {
      ...task,
      statusId: nextStatusId,
    };

    if (targetIndex >= 0) {
      const insertionIndex = sourceStatusId === nextStatusId
        ? Math.min(originalTargetIndex, nextTargetTasks.length)
        : targetIndex + (dropPosition === 'after' ? 1 : 0);
      nextTargetTasks.splice(insertionIndex, 0, movedTask);
    } else {
      nextTargetTasks.push(movedTask);
    }

    const reorderedTasks = new Map<string, KanbanTask>();
    sourceTasks.forEach((currentTask, position) => {
      reorderedTasks.set(currentTask.id, { ...currentTask, position });
    });
    nextTargetTasks.forEach((currentTask, position) => {
      reorderedTasks.set(currentTask.id, {
        ...currentTask,
        statusId: nextStatusId,
        position,
      });
    });

    const nextTasks = boardTasks.map((currentTask) =>
      reorderedTasks.get(currentTask.id) ?? currentTask,
    );
    const affectedTasks = nextTasks.filter((currentTask) =>
      sourceStatusId === nextStatusId
        ? currentTask.statusId === nextStatusId
        : currentTask.statusId === sourceStatusId ||
          currentTask.statusId === nextStatusId,
    );

    return {
      nextTasks,
      affectedTasks,
      movedTask: reorderedTasks.get(task.id) ?? movedTask,
      statusChanged: sourceStatusId !== nextStatusId,
    };
  }

  async function moveTask(
    task: KanbanTask,
    nextStatusId: string,
    targetTaskId = '',
    dropPosition: 'before' | 'after' = 'before',
  ) {
    setError(null);
    setMovingTaskId(task.id);
    const { nextTasks, affectedTasks, movedTask, statusChanged } =
      buildMovedTaskOrder(task, nextStatusId, targetTaskId, dropPosition);

    setBoardTasks(nextTasks);

    const statusResponse = statusChanged
      ? await fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            statusId: nextStatusId,
            projectId,
            position: movedTask.position,
          }),
        })
      : null;

    if (statusResponse && !statusResponse.ok) {
      setError('Could not move the task.');
      setBoardTasks(tasks);
      setMovingTaskId('');
      return;
    }

    const reorderResponse = await fetch('/api/reorder', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entityType: 'task',
        items: affectedTasks.map((currentTask) => ({
          id: currentTask.id,
          position: currentTask.position,
        })),
      }),
    });

    if (!reorderResponse.ok) {
      setError('Could not reorder the tasks.');
      setBoardTasks(tasks);
      setMovingTaskId('');
      return;
    }

    setMovingTaskId('');
    router.refresh();
  }

  function startColumnEdit(column: KanbanColumn) {
    setEditingColumnId(column.id);
    setColumnDraft({
      ...column,
      color: column.color ?? '#71717a',
    });
  }

  async function persistColumns(nextColumns: KanbanColumn[], previousColumns: KanbanColumn[], message: string) {
    const positionedColumns = withColumnPositions(nextColumns);
    setError(null);
    setSavingColumns(true);
    setBoardColumns(positionedColumns);

    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kanbanColumns: positionedColumns }),
    });

    setSavingColumns(false);

    if (!response.ok) {
      setError(message);
      setBoardColumns(previousColumns);
      return false;
    }

    router.refresh();
    return true;
  }

  async function addColumn() {
    const title = newColumnTitle.trim();

    if (!title || savingColumns || orderedColumns.length >= 12) {
      return;
    }

    const previousColumns = [...boardColumns];
    const nextColumns = [
      ...orderedColumns,
      {
        id: `column_${Date.now().toString(36)}`,
        title,
        color: newColumnColor,
        isDone: newColumnIsDone,
      },
    ];
    const didSave = await persistColumns(nextColumns, previousColumns, 'Could not add the column.');

    if (didSave) {
      setNewColumnTitle('');
      setNewColumnColor('#71717a');
      setNewColumnIsDone(false);
      setIsAddingColumn(false);
    }
  }

  async function saveColumnEdit() {
    if (!columnDraft) {
      return;
    }

    const nextColumns = orderedColumns.map((column) =>
      column.id === editingColumnId
        ? {
            ...column,
            title: columnDraft.title.trim() || column.title,
            color: columnDraft.color || column.color || '#71717a',
            isDone: columnDraft.isDone,
          }
        : column,
    );

    setEditingColumnId('');
    setColumnDraft(null);
    await persistColumns(nextColumns, boardColumns, 'Could not save the column.');
  }

  function cancelColumnEdit() {
    setEditingColumnId('');
    setColumnDraft(null);
  }

  function requestColumnDeletion(column: KanbanColumn) {
    if (orderedColumns.length <= 1) {
      setError('The board must contain at least one column.');
      return;
    }

    if (boardTasks.some((task) => task.statusId === column.id)) {
      setError('Move all tasks out of this column before deleting it.');
      return;
    }

    setError(null);
    setEditingColumnId('');
    setColumnDraft(null);
    setColumnPendingDeletion(column);
  }

  async function deleteColumn() {
    if (!columnPendingDeletion || savingColumns) return;

    const previousColumns = [...boardColumns];
    const nextColumns = orderedColumns.filter((column) => column.id !== columnPendingDeletion.id);
    setColumnPendingDeletion(null);
    await persistColumns(nextColumns, previousColumns, 'Could not delete the column.');
  }

  function handleDragStart(event: DragEvent<HTMLElement>, taskId: string) {
    event.stopPropagation();
    suppressCardNavigationRef.current = true;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(taskDragType, taskId);
    setDraggedTaskId(taskId);
  }

  function finishTaskDrag() {
    setDraggedTaskId('');
    setActiveDropColumnId('');
    setActiveDropTaskId('');
    setActiveDropTaskPosition('before');

    window.setTimeout(() => {
      suppressCardNavigationRef.current = false;
    }, 0);
  }

  function openTask(taskId: string) {
    if (suppressCardNavigationRef.current) {
      return;
    }

    const returnTo = `${window.location.pathname}${window.location.search}`;
    router.push(`/dashboard/tasks/${taskId}?returnTo=${encodeURIComponent(returnTo)}`);
  }

  function handleDragOver(event: DragEvent<HTMLElement>, columnId: string) {
    if (draggedColumnId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setActiveDropColumnId(columnId);
  }

  function handleTaskDragOver(event: DragEvent<HTMLElement>, taskId: string) {
    if (draggedColumnId) {
      return;
    }

    if (!draggedTaskId || draggedTaskId === taskId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    const bounds = event.currentTarget.getBoundingClientRect();
    const draggedTask = boardTasks.find((task) => task.id === draggedTaskId);
    const targetTask = boardTasks.find((task) => task.id === taskId);
    const tasksShareColumn = draggedTask && targetTask && draggedTask.statusId === targetTask.statusId;
    const columnTasks = tasksShareColumn
      ? getOrderedColumnTasks(boardTasks, targetTask.statusId)
      : [];
    const draggedIndex = columnTasks.findIndex((task) => task.id === draggedTaskId);
    const targetIndex = columnTasks.findIndex((task) => task.id === taskId);
    setActiveDropTaskId(taskId);
    setActiveDropTaskPosition(
      tasksShareColumn && draggedIndex >= 0 && targetIndex >= 0
        ? draggedIndex < targetIndex ? 'after' : 'before'
        : event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after',
    );
  }

  async function handleDrop(event: DragEvent<HTMLElement>, columnId: string) {
    if (draggedColumnId) {
      return;
    }

    event.preventDefault();
    const taskId = event.dataTransfer.getData(taskDragType) || draggedTaskId;
    const task = boardTasks.find((currentTask) => currentTask.id === taskId);

    setDraggedTaskId('');
    setActiveDropColumnId('');
    setActiveDropTaskId('');
    setActiveDropTaskPosition('before');

    if (!task) {
      return;
    }

    await moveTask(task, columnId);
  }

  async function handleTaskDrop(
    event: DragEvent<HTMLElement>,
    targetTask: KanbanTask,
  ) {
    if (draggedColumnId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const taskId = event.dataTransfer.getData(taskDragType) || draggedTaskId;
    const task = boardTasks.find((currentTask) => currentTask.id === taskId);
    const bounds = event.currentTarget.getBoundingClientRect();
    const dropPosition = event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after';

    setDraggedTaskId('');
    setActiveDropColumnId('');
    setActiveDropTaskId('');
    setActiveDropTaskPosition('before');

    if (!task || task.id === targetTask.id) {
      return;
    }

    await moveTask(task, targetTask.statusId, targetTask.id, dropPosition);
  }

  function handleColumnDragStart(event: DragEvent<HTMLElement>, columnId: string) {
    if ((event.target as HTMLElement).closest('[data-kanban-task-card]')) {
      return;
    }

    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(columnDragType, columnId);
    setDraggedColumnId(columnId);
  }

  function handleColumnDragOver(event: DragEvent<HTMLElement>, targetColumnId: string) {
    if (!draggedColumnId || draggedColumnId === targetColumnId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    setActiveColumnDropId(targetColumnId);
  }

  async function handleColumnDrop(event: DragEvent<HTMLElement>, targetColumnId: string) {
    const sourceColumnId = event.dataTransfer.getData(columnDragType) || draggedColumnId;

    if (!sourceColumnId || sourceColumnId === targetColumnId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const previousColumns = [...boardColumns];
    const nextColumns = [...orderedColumns];
    const sourceIndex = nextColumns.findIndex((column) => column.id === sourceColumnId);
    const targetIndex = nextColumns.findIndex((column) => column.id === targetColumnId);

    setDraggedColumnId('');
    setActiveColumnDropId('');

    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }

    const [movedColumn] = nextColumns.splice(sourceIndex, 1);
    nextColumns.splice(targetIndex, 0, movedColumn);
    await persistColumns(nextColumns, previousColumns, 'Could not reorder the columns.');
  }

  function finishColumnDrag() {
    setDraggedColumnId('');
    setActiveColumnDropId('');
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-normal text-zinc-950 dark:text-zinc-50">
            Kanban board
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {taskCount} {taskCount === 1 ? 'task' : 'tasks'} across{' '}
            {orderedColumns.length} columns
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div ref={addColumnPopoverRef} className="relative">
            <button
              type="button"
              disabled={savingColumns || orderedColumns.length >= 12}
              onClick={() => setIsAddingColumn((current) => !current)}
              className="app-form-secondary-button w-full justify-center disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              aria-expanded={isAddingColumn}
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Add column
            </button>
            {isAddingColumn ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-md border border-zinc-200 bg-white p-4 shadow-xl shadow-zinc-950/15 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                    Add Kanban column
                  </h3>
                  <button
                    type="button"
                    disabled={savingColumns}
                    onClick={() => setIsAddingColumn(false)}
                    className="grid h-7 w-7 place-items-center rounded text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-40 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                    aria-label="Close add column form"
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 grid gap-4">
                  <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Column name
                    <input
                      autoFocus
                      value={newColumnTitle}
                      onChange={(event) => setNewColumnTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') void addColumn();
                      }}
                      placeholder="For example: Review"
                      maxLength={80}
                      className="h-10 min-w-0 rounded-md bg-zinc-100 px-3 text-sm font-normal text-zinc-950 outline-none dark:bg-zinc-900 dark:text-zinc-50"
                    />
                  </label>
                  <div className="flex items-center gap-5">
                    <label className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                      <span>Color</span>
                      <input
                        type="color"
                        value={newColumnColor}
                        onChange={(event) => setNewColumnColor(event.target.value)}
                        className="kanban-color-input h-6 w-6 shrink-0 cursor-pointer rounded-sm border-0 bg-transparent p-0"
                        aria-label="New column color"
                      />
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        checked={newColumnIsDone}
                        onChange={(event) => setNewColumnIsDone(event.target.checked)}
                        className="app-form-checkbox h-4 w-4"
                      />
                      Done
                    </label>
                  </div>
                  <button
                    type="button"
                    disabled={!newColumnTitle.trim() || savingColumns}
                    onClick={() => void addColumn()}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--app-accent)] px-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Check aria-hidden="true" className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <ReturnToLink
            href={`/dashboard/tasks/new?projectId=${projectId}`}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--app-accent)] px-3 text-sm font-medium text-white transition hover:opacity-90 sm:w-auto"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New task
          </ReturnToLink>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="grid min-w-0 gap-3 overflow-x-auto pb-2 lg:grid-flow-col lg:auto-cols-[minmax(17rem,1fr)]">
        {orderedColumns.map((column) => {
          const columnTasks = boardTasks
            .filter((task) => task.statusId === column.id)
            .sort(
              (firstTask, secondTask) =>
                firstTask.position - secondTask.position,
            );
          return (
            <section
              key={column.id}
              draggable={editingColumnId !== column.id && !savingColumns}
              onDragStart={(event) => handleColumnDragStart(event, column.id)}
              onDragEnd={finishColumnDrag}
              onDragOver={(event) => {
                if (draggedColumnId) {
                  handleColumnDragOver(event, column.id);
                } else {
                  handleDragOver(event, column.id);
                }
              }}
              onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                setActiveDropColumnId('');
                setActiveColumnDropId('');
              }}
              onDrop={(event) => {
                if (draggedColumnId) {
                  void handleColumnDrop(event, column.id);
                } else {
                  void handleDrop(event, column.id);
                }
              }}
              className={`grid min-h-72 min-w-0 content-start gap-3 rounded-md border bg-zinc-50 p-3 transition dark:bg-zinc-900/70 ${
                activeDropColumnId === column.id || activeColumnDropId === column.id
                  ? 'border-[var(--app-accent)] ring-2 ring-[var(--app-accent)]/15'
                  : 'border-zinc-200 dark:border-zinc-800'
              } ${draggedColumnId === column.id ? 'opacity-60' : ''} ${editingColumnId === column.id ? '' : 'cursor-grab active:cursor-grabbing'}`}
            >
              <div className="grid gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {editingColumnId === column.id && columnDraft ? (
                      <div
                        className="grid gap-1 p-1"
                        onBlur={(event) => {
                          if (!event.currentTarget.contains(event.relatedTarget)) {
                            void saveColumnEdit();
                          }
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <input
                            type="color"
                            value={columnDraft.color ?? '#71717a'}
                            onChange={(event) =>
                              setColumnDraft({
                                ...columnDraft,
                                color: event.target.value,
                              })
                            }
                            className="kanban-color-input h-4 w-4 shrink-0 cursor-pointer rounded-sm border-0 bg-transparent p-0"
                            aria-label={`${column.title} color`}
                          />
                          <input
                            autoFocus
                            value={columnDraft.title}
                            onChange={(event) =>
                              setColumnDraft({
                                ...columnDraft,
                                title: event.target.value,
                              })
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') void saveColumnEdit();
                              if (event.key === 'Escape') cancelColumnEdit();
                            }}
                            className="h-5 min-w-0 flex-1 bg-transparent text-sm font-semibold text-zinc-950 outline-none dark:text-zinc-50"
                          />
                        </div>
                        <div className="flex h-4 items-center">
                          <label className="inline-flex h-4 items-center gap-2 text-xs text-zinc-700 [--app-checkbox-check-color:#fff] dark:text-zinc-200 dark:[--app-checkbox-check-color:#09090b]">
                            <input
                              type="checkbox"
                              checked={columnDraft.isDone}
                              onChange={(event) =>
                                setColumnDraft({
                                  ...columnDraft,
                                  isDone: event.target.checked,
                                })
                              }
                              className="app-form-checkbox h-3.5 w-3.5 border-transparent bg-zinc-200 dark:bg-zinc-700"
                            />
                            Done
                          </label>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startColumnEdit(column)}
                        className="block w-full rounded-md p-1 text-left transition hover:bg-zinc-100/80 focus-visible:bg-zinc-100/80 focus-visible:outline-none dark:hover:bg-zinc-900 dark:focus-visible:bg-zinc-900"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                column.color ?? 'var(--app-accent)',
                            }}
                          />
                          <span className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                            {column.title}
                          </span>
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                          {columnTasks.length}{' '}
                          {columnTasks.length === 1 ? 'task' : 'tasks'}
                        </span>
                      </button>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {editingColumnId === column.id ? (
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => requestColumnDeletion(column)}
                        className="grid h-7 w-7 place-items-center rounded text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                        aria-label={`Delete ${column.title} column`}
                        title="Delete column"
                      >
                        <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                    {column.isDone ? (
                      <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                        Done
                      </span>
                    ) : null}
                  </div>
                </div>
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    backgroundColor: column.color ?? 'var(--app-accent)',
                  }}
                />
              </div>

              {columnTasks.length ? (
                <div className="grid gap-3">
                  {columnTasks.map((task) => (
                    <article
                      key={task.id}
                      data-kanban-task-card
                      draggable
                      onDragStart={(event) => handleDragStart(event, task.id)}
                      onDragOver={(event) => handleTaskDragOver(event, task.id)}
                      onDragLeave={(event) => {
                        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                        setActiveDropTaskId('');
                        setActiveDropTaskPosition('before');
                      }}
                      onDrop={(event) => handleTaskDrop(event, task)}
                      onDragEnd={finishTaskDrag}
                      onClick={(event) => {
                        if ((event.target as HTMLElement).closest('a, button, input, select, textarea')) {
                          return;
                        }

                        openTask(task.id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && event.target === event.currentTarget) {
                          openTask(task.id);
                        }
                      }}
                      role="link"
                      tabIndex={0}
                      aria-label={`Open task ${task.title}`}
                      className={`group relative grid cursor-grab gap-3 rounded-md border bg-white p-3 shadow-sm transition hover:border-[var(--app-accent)] active:cursor-grabbing dark:bg-zinc-950 ${
                        activeDropTaskId === task.id
                          ? 'border-[var(--app-accent)] ring-2 ring-[var(--app-accent)]/15'
                          : 'border-zinc-200 dark:border-zinc-800'
                      } ${
                        draggedTaskId === task.id || movingTaskId === task.id
                          ? 'opacity-60'
                          : ''
                      }`}
                    >
                      {activeDropTaskId === task.id ? (
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none absolute inset-x-1 h-0.5 rounded-full bg-[var(--app-accent)] ${
                            activeDropTaskPosition === 'before' ? '-top-2' : '-bottom-2'
                          }`}
                        />
                      ) : null}
                      <div className="flex items-start gap-2">
                        <GripVertical
                          aria-hidden="true"
                          className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400"
                        />
                        <div className="min-w-0 flex-1">
                          <ReturnToLink
                            href={`/dashboard/tasks/${task.id}`}
                            draggable={false}
                            className="line-clamp-2 cursor-grab text-sm font-semibold text-zinc-950 active:cursor-grabbing dark:text-zinc-50"
                          >
                            {task.title}
                          </ReturnToLink>
                          {task.description ? (
                            <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                              {task.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[0.6875rem] font-medium leading-4 capitalize ${
                            priorityStyles[task.priority] ??
                            'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          <Gauge aria-hidden="true" className="h-3 w-3 shrink-0" />
                          {task.priority}
                        </span>
                        {task.dueDateLabel ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            <CalendarClock
                              aria-hidden="true"
                              className="h-3 w-3"
                            />
                            {task.dueDateLabel}
                          </span>
                        ) : null}
                      </div>

                      <TagList tags={task.tags} limit={3} size="compact" />
                    </article>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No tasks in this column.
                </p>
              )}
            </section>
          );
        })}
      </div>
      <ConfirmationDialog
        isOpen={Boolean(columnPendingDeletion)}
        title="Delete this column?"
        description="The empty column will be permanently removed from this Kanban board."
        confirmLabel={savingColumns ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        icon={<Trash2 aria-hidden="true" className="h-5 w-5" />}
        isPending={savingColumns}
        onCancel={() => setColumnPendingDeletion(null)}
        onConfirm={() => void deleteColumn()}
        variant="danger"
      />
    </section>
  );
}
