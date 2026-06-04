"use client";

type NoteTagInputsProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
};

export function NoteTagInputs({ tags, onChange }: NoteTagInputsProps) {
  const tagFields = tags.length ? tags : [""];

  function updateTag(index: number, value: string) {
    onChange(tagFields.map((tag, tagIndex) => (tagIndex === index ? value : tag)));
  }

  function addTag() {
    onChange([...tagFields, ""]);
  }

  function removeTag(index: number) {
    onChange(tagFields.filter((_tag, tagIndex) => tagIndex !== index));
  }

  return (
    <fieldset>
      <legend>Tagi</legend>

      {tagFields.map((tag, index) => (
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

      <button type="button" onClick={addTag}>
        Dodaj tag
      </button>
    </fieldset>
  );
}
