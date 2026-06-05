"use client";

import { useState } from "react";
import { ChecklistForm } from "@/components/checklists/checklist-form";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { PinEntityButton } from "@/components/dashboard/pin-entity-button";

type ChecklistDetailsPanelProps = {
  checklistId: string;
  title: string;
  description: string;
  tags: string[];
  items: {
    title: string;
    isCompleted: boolean;
  }[];
  parentType?: string | null;
  createdAtLabel?: string;
  updatedAtLabel?: string;
  pinId?: string;
};

export function ChecklistDetailsPanel({
  checklistId,
  title,
  description,
  tags,
  items,
  parentType,
  createdAtLabel,
  updatedAtLabel,
  pinId
}: ChecklistDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <ChecklistForm
        mode="edit"
        checklistId={checklistId}
        initialTitle={title}
        initialDescription={description}
        initialTags={tags}
        initialItems={items}
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
        endpoint={`/api/checklists/${checklistId}`}
        redirectTo="/dashboard/checklists"
        label="Usuń checklistę"
        errorLabel="Nie udało się usunąć checklisty."
      />
      <PinEntityButton targetType="checklist" targetId={checklistId} initialPinId={pinId} />

      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {tags.length ? <p>{tags.join(", ")}</p> : null}
      {parentType ? <p>parent: {parentType}</p> : null}
      {createdAtLabel ? <p>created: {createdAtLabel}</p> : null}
      {updatedAtLabel ? <p>updated: {updatedAtLabel}</p> : null}

      <h2>items</h2>
      <ul>
        {items.map((item, index) => (
          <li key={`${item.title}-${index}`}>
            <input type="checkbox" checked={item.isCompleted} readOnly /> {item.title}
          </li>
        ))}
      </ul>
    </article>
  );
}
