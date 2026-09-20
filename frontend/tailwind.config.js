/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: "var(--bg-panel, #ffffff)",
        edge: "#e2d8c8",
        accent: "var(--color-accent, #0f9488)",
        onaccent: "var(--color-on-accent, #ffffff)",
        accent2: "var(--color-accent2, #6b5b95)",
        ember: "var(--color-ember, #946000)",
        surface: "var(--bg-page, #faf6f0)",
        primary: "var(--text-primary, #16213a)",
        secondary: "var(--text-secondary, rgba(22,33,58,0.68))",
        tertiary: "var(--text-tertiary, rgba(22,33,58,0.52))",
        faint: "var(--text-faint, rgba(22,33,58,0.36))",
        subtle: "var(--border-subtle, rgba(22,33,58,0.08))",
        outline: "var(--border-default, rgba(22,33,58,0.15))",
        hoverwash: "var(--surface-hover, rgba(22,33,58,0.04))",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 32px rgba(177,80,44,0.25)",
        card: "var(--shadow-card, 0 8px 24px rgba(22,33,58,0.08))",
      },
    },
  },
  plugins: [],
};
