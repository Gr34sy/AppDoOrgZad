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
      <legend className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Color</legend>

      <div className="grid gap-2">
        <label htmlFor="colorMode" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Note color
        </label>
        <select
          id="colorMode"
          value={colorMode}
          onChange={(event) => onColorModeChange(event.target.value)}
          className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
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
        <div className="grid gap-2">
          <label htmlFor="hexColor" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            HEX value
          </label>
          <input
            id="hexColor"
            type="color"
            value={hexColor || "#fff7cc"}
            onChange={(event) => onHexColorChange(event.target.value)}
            className="h-11 w-full cursor-pointer rounded-md border border-zinc-300 bg-white px-2 py-1 shadow-sm outline-none transition focus:border-[var(--app-accent)] dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      ) : null}
    </fieldset>
  );
}
