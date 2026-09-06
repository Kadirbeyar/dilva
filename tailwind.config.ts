import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Tuned to match the Dilva logo gradient (violet → coral). Chosen
        // as a near-match to Tailwind's own violet scale so every shade
        // keeps solid, tested contrast against both white and dark text.
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        accent: {
          50: "#fff4ed",
          100: "#ffe6d5",
          200: "#ffc9a8",
          300: "#ffa670",
          400: "#ff8a54",
          500: "#ff7a59",
          600: "#f2593a",
          700: "#cc4429",
          800: "#a33823",
          900: "#84301f",
        },
      },
      fontFamily: {
        // Rabar/Noto Sans Arabic style fonts render Badini Kurdish (Arabic script) well.
        kurdish: ["var(--font-kurdish)", "Tahoma", "sans-serif"],
        latin: ["var(--font-latin)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
