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
    <div>
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} defaultValue={defaultValue}>
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
