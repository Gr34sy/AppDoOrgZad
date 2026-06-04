type SearchInputProps = {
  defaultValue: string;
  label?: string;
  name?: string;
};

export function SearchInput({ defaultValue, label = "search", name = "q" }: SearchInputProps) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type="search" defaultValue={defaultValue} />
    </div>
  );
}
