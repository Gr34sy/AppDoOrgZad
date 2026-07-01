type FilterOption = {
  label: string;
  value: string;
};

type FilterSelectProps = {
  defaultValue: string;
  label?: string;
  name?: string;
  options: FilterOption[];
  placeholder?: string;
};

export function FilterSelect({
  defaultValue,
  label = "filter",
  name = "filter",
  options,
  placeholder = "all"
}: FilterSelectProps) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <label htmlFor={name} className="text-xs font-medium uppercase tracking-normal text-zinc-500 dark:text-zinc-400">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
