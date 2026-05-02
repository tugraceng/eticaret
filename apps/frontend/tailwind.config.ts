import type { Config } from "tailwindcss";

/** 4px tabanlı aralık: tailwind spacing zaten 0.25rem (4px) grid üzerine kurulu. */
export default {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        /** Tipografi hiyerarşisi — mobil-first */
        display: ["2.25rem", { lineHeight: "1.08", letterSpacing: "-0.03em", fontWeight: "600" }],
        h1: ["1.875rem", { lineHeight: "1.12", letterSpacing: "-0.025em", fontWeight: "600" }],
        h2: ["1.375rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        h3: ["1.125rem", { lineHeight: "1.25", fontWeight: "600" }],
        body: ["0.9375rem", { lineHeight: "1.55" }],
        small: ["0.8125rem", { lineHeight: "1.45" }],
        micro: ["0.6875rem", { lineHeight: "1.3", letterSpacing: "0.08em", fontWeight: "600" }],
      },
      colors: {
        brand: {
          primary: "var(--ds-color-primary)",
          secondary: "var(--ds-color-secondary)",
          accent: "var(--ds-color-accent)",
        },
        surface: {
          DEFAULT: "var(--ds-surface)",
          muted: "var(--ds-surface-muted)",
          inverse: "var(--ds-surface-inverse)",
        },
      },
      boxShadow: {
        lift: "var(--ds-shadow-lift)",
        card: "var(--ds-shadow-card)",
      },
      borderRadius: {
        "ds-lg": "var(--ds-radius-lg)",
        "ds-xl": "var(--ds-radius-xl)",
      },
    },
  },
  plugins: [],
} satisfies Config;
