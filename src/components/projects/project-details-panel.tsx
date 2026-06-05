"use client";

import { useState } from "react";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { PinEntityButton } from "@/components/dashboard/pin-entity-button";
import { ProjectForm } from "@/components/projects/project-form";

type EntityOption = {
  id: string;
  title: string;
};

type KanbanColumn = {
  id: string;
  title: string;
  isDone: boolean;
};

type ProjectDetailsPanelProps = {
  projectId: string;
  checklistOptions: EntityOption[];
  title: string;
  description: string;
  priority: string;
  lifecycleStatus: string;
  dueDate: string;
  dueDateLabel?: string;
  estimatedMinutes?: number | null;
  tags: string[];
  checklistIds: string[];
  taskCount: number;
  kanbanColumns: KanbanColumn[];
  completedAtLabel?: string;
  createdAtLabel?: string;
  updatedAtLabel?: string;
  pinId?: string;
};

export function ProjectDetailsPanel({
  projectId,
  checklistOptions,
  title,
  description,
  priority,
  lifecycleStatus,
  dueDate,
  dueDateLabel,
  estimatedMinutes,
  tags,
  checklistIds,
  taskCount,
  kanbanColumns,
  completedAtLabel,
  createdAtLabel,
  updatedAtLabel,
  pinId
}: ProjectDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <ProjectForm
        mode="edit"
        projectId={projectId}
        checklistOptions={checklistOptions}
        initialTitle={title}
        initialDescription={description}
        initialPriority={priority}
        initialLifecycleStatus={lifecycleStatus}
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
        endpoint={`/api/projects/${projectId}`}
        redirectTo="/dashboard/projects"
        label="Usuń projekt"
        errorLabel="Nie udało się usunąć projektu."
      />
      <PinEntityButton targetType="project" targetId={projectId} initialPinId={pinId} />

      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      <p>status: {lifecycleStatus}</p>
      <p>priority: {priority}</p>
      {dueDateLabel ? <p>due: {dueDateLabel}</p> : null}
      {estimatedMinutes ? <p>estimated minutes: {estimatedMinutes}</p> : null}
      {tags.length ? <p>{tags.join(", ")}</p> : null}
      <p>tasks: {taskCount}</p>
      {checklistIds.length ? <p>checklists: {checklistIds.length}</p> : null}
      {completedAtLabel ? <p>completed: {completedAtLabel}</p> : null}
      {createdAtLabel ? <p>created: {createdAtLabel}</p> : null}
      {updatedAtLabel ? <p>updated: {updatedAtLabel}</p> : null}

      <h2>kanban columns</h2>
      <ul>
        {kanbanColumns.map((column) => (
          <li key={column.id}>
            {column.title} - {column.id} - {column.isDone ? "done" : "open"}
          </li>
        ))}
      </ul>
    </article>
  );
}
