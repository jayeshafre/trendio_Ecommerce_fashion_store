/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      // ─── Brand Colors ──────────────────────────────────
      colors: {
        brand: {
          50:  "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",   // primary orange
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted:   "#f9fafb",
          subtle:  "#f3f4f6",
          border:  "#e5e7eb",
        },
      },

      // ─── Typography ────────────────────────────────────
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body:    ["'DM Sans'", "system-ui", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },

      // ─── Spacing & Sizing ──────────────────────────────
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },

      // ─── Animations ────────────────────────────────────
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%":   { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in":        "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        shimmer:          "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
