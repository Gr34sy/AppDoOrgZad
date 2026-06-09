export type LifecycleStatus = "active" | "paused" | "completed" | "archived";

export type Priority = "low" | "medium" | "high" | "urgent";

export type PinTargetType = "note" | "checklist" | "task" | "project";

export type ColorMode = "system" | "light" | "dark";

export type ThemeName = ColorMode;

export type EntityType = "note" | "checklist" | "task" | "project";

export type ActivityAction = "created" | "updated" | "deleted" | "moved" | "pinned" | "unpinned";

export type ChecklistItem = {
  title: string;
  isCompleted: boolean;
  completedAt?: Date;
  position: number;
};

export type KanbanColumn = {
  id: string;
  title: string;
  position: number;
  color: string;
  isDone: boolean;
};
