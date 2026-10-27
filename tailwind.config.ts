import type { Config } from "tailwindcss";

// All colors are driven by CSS custom properties (RGB channel triplets)
// so they flip automatically when the .dark class is toggled on <html>.
// Dark mode is class-based, not media-query-based, so the toggle works.

const config: Config = {
  content: ["./app/**/*.{ts,tsx,mdx}", "./components/**/*.{ts,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Semantic tokens — values come from CSS variables in globals.css
        page: "rgb(var(--page) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
        },
        accent: "rgb(var(--accent) / <alpha-value>)",
        signal: "rgb(var(--signal) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      // Type scale: 17–18px body, real hierarchy from micro → display-xl
      fontSize: {
        micro: ["0.75rem", { lineHeight: "1.4" }],        // 12px — real code/meta only
        caption: ["0.8125rem", { lineHeight: "1.5" }],    // 13px
        sm: ["0.9375rem", { lineHeight: "1.55" }],        // 15px
        base: ["1.0625rem", { lineHeight: "1.65" }],      // 17px — body
        lg: ["1.125rem", { lineHeight: "1.6" }],          // 18px — body-lg
        xl: ["1.25rem", { lineHeight: "1.4" }],           // 20px
        "2xl": ["1.5rem", { lineHeight: "1.25" }],        // 24px
        "3xl": ["1.875rem", { lineHeight: "1.15" }],      // 30px
        "display-sm": [
          "clamp(1.75rem, 3vw, 2.25rem)",
          { lineHeight: "1.1", letterSpacing: "-0.025em", fontWeight: "600" },
        ],
        display: [
          "clamp(2rem, 4vw, 3rem)",
          { lineHeight: "1.05", letterSpacing: "-0.03em", fontWeight: "500" },
        ],
        "display-lg": [
          "clamp(2.5rem, 5vw, 4rem)",
          { lineHeight: "1.02", letterSpacing: "-0.035em", fontWeight: "500" },
        ],
      },
      maxWidth: {
        prose: "64ch",
        content: "1280px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pipeline-flow": {
          "0%": { strokeDashoffset: "100" },
          "100%": { strokeDashoffset: "0" },
        },
        dot: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease both",
        "slide-up": "slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        dot: "dot 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
