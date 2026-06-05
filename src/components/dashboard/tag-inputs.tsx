"use client";

type TagInputsProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
};

export function TagInputs({ tags, onChange }: TagInputsProps) {
  function updateTag(index: number, value: string) {
    const nextTags = [...tags];
    nextTags[index] = value;
    onChange(nextTags);
  }

  function removeTag(index: number) {
    const nextTags = tags.filter((_, tagIndex) => tagIndex !== index);
    onChange(nextTags.length ? nextTags : [""]);
  }

  return (
    <fieldset>
      <legend>Tagi</legend>
      {tags.map((tag, index) => (
        <div key={index}>
          <label htmlFor={`tag-${index}`}>Tag {index + 1}</label>
          <input
            id={`tag-${index}`}
            type="text"
            value={tag}
            onChange={(event) => updateTag(index, event.target.value)}
          />
          <button type="button" onClick={() => removeTag(index)}>
            Usuń tag
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...tags, ""])}>
        Dodaj tag
      </button>
    </fieldset>
  );
}
