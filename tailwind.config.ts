import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "hall-background": "#05010d",
        "hall-panel": "#130a28",
        "hall-surface": "#1d0f3d",
        "hall-border": "rgba(255,255,255,0.08)",
        "neon-pink": "#ff2d95",
        "neon-blue": "#30f0ff",
        "neon-yellow": "#fff65c",
        "neon-purple": "#a855f7",
        "glow-green": "#76ffcb",
      },
      fontFamily: {
        display: ["var(--font-display)", "Orbitron", "sans-serif"],
        body: ["var(--font-body)", "Noto Sans JP", "sans-serif"],
      },
      backgroundImage: {
        "hall-grid":
          "radial-gradient(circle at top, rgba(255,45,149,0.25), transparent 55%), linear-gradient(120deg, rgba(48,240,255,0.18), rgba(5,1,13,0) 60%), repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 12px)",
      },
      boxShadow: {
        neon: "0 0 18px rgba(255,45,149,0.55), 0 0 36px rgba(48,240,255,0.45), 0 0 60px rgba(255,246,92,0.35)",
        "panel-inset": "inset 0 1px 6px rgba(255,255,255,0.12), inset 0 0 18px rgba(48,240,255,0.18)",
      },
      animation: {
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: 0.7, transform: "scale(0.98)" },
          "50%": { opacity: 1, transform: "scale(1.02)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
