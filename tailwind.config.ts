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
          200: "#c9c9cd",
          300: "#9a9aa1",
          400: "#6a6a72",
          500: "#45454c",
          600: "#2d2d33",
          700: "#1e1e23",
          800: "#131317",
          900: "#0a0a0b",
        },
        accent: {
          DEFAULT: "#0066FF",
          glow: "#3b82f6",
          subtle: "#1d4ed8",
        },
        signal: {
          DEFAULT: "#00C896",
          glow: "#10b981",
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
        "display-xl": ["clamp(3rem, 8vw, 6.5rem)", { lineHeight: "0.95", letterSpacing: "-0.035em", fontWeight: "600" }],
        "display-lg": ["clamp(2.25rem, 5vw, 4rem)", { lineHeight: "1.02", letterSpacing: "-0.03em", fontWeight: "600" }],
        "display-md": ["clamp(1.75rem, 3.5vw, 2.5rem)", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" }],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "radial-soft":
          "radial-gradient(ellipse at top, rgba(125,211,252,0.08), transparent 60%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 6s linear infinite",
        "pulse-soft": "pulseSoft 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
