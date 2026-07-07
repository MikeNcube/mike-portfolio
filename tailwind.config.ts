import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx,mdx}", "./components/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0a0a0b",
          50: "#f6f6f7",
          100: "#e8e8ea",
          // 200/300/400 tuned for WCAG AA on the #0a0d14 background:
          // 200 ≈ 12.6:1, 300 ≈ 7.9:1, 400 ≈ 4.9:1
          200: "#cfcfd4",
          300: "#a8a8b0",
          400: "#84848d",
          500: "#45454c",
          600: "#2d2d33",
          700: "#1e1e23",
          800: "#131317",
          900: "#0a0a0b",
        },
        accent: {
          DEFAULT: "#0066FF",
          // AA-safe accent for text on the dark background (≈ 5.4:1)
          glow: "#66a3ff",
          subtle: "#1d4ed8",
        },
        signal: {
          // ≈ 7.4:1 on #0a0d14
          DEFAULT: "#00C896",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
        display: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      fontSize: {
        "display-xl": [
          "clamp(2.5rem, 6vw, 4.75rem)",
          { lineHeight: "1.02", letterSpacing: "-0.03em", fontWeight: "600" },
        ],
        "display-lg": [
          "clamp(2.25rem, 5vw, 4rem)",
          { lineHeight: "1.02", letterSpacing: "-0.03em", fontWeight: "600" },
        ],
        "display-md": [
          "clamp(1.75rem, 3.5vw, 2.5rem)",
          { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
