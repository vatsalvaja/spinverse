import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Obsidian scale – the player-facing world
        obsidian: {
          950: "#07070a",
          900: "#0b0b0f",
          850: "#101015",
          800: "#15151b",
          700: "#1d1d25",
          600: "#2a2a35",
          500: "#3b3b49",
          400: "#5b5b6c",
          300: "#8a8a9a",
          200: "#b4b4c0",
          100: "#dcdce3",
        },
        // Champagne / metallic gold
        gold: {
          50: "#fbf6e8",
          100: "#f5ead0",
          200: "#ecd9a6",
          300: "#e2c47a",
          400: "#d4af4f",
          500: "#c0932f",
          600: "#9c7424",
          700: "#775720",
          800: "#4f3a17",
          900: "#2c210f",
        },
        // Accent hues used by game art and status chips
        ember: "#e0653a",
        neon: { cyan: "#6ff2ff", magenta: "#ff4fd8", violet: "#9b5cff" },
        lagoon: "#2fb8b0",
        orchid: "#c24fd1",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        num: ["var(--font-num)", "ui-monospace", "monospace"],
        pharaoh: ["var(--font-pharaoh)", "Georgia", "serif"],
        atlantis: ["var(--font-atlantis)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        admin: ["var(--font-admin)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        gold: "0 0 0 1px rgba(212,175,79,.35), 0 8px 30px -8px rgba(212,175,79,.35)",
        "gold-lg": "0 0 0 1px rgba(212,175,79,.45), 0 18px 60px -12px rgba(212,175,79,.45)",
        panel: "0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.06)",
        pop: "0 12px 32px -8px rgba(16,24,40,.22), 0 2px 6px rgba(16,24,40,.08)",
      },
      backgroundImage: {
        "gold-sheen": "linear-gradient(135deg,#f5ead0 0%,#d4af4f 38%,#9c7424 70%,#e2c47a 100%)",
        "gold-text": "linear-gradient(180deg,#fbf6e8 0%,#e2c47a 45%,#b58a2a 100%)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        shimmer: "shimmer 6s linear infinite",
        floaty: "floaty 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
