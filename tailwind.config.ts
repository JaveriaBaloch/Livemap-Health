import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        emergency: { 50: "#fff1f1", 100: "#ffe1e1", 200: "#ffc8c8", 300: "#ffa3a3", 400: "#ff6b6b", 500: "#ff3b3b", 600: "#e81717", 700: "#c20d0d", 800: "#a00f0f", 900: "#841414" },
        safe: { 50: "#edfcf2", 100: "#d3f8e0", 200: "#aaf0c6", 300: "#73e2a4", 400: "#3acd7e", 500: "#1ab563", 600: "#0d924e", 700: "#0b7541", 800: "#0c5c35", 900: "#0a4c2d" },
        medical: { 50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a" },
        dark: { 800: "#1a1a2e", 900: "#0f0f23" },
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-emergency": "pulse-emergency 1.5s ease-in-out infinite",
        "ripple": "ripple 2s ease-out infinite",
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
      },
      keyframes: {
        "pulse-emergency": { "0%, 100%": { opacity: "1", transform: "scale(1)" }, "50%": { opacity: "0.7", transform: "scale(1.05)" } },
        "ripple": { "0%": { transform: "scale(0.8)", opacity: "1" }, "100%": { transform: "scale(2.5)", opacity: "0" } },
        "slide-up": { "0%": { transform: "translateY(20px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
    },
  },
  plugins: [],
};

export default config;
