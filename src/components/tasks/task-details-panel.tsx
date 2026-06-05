"use client";

import { useState } from "react";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { PinEntityButton } from "@/components/dashboard/pin-entity-button";
import { TaskForm } from "@/components/tasks/task-form";

type EntityOption = {
  id: string;
  title: string;
};

type TaskDetailsPanelProps = {
  taskId: string;
  projectOptions: EntityOption[];
  checklistOptions: EntityOption[];
  title: string;
  description: string;
  priority: string;
  statusId: string;
  projectId: string;
  dueDate: string;
  dueDateLabel?: string;
  estimatedMinutes?: number | null;
  tags: string[];
  checklistIds: string[];
  completedAtLabel?: string;
  createdAtLabel?: string;
  updatedAtLabel?: string;
  pinId?: string;
};

export function TaskDetailsPanel({
  taskId,
  projectOptions,
  checklistOptions,
  title,
  description,
  priority,
  statusId,
  projectId,
  dueDate,
  dueDateLabel,
  estimatedMinutes,
  tags,
  checklistIds,
  completedAtLabel,
  createdAtLabel,
  updatedAtLabel,
  pinId
}: TaskDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const projectTitle = projectOptions.find((project) => project.id === projectId)?.title;

  if (isEditing) {
    return (
      <TaskForm
        mode="edit"
        taskId={taskId}
        projectOptions={projectOptions}
        checklistOptions={checklistOptions}
        initialTitle={title}
        initialDescription={description}
        initialPriority={priority}
        initialStatusId={statusId}
        initialProjectId={projectId}
        initialDueDate={dueDate}
        initialEstimatedMinutes={estimatedMinutes}
        initialTags={tags}
        initialChecklistIds={checklistIds}
        onCancel={() => setIsEditing(false)}
        onSaved={() => setIsEditing(false)}
      />
    );
  }

  return (
    <article>
      <button type="button" onClick={() => setIsEditing(true)}>
        Edytuj
      </button>
      <DeleteEntityButton
        endpoint={`/api/tasks/${taskId}`}
        redirectTo="/dashboard/tasks"
        label="Usuń task"
        errorLabel="Nie udało się usunąć taska."
      />
      <PinEntityButton targetType="task" targetId={taskId} initialPinId={pinId} />

      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      <p>priority: {priority}</p>
      <p>status: {statusId}</p>
      {projectTitle ? <p>project: {projectTitle}</p> : null}
      {dueDateLabel ? <p>due: {dueDateLabel}</p> : null}
      {estimatedMinutes ? <p>estimated minutes: {estimatedMinutes}</p> : null}
      {tags.length ? <p>{tags.join(", ")}</p> : null}
      {checklistIds.length ? <p>checklists: {checklistIds.length}</p> : null}
      {completedAtLabel ? <p>completed: {completedAtLabel}</p> : null}
      {createdAtLabel ? <p>created: {createdAtLabel}</p> : null}
      {updatedAtLabel ? <p>updated: {updatedAtLabel}</p> : null}
    </article>
  );
}
