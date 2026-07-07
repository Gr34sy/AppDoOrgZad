type SortOption = {
  label: string;
  value: string;
};

type SortSelectProps = {
  defaultValue: string;
  label?: string;
  name?: string;
  options: SortOption[];
};

export function SortSelect({ defaultValue, label = "sort", name = "sort", options }: SortSelectProps) {
  return (
    <div className="grid min-w-0">
      <label htmlFor={name} className="sr-only">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="h-12 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
