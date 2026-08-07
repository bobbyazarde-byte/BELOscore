import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bourse: {
          void: "#080D17",
          nuit: "#0C1526",
          panel: "#111D33",
          ligne: "#1C2C48",
          brume: "#5C6C8A",
          brumeclair: "#8A97AC",
          texte: "#E9EDF5",
          or: "#C9A15A",
          orclair: "#E4C787",
          hausse: "#3FB68B",
          baisse: "#E2574C",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "Helvetica", "Arial", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      backgroundImage: {
        "grain": "radial-gradient(circle at 20% 20%, rgba(201,161,90,0.06), transparent 40%), radial-gradient(circle at 80% 0%, rgba(63,182,139,0.05), transparent 35%)",
      },
      keyframes: {
        scrollLeft: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "scroll-left": "scrollLeft 45s linear infinite",
        "blink-slow": "blink 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
