/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      // ─── Ivory Luxe Brand Palette ──────────────────────────
      colors: {
        // Primary action color — Warm Sand
        brand: {
          DEFAULT: "#C2A98A",
          light:   "#D4BFA6",
          dark:    "#A8906F",
        },
        // Background surfaces
        ivory: {
          DEFAULT: "#F8F5F2",  // page background
          muted:   "#EDE3D9",  // input / card fills
          subtle:  "#F3EDE7",
        },
        // Borders
        sand: {
          DEFAULT: "#E5DCD3",
          dark:    "#D4C4B8",
        },
        // Text
        charcoal: {
          DEFAULT: "#2B2B2B",
          muted:   "#7A6E67",
          light:   "#A09890",
        },
        // Semantic
        error: "#D97757",
        success: "#84cc16",
      },

      // ─── Typography ────────────────────────────────────────
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body:    ["'DM Sans'", "system-ui", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },

      // ─── Border Radius ─────────────────────────────────────
      borderRadius: {
        xl:  "0.75rem",
        "2xl": "1rem",
      },

      // ─── Box Shadows ───────────────────────────────────────
      boxShadow: {
        "ivory-sm": "0 1px 3px 0 rgba(43, 43, 43, 0.06)",
        ivory:      "0 2px 8px 0 rgba(43, 43, 43, 0.08)",
        "ivory-md": "0 4px 16px 0 rgba(43, 43, 43, 0.10)",
      },

      // ─── Animations ────────────────────────────────────────
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        shimmer:   "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};