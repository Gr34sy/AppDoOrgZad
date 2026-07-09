"use client";

import { noteColorOptions } from "@/lib/note-colors";

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
    <fieldset className="grid gap-3">
      <legend className="app-form-legend">Color</legend>

      <div className="app-form-field">
        <label htmlFor="colorMode" className="app-form-label">
          Note color
        </label>
        <select
          id="colorMode"
          value={colorMode}
          onChange={(event) => onColorModeChange(event.target.value)}
          className="app-form-control"
        >
          <option value="">No color</option>
          {noteColorOptions.map((colorOption) => (
            <option key={colorOption.value} value={colorOption.value}>
              {colorOption.label}
            </option>
          ))}
          <option value="hexadecimal">Custom HEX</option>
        </select>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-9">
        {noteColorOptions.map((colorOption) => (
          <button
            key={colorOption.value}
            type="button"
            onClick={() => onColorModeChange(colorOption.value)}
            className={`h-9 rounded-md border transition ${
              colorMode === colorOption.value
                ? "border-zinc-950 ring-2 ring-[var(--app-accent)]/25 dark:border-white"
                : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
            }`}
            style={{ backgroundColor: colorOption.value }}
            aria-label={colorOption.label}
            title={colorOption.label}
          />
        ))}
      </div>

      {isHexadecimalColor ? (
        <div className="app-form-field">
          <label htmlFor="hexColor" className="app-form-label">
            HEX value
          </label>
          <input
            id="hexColor"
            type="color"
            value={hexColor || "#fff7cc"}
            onChange={(event) => onHexColorChange(event.target.value)}
            className="app-form-color"
          />
        </div>
      ) : null}
    </fieldset>
  );
}
