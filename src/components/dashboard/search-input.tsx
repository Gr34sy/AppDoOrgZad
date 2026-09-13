import { Search } from "lucide-react";
import type { ChangeEvent } from "react";

type SearchInputProps = {
  defaultValue: string;
  id?: string;
  label?: string;
  name?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  value?: string;
};

export function SearchInput({
  defaultValue,
  label = "search",
  name = "q",
  id = name,
  onChange,
  value
}: SearchInputProps) {
  const valueProps =
    value === undefined
      ? { defaultValue }
      : {
          value,
          onChange
        };

  return (
    <div className="w-full min-w-0 sm:max-w-2xl">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
          strokeWidth={2.25}
        />
        <input
          id={id}
          name={name}
          type="search"
          {...valueProps}
          placeholder="Search"
          className="h-11 w-full rounded-full border border-zinc-400 bg-white pl-11 pr-4 text-sm text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-700 focus:ring-2 focus:ring-zinc-950/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-300 dark:focus:ring-white/10"
        />
      </div>
    </div>
  );
}
