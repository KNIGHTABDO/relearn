import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        yl: {
          purple: "#A855F7",
          blue: "#3B82F6",
          sky: "#0EA5E9",
          pink: "#F43F5E",
          orange: "#F97316",
          gold: "#EAB308",
          green: "#10B981",
          teal: "#0D9488",
          "purple-bg": "#F3E8FF",
          "blue-bg": "#DBEAFE",
          "sky-bg": "#E0F2FE",
          "pink-bg": "#FFE4E6",
          "orange-bg": "#FFF7ED",
          "gold-bg": "#FEF9C3",
          "green-bg": "#D1FAE5",
          "teal-bg": "#CCFBF1",
          // Dark mode pastel backgrounds — muted, rich
          "purple-bg-dark": "#2e1065",
          "blue-bg-dark": "#172554",
          "sky-bg-dark": "#0c4a6e",
          "pink-bg-dark": "#4c0519",
          "orange-bg-dark": "#431407",
          "gold-bg-dark": "#422006",
          "green-bg-dark": "#064e3b",
          "teal-bg-dark": "#134e4a",
        },
        // Dark mode surface colors
        dark: {
          bg: "#0a0a0a",
          surface: "#141414",
          card: "#1a1a1a",
          border: "#262626",
          "border-subtle": "#1f1f1f",
          hover: "#1f1f1f",
          text: "#fafafa",
          "text-secondary": "#a3a3a3",
          "text-muted": "#737373",
        },
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-out-left": {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(-100%)", opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-left": "slide-out-left 0.2s ease-in",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
