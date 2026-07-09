type SaveChangesButtonProps = {
  isDirty: boolean;
  isSaving: boolean;
  onClick: () => void;
  label?: string;
  savingLabel?: string;
};

export function SaveChangesButton({
  isDirty,
  isSaving,
  onClick,
  label = "Save changes",
  savingLabel = "Saving..."
}: SaveChangesButtonProps) {
  if (!isDirty) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSaving}
      className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[var(--app-accent)] px-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {isSaving ? savingLabel : label}
    </button>
  );
}
