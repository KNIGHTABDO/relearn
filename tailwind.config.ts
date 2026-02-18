import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
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
        // YouLearn pastel palette
        yl: {
          purple: "#A855F7",
          blue: "#3B82F6",
          sky: "#0EA5E9",
          pink: "#F43F5E",
          orange: "#F97316",
          gold: "#EAB308",
          green: "#10B981",
          teal: "#0D9488",
          // Soft pastel backgrounds
          "purple-bg": "#F3E8FF",
          "blue-bg": "#DBEAFE",
          "sky-bg": "#E0F2FE",
          "pink-bg": "#FFE4E6",
          "orange-bg": "#FFF7ED",
          "gold-bg": "#FEF9C3",
          "green-bg": "#D1FAE5",
          "teal-bg": "#CCFBF1",
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
