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
    <div>
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
