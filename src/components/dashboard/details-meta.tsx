type DetailsMetaProps = {
  createdAtLabel?: string;
  updatedAtLabel?: string;
};

export function DetailsMeta({ createdAtLabel, updatedAtLabel }: DetailsMetaProps) {
  if (!createdAtLabel && !updatedAtLabel) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 sm:gap-3 dark:text-zinc-400">
      {createdAtLabel ? <p>Created {createdAtLabel}</p> : null}
      {createdAtLabel && updatedAtLabel ? (
        <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">
          |
        </span>
      ) : null}
      {updatedAtLabel ? <p>Updated {updatedAtLabel}</p> : null}
    </div>
  );
}
