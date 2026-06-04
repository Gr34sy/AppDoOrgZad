"use client";

const noteColorOptions = [
  "blue",
  "beige",
  "purple",
  "pink",
  "orange",
  "yellow",
  "turquoise",
  "grey",
  "darkgrey"
];

type NoteColorInputProps = {
  colorMode: string;
  hexColor: string;
  onColorModeChange: (colorMode: string) => void;
  onHexColorChange: (hexColor: string) => void;
};

export function NoteColorInput({
  colorMode,
  hexColor,
  onColorModeChange,
  onHexColorChange
}: NoteColorInputProps) {
  const isHexadecimalColor = colorMode === "hexadecimal";

  return (
    <fieldset>
      <legend>Kolor</legend>

      <div>
        <label htmlFor="colorMode">Kolor</label>
        <select
          id="colorMode"
          value={colorMode}
          onChange={(event) => onColorModeChange(event.target.value)}
        >
          <option value="">brak</option>
          {noteColorOptions.map((colorOption) => (
            <option key={colorOption} value={colorOption}>
              {colorOption}
            </option>
          ))}
          <option value="hexadecimal">hexadecimal value</option>
        </select>
      </div>

      {isHexadecimalColor ? (
        <div>
          <label htmlFor="hexColor">Wartość heksadecymalna</label>
          <input
            id="hexColor"
            type="text"
            value={hexColor}
            onChange={(event) => onHexColorChange(event.target.value)}
          />
        </div>
      ) : null}
    </fieldset>
  );
}
