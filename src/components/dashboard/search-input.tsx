import { Search } from "lucide-react";

type SearchInputProps = {
  defaultValue: string;
  label?: string;
  name?: string;
};

export function SearchInput({ defaultValue, label = "search", name = "q" }: SearchInputProps) {
  return (
    <div className="w-full max-w-[472px]">
      <label htmlFor={name} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
          strokeWidth={2.25}
        />
        <input
          id={name}
          name={name}
          type="search"
          defaultValue={defaultValue}
          placeholder="Search"
          className="h-12 w-full rounded-full border border-zinc-400 bg-white pl-12 pr-4 text-base text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-700 focus:ring-2 focus:ring-zinc-950/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-300 dark:focus:ring-white/10"
        />
      </div>
    </div>
  );
}
