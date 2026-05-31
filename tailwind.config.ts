import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2fbf8",
          100: "#d4f3e8",
          500: "#16a085",
          600: "#0e806d",
          900: "#06463f"
        }
      }
    }
  },
  plugins: []
};

export default config;
