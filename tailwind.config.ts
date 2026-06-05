import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Marca Formatto ─────────────────────────────
        formatto: {
          white:   "#FFFFFF",
          cream:   "#F5F0E8",
          linen:   "#EDE6D6",
          sand:    "#D4C9B0",
          bark:    "#8C7355",
          umber:   "#5C4A32",
          grafito: "#2B2B2B",
          rojo:    "#D35132",
          border:  "#E8E4DC",
          faint:   "#FAFAF8",
          sub:     "#6B8E9F",
        },
        eval: {
          MB: "#1B4F8A",
          B:  "#3A7D58",
          R:  "#D35132",
          M:  "#9E4E00",
        },
        // ─── Tokens semánticos shadcn (CSS vars) ────────
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        sans: ["Titillium Web", "Helvetica Neue", "Arial", "sans-serif"],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "1.4", letterSpacing: "0.1em" }],
        xs:   ["11px", { lineHeight: "1.5" }],
        sm:   ["12px", { lineHeight: "1.5" }],
        base: ["13px", { lineHeight: "1.6" }],
        md:   ["14px", { lineHeight: "1.6" }],
        lg:   ["16px", { lineHeight: "1.4" }],
        xl:   ["18px", { lineHeight: "1.3" }],
        "2xl": ["28px", { lineHeight: "1.15" }],
        "3xl": ["36px", { lineHeight: "1.1" }],
        "4xl": ["44px", { lineHeight: "1.05" }],
        "5xl": ["56px", { lineHeight: "1" }],
      },
      fontWeight: {
        light:    "300",
        normal:   "400",
        semibold: "600",
        bold:     "700",
        black:    "900",
      },
      borderRadius: {
        none: "0px",
        sm:   "2px",
        DEFAULT: "2px",
        md:   "3px",
        lg:   "4px",
        full: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06)",
        none: "none",
      },
      spacing: {
        "0.5": "2px",
        "1":   "4px",
        "1.5": "6px",
        "2":   "8px",
        "2.5": "10px",
        "3":   "12px",
        "3.5": "14px",
        "4":   "16px",
        "5":   "20px",
        "6":   "24px",
        "8":   "32px",
        "10":  "40px",
        "12":  "48px",
        "sidebar": "220px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
